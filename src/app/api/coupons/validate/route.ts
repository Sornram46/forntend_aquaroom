import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  try {
    console.log('🎫 Coupon validation API called');
    
    const contentType = request.headers.get('content-type');
    console.log('📋 Content-Type:', contentType);
    
    let body;
    try {
      const rawBody = await request.text();
      console.log('📄 Raw body:', rawBody);
      
      if (!rawBody || rawBody.trim() === '') {
        return NextResponse.json({
          success: false,
          error: 'ไม่มีข้อมูลใน request body'
        }, { status: 400 });
      }
      
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return NextResponse.json({
        success: false,
        error: 'รูปแบบข้อมูลไม่ถูกต้อง (ต้องเป็น JSON)'
      }, { status: 400 });
    }

    const { code, order_total, items, email } = body;

    console.log('🎫 Request data:', { code, order_total });

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'กรุณาระบุรหัสคูปอง'
      }, { status: 400 });
    }

    if (!order_total) {
      return NextResponse.json({
        success: false,
        error: 'กรุณาระบุยอดสั่งซื้อ'
      }, { status: 400 });
    }

    // เรียก Backend API แทน
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    console.log('🔗 Calling backend API:', `${backendUrl}/api/coupons/validate`);
    
    const response = await fetch(`${backendUrl}/api/coupons/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        order_amount: Number(order_total),
        items,
        email
      })
    });

    const backendData = await response.json();
    console.log('🎫 Backend response:', backendData);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: backendData.message || backendData.error || 'ไม่สามารถตรวจสอบคูปองได้'
      }, { status: response.status });
    }

    // ส่งต่อข้อมูลจาก backend
    return NextResponse.json({
      success: true,
      data: backendData.data || backendData
    });

  } catch (error) {
    console.error('❌ Error calling backend API:', error);
    return NextResponse.json({
      success: false,
      error: 'ไม่สามารถเชื่อมต่อกับระบบหลังบ้านได้'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/admin/coupons?status=active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Coupon validation API is working',
      available_coupons: data.data || data.coupons || []
    });

  } catch (error) {
    console.error('❌ Error fetching coupons from backend:', error);
    return NextResponse.json({
      success: false,
      error: 'ไม่สามารถดึงข้อมูลคูปองได้',
      details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
    }, { status: 500 });
  }
}