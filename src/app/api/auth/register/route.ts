import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    
    // ตรวจสอบว่ามีข้อมูลครบหรือไม่
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const checkEmailQuery = 'SELECT * FROM users WHERE email = $1';
    const existingUser = await query(checkEmailQuery, [email]);
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'อีเมลนี้มีผู้ใช้งานแล้ว' },
        { status: 400 }
      );
    }
    
    // เข้ารหัสรหัสผ่าน
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // สร้างผู้ใช้ใหม่
    const insertQuery = `
      INSERT INTO users (name, email, password, auth_provider, is_active, role)
      VALUES ($1, $2, $3, 'local', TRUE, 'customer')
      RETURNING id, name, email, role, avatar, created_at
    `;
    
    const result = await query(insertQuery, [name, email, hashedPassword]);
    const newUser = result.rows[0];
    
    // สร้าง user object ที่จะส่งกลับไปยัง client (ไม่รวมรหัสผ่าน)
    const user = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar || null,
      created_at: newUser.created_at
    };
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'สมัครสมาชิกสำเร็จ', 
        user
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
      { status: 500 }
    );
  }
}