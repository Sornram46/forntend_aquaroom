import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

// ดึงข้อมูลผู้ใช้
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }
    
    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      userId: string;
    };
    
    // ดึงข้อมูลผู้ใช้
    const userQuery = `
      SELECT id, name, email, avatar, created_at, role
      FROM users
      WHERE id = $1
    `;
    
    const result = await query(userQuery, [decoded.userId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้' },
      { status: 500 }
    );
  }
}

// อัปเดตข้อมูลผู้ใช้
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }
    
    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      userId: string;
    };
    
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const avatarFile = formData.get('avatar') as File;
    
    // เตรียมข้อมูลสำหรับการอัปเดต
    let avatarPath = null;
    let updateFields = ['name', 'phone'];
    let updateValues = [name, phone];
    
    // ถ้ามีการอัปโหลดอวาตาร์ใหม่
    if (avatarFile) {
      // สร้างโฟลเดอร์สำหรับเก็บไฟล์ (ถ้ายังไม่มี)
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Error creating directory:', err);
      }
      
      // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
      const fileExtension = avatarFile.name.split('.').pop();
      const fileName = `avatar_${decoded.userId}_${uuidv4()}.${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      
      // บันทึกไฟล์
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      await writeFile(filePath, buffer);
      
      // เก็บ path สำหรับเข้าถึงไฟล์ผ่าน URL
      avatarPath = `/uploads/avatars/${fileName}`;
      
      // เพิ่มฟิลด์ avatar ในการอัปเดต
      updateFields.push('avatar');
      updateValues.push(avatarPath);
    }
    
    // สร้าง SQL query สำหรับการอัปเดต
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const updateQuery = `
      UPDATE users
      SET ${setClause}
      WHERE id = $1
      RETURNING id, name, email, phone, avatar, created_at, role
    `;
    
    // ใส่ userId เป็นพารามิเตอร์แรก
    const queryParams = [decoded.userId, ...updateValues];
    
    // ดำเนินการอัปเดต
    const result = await query(updateQuery, queryParams);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้' },
      { status: 500 }
    );
  }
}