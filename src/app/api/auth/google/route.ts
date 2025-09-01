import jwt from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

interface GoogleUserData {
  sub: string;
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
}

export async function POST(request: Request) {
  try {
    const { credential } = await request.json();
    
    if (!credential) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการยืนยันตัวตน' },
        { status: 400 }
      );
    }
    
    // ถอดรหัส token จาก Google
    const decodedUser = jwtDecode<GoogleUserData>(credential);
    
    // ตรวจสอบว่า Google ได้ยืนยันอีเมลแล้วหรือไม่
    if (!decodedUser.email_verified) {
      return NextResponse.json(
        { success: false, message: 'อีเมลยังไม่ได้รับการยืนยัน' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้นี้มีอยู่แล้วหรือไม่
    const findUserQuery = `
      SELECT * FROM users 
      WHERE (email = $1 AND auth_provider = 'google') 
         OR (auth_provider_id = $2)
    `;
    
    const result = await query(findUserQuery, [decodedUser.email, decodedUser.sub]);
    
    let user;
    
    if (result.rows.length === 0) {
      // สร้างผู้ใช้ใหม่
      const insertQuery = `
        INSERT INTO users 
        (name, email, auth_provider, auth_provider_id, avatar, is_email_verified, is_active, role)
        VALUES ($1, $2, 'google', $3, $4, TRUE, TRUE, 'customer')
        RETURNING id, name, email, role, avatar
      `;
      
      const insertResult = await query(insertQuery, [
        decodedUser.name,
        decodedUser.email,
        decodedUser.sub,
        decodedUser.picture
      ]);
      
      user = insertResult.rows[0];
    } else {
      // อัปเดตข้อมูลผู้ใช้ที่มีอยู่
      user = result.rows[0];
      
      const updateQuery = `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP,
            name = $1,
            avatar = $2
        WHERE id = $3
        RETURNING id, name, email, role, avatar
      `;
      
      const updateResult = await query(updateQuery, [
        decodedUser.name,
        decodedUser.picture,
        user.id
      ]);
      
      user = updateResult.rows[0];
    }
    
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
    
    // ตั้งค่า HTTP-only cookie สำหรับ token
    const res = NextResponse.redirect(new URL('/', request.url)); // หรือ NextResponse.json(...)
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
    
    // สร้าง user object ที่จะส่งกลับไปยัง client
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'เข้าสู่ระบบด้วย Google สำเร็จ', 
        user: userData,
        token
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // ...existing codeที่สร้าง token...
  const token = /* สร้าง JWT ของคุณ */ '';

  // สร้าง response และตั้ง cookie บน response
  const res = NextResponse.redirect(new URL('/', request.url)); // แก้เส้นทางตามที่ต้องการ
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}