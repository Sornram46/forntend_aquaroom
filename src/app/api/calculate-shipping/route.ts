import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
                     process.env.API_BASE_URL || 
                     'https://backend-aquaroom.vercel.app';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log('🚚 Calculating shipping for:', body.items?.length, 'items');
    
    const backendUrl = `${API_BASE_URL}/api/calculate-shipping`;
    console.log('📡 Calling backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Backend error:', data);
      return NextResponse.json(
        { success: false, message: data.error || 'ไม่สามารถคำนวณค่าจัดส่งได้' },
        { status: response.status }
      );
    }
    
    console.log('✅ Shipping calculated:', data.shippingCost);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Shipping calculation error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการคำนวณค่าจัดส่ง' },
      { status: 500 }
    );
  }
}