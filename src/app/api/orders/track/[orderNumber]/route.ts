import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const orderNumber = params.orderNumber;
    
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
    
    // ดึงข้อมูลคำสั่งซื้อ
    const orderQuery = `
      SELECT o.id, o.order_number, o.total_amount, o.payment_method, 
             o.payment_status, o.order_status, o.tracking_number, o.shipping_company,
             o.estimated_delivery, o.created_at, o.updated_at
      FROM orders o
      WHERE o.order_number = $1 AND o.user_id = $2
    `;
    
    const orderResult = await query(orderQuery, [orderNumber, decoded.userId]);
    
    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบคำสั่งซื้อที่ระบุ' },
        { status: 404 }
      );
    }
    
    const order = orderResult.rows[0];
    
    // ดึงข้อมูลรายการสินค้าในคำสั่งซื้อ
    const itemsQuery = `
      SELECT oi.id, oi.product_id, p.name as product_name, oi.quantity, 
             oi.price, oi.total, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;
    
    const itemsResult = await query(itemsQuery, [order.id]);
    
    // สร้างขั้นตอนการจัดส่งตามสถานะปัจจุบัน
    const deliverySteps = generateDeliverySteps(order);
    
    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: itemsResult.rows,
        delivery_steps: deliverySteps
      }
    });
    
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลการติดตามคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}

// ฟังก์ชันสร้างขั้นตอนการจัดส่งตามสถานะปัจจุบัน
function generateDeliverySteps(order: any) {
  const steps = [
    {
      step: 1,
      title: 'ยืนยันคำสั่งซื้อ',
      description: 'คำสั่งซื้อของคุณได้รับการยืนยันเรียบร้อยแล้ว',
      status: 'completed' as const,
      date: new Date(order.created_at).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      step: 2,
      title: 'รอการชำระเงิน',
      description: 'รอการตรวจสอบการชำระเงิน',
      status: order.payment_status === 'paid' ? 'completed' as const : 'current' as const,
      date: order.payment_status === 'paid' ? new Date(order.updated_at).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : undefined
    }
  ];
  
  // เพิ่มขั้นตอนการเตรียมจัดส่ง
  if (order.payment_status === 'paid') {
    steps.push({
      step: 3,
      title: 'เตรียมจัดส่ง',
      description: 'กำลังเตรียมสินค้าเพื่อจัดส่ง',
      status: 
        order.order_status === 'confirmed' || 
        order.order_status === 'shipped' || 
        order.order_status === 'delivered' ? 'completed' as const :
        order.payment_status === 'paid' ? 'current' as const : 'upcoming' as const,
      date: order.order_status === 'confirmed' || order.order_status === 'shipped' || order.order_status === 'delivered' ?
        new Date(order.updated_at).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : undefined
    });
  }
  
  // เพิ่มขั้นตอนการจัดส่ง
  if (order.order_status === 'shipped' || order.order_status === 'delivered') {
    steps.push({
      step: 4,
      title: 'จัดส่งแล้ว',
      description: order.tracking_number ? 
        `พัสดุถูกจัดส่งแล้ว (เลขพัสดุ: ${order.tracking_number})` : 
        'พัสดุถูกจัดส่งแล้ว',
      status: order.order_status === 'delivered' ? 'completed' as const : 'current' as const,
      date: new Date(order.updated_at).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    });
  }
  
  // เพิ่มขั้นตอนการได้รับสินค้า
  if (order.order_status !== 'cancelled') {
    steps.push({
      step: 5,
      title: 'ได้รับสินค้าแล้ว',
      description: 'คุณได้รับสินค้าเรียบร้อยแล้ว',
      status: order.order_status === 'delivered' ? 'completed' as const : 'upcoming' as const,
      date: order.order_status === 'delivered' ? 
        new Date(order.updated_at).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : undefined
    });
  }
  
  // กรณีคำสั่งซื้อถูกยกเลิก
  if (order.order_status === 'cancelled') {
    return [
      steps[0], // ยืนยันคำสั่งซื้อ
      {
        step: 2,
        title: 'คำสั่งซื้อถูกยกเลิก',
        description: 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว',
        status: 'completed' as const,
        date: new Date(order.updated_at).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    ];
  }
  
  return steps;
}