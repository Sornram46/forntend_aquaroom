import { NextRequest, NextResponse } from 'next/server';

// POST - ส่งข้อความติดต่อ
export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await request.json();
    
    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ส่งข้อมูลไปยัง Admin API
    const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${adminApiUrl}/api/contact-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        subject,
        message
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit contact message');
    }

    const result = await response.json();

    // TODO: ส่งอีเมลแจ้งเตือนให้ admin (optional)
    
    return NextResponse.json({
      success: true,
      message: 'ขอบคุณสำหรับข้อความของคุณ เราจะติดต่อกลับโดยเร็วที่สุด',
      data: result.data
    });

  } catch (error) {
    console.error('Error submitting contact message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองอีกครั้ง' 
      },
      { status: 500 }
    );
  }
}

// GET - ดึง contact setting สำหรับ frontend
export async function GET(request: NextRequest) {
  try {
    const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:5000';
    const response = await fetch(`${adminApiUrl}/api/contact-setting`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถโหลดข้อมูลติดต่อ' },
      { status: 500 }
    );
  }
}
