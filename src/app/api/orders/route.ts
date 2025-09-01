import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // รับข้อมูลเป็น JSON
    const body = await request.json();
    const { 
      addressId, 
      paymentMethod, 
      subtotal, 
      shippingFee, 
      discount, 
      couponCode, 
      totalAmount, 
      cartItems,
      paymentProofUrl,
      couponId,           // เพิ่ม coupon_id
      couponDiscount      // เพิ่ม coupon_discount
    } = body;

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
    
    console.log('📦 Creating order via backend API...');
    console.log('Received cart items:', cartItems);

    // แปลงข้อมูล cartItems ให้ตรงกับ Backend requirements
    let processedItems;
    try {
      const items = typeof cartItems === 'string' ? JSON.parse(cartItems) : cartItems;
      
      // แปลงข้อมูลสินค้าให้ตรงกับ Backend
      processedItems = items.map((item: any) => ({
        product_id: item.id,           
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        total: (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)
      }));
      
      console.log('📤 Processed items for backend:', processedItems);
      
    } catch (parseError) {
      console.error('❌ Error parsing cart items:', parseError);
      return NextResponse.json(
        { success: false, message: 'ข้อมูลสินค้าในตะกร้าไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าทุก item มี product_id
    const invalidItems = processedItems.filter((item: any) => !item.product_id);
    if (invalidItems.length > 0) {
      console.error('❌ Items without product_id:', invalidItems);
      return NextResponse.json(
        { success: false, message: 'พบสินค้าที่ไม่มี ID ในตะกร้า กรุณาลองใหม่อีกครั้ง' },
        { status: 400 }
      );
    }

    // แปลงข้อมูลให้ตรงกับ orders schema
    const orderData = {
      user_id: parseInt(decoded.userId),
      address_id: parseInt(addressId),
      total_amount: parseFloat(totalAmount),
      subtotal: parseFloat(subtotal),
      shipping_fee: parseFloat(shippingFee) || 0,
      discount: parseFloat(discount) || 0,
      
      // ข้อมูลคูปอง
      coupon_id: couponId ? parseInt(couponId) : null,
      coupon_code: couponCode || null,
      coupon_discount: couponDiscount ? parseFloat(couponDiscount) : null,
      
      // ข้อมูลการชำระเงิน
      payment_method: paymentMethod,
      payment_status: 'pending',
      order_status: 'processing',
      
      // ข้อมูลสินค้า
      items: processedItems,
      
      // หลักฐานการโอนเงิน (ถ้ามี)
      payment_proof_url: paymentProofUrl || null,
      
      // ข้อมูลเพิ่มเติม
      status: 'pending', // for backward compatibility
      notes: null
    };
    
    // เรียก Backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    console.log('🔗 Calling backend API:', `${backendUrl}/api/orders`);
    console.log('📤 Sending data:', orderData);

    const response = await fetch(`${backendUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData)
    });

    console.log('📊 Response status:', response.status);

    // ตรวจสอบ Content-Type ก่อน parse JSON
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('❌ Backend returned non-JSON response:', textResponse);
      
      return NextResponse.json(
        { success: false, message: 'Backend API ไม่ตอบสนอง (ไม่ใช่ JSON)' },
        { status: 502 }
      );
    }

    const backendData = await response.json();
    console.log('📥 Backend response:', backendData);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: backendData.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' },
        { status: response.status }
      );
    }

    // สร้าง response ที่มี orderNumber แน่นอน
    const orderResponse = {
      success: true,
      order: {
        ...backendData.order || backendData,
        orderNumber: backendData.order?.order_number || 
                    backendData.order?.orderNumber || 
                    backendData.order_number || 
                    backendData.orderNumber ||
                    `ORD${Date.now()}` // fallback
      }
    };

    console.log('📤 Sending response to frontend:', orderResponse);

    return NextResponse.json(orderResponse, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}

// GET method ยังคงเหมือนเดิม...
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
    
    // เรียก Backend API แทนการ query ตรง
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    console.log('📋 Fetching orders from backend for user:', decoded.userId);
    
    const response = await fetch(`${backendUrl}/api/orders?user_id=${decoded.userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    });

    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return NextResponse.json(
          { success: false, message: errorData.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ' },
          { status: response.status }
        );
      } else {
        const textResponse = await response.text();
        console.error('❌ Backend returned non-JSON error response:', textResponse);
        return NextResponse.json(
          { success: false, message: 'Backend API ไม่ตอบสนอง' },
          { status: 502 }
        );
      }
    }

    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('❌ Backend returned non-JSON response for GET:', textResponse);
      return NextResponse.json(
        { success: false, message: 'Backend API ไม่ตอบสนอง (ไม่ใช่ JSON)' },
        { status: 502 }
      );
    }

    const backendData = await response.json();
    
    return NextResponse.json({
      success: true,
      orders: backendData.orders || backendData.data || []
    });
    
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}