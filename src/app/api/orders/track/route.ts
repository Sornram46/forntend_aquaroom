import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }
    
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุหมายเลขคำสั่งซื้อ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบ token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
        userId: string;
      };
    } catch (jwtError) {
      console.error('❌ JWT Error:', jwtError);
      return NextResponse.json(
        { success: false, message: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
    // เรียก Backend API เพื่อตรวจสอบว่าคำสั่งซื้อมีอยู่หรือไม่
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    console.log('🔍 Checking order existence:', orderNumber);
    console.log('🔗 Backend URL:', `${backendUrl}/api/orders/track/${orderNumber}`);
    
    try {
      const response = await fetch(`${backendUrl}/api/orders/track/${orderNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      console.log('📊 Backend response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { success: false, message: 'ไม่พบคำสั่งซื้อที่ระบุ' },
            { status: 404 }
          );
        }

        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, message: errorData.message || 'เกิดข้อผิดพลาดในการตรวจสอบคำสั่งซื้อ' },
          { status: response.status }
        );
      }

      // ตรวจสอบ Content-Type
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Backend returned non-JSON response:', textResponse);
        return NextResponse.json(
          { success: false, message: 'Backend API ไม่ตอบสนองในรูปแบบ JSON' },
          { status: 502 }
        );
      }

      const backendData = await response.json();
      console.log('📦 Backend response:', backendData);

      // ถ้าพบคำสั่งซื้อ ส่งกลับว่ามีอยู่
      return NextResponse.json({
        success: true,
        exists: true,
        order: backendData.order || backendData
      });

    } catch (fetchError) {
      console.error('❌ Error connecting to backend:', fetchError);
      
      // ถ้า Backend ไม่ตอบสนอง ให้ส่งกลับว่าไม่พบ
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถเชื่อมต่อกับ Backend API ได้' },
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('❌ Error checking order:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}