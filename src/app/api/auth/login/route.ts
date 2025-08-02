import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // ตรวจสอบข้อมูล
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      );
    }
    
    // ค้นหาผู้ใช้จากอีเมล
    const findUserQuery = 'SELECT * FROM users WHERE email = $1 AND auth_provider = $2';
    const result = await query(findUserQuery, [email, 'local']);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
    const user = result.rows[0];
    
    // เปรียบเทียบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // บันทึกการล็อกอินที่ล้มเหลว
      await query(
        'UPDATE users SET login_attempts = login_attempts + 1, last_failed_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      
      return NextResponse.json(
        { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
    // รีเซ็ตการล็อกอินที่ล้มเหลว และอัปเดตเวลาล็อกอินล่าสุด
    await query(
      'UPDATE users SET login_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // สร้าง JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    // สร้าง user object ที่จะส่งกลับไปยัง client (ไม่รวมรหัสผ่าน)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null
    };
    
    // ตั้งค่า HTTP-only cookie สำหรับ token
    await cookies().set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', 
        maxAge: 60 * 60 * 24 * 7, // 7 วัน
        path: '/'
      });
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'เข้าสู่ระบบสำเร็จ', 
        user: userData,
        token // ส่ง token กลับไปด้วยเพื่อเก็บใน localStorage (สำหรับ AuthContext)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}