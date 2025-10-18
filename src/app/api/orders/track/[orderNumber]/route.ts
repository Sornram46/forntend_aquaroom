import { NextRequest, NextResponse } from 'next/server';

//

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await context.params;

    const BASE =
      process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      'http://localhost:5000';

    const res = await fetch(`${BASE}/api/orders/track/${encodeURIComponent(orderNumber)}`, {
      headers: {
        accept: 'application/json',
        authorization: request.headers.get('authorization') || '',
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      if (contentType.includes('application/json')) {
        const err = await res.json().catch(() => null);
        return NextResponse.json(err ?? { success: false }, { status: res.status });
      }
      const text = await res.text().catch(() => '');
      return NextResponse.json({ success: false, detail: text }, { status: res.status });
    }

    const data = contentType.includes('application/json')
      ? await res.json().catch(() => ({}))
      : {};

    // normalize หลายรูปแบบของ backend → ให้เหลือ order เดียว
    const pickOrder = (d: any) => {
      if (!d || typeof d !== 'object') return null;
      return (
        d.order ??
        d.data?.order ??
        d.data ??
        (Array.isArray(d.orders) ? d.orders.find((o: any) =>
          (o?.order_number ?? o?.orderNumber) === orderNumber
        ) ?? d.orders[0] : d.orders) ??
        d.result ??
        d.payload ??
        null
      );
    };

    const order = pickOrder(data);
    const normalized = {
      success: data?.success ?? Boolean(order),
      order,
      orderNumber: order?.order_number ?? order?.orderNumber ?? orderNumber,
    };

    return NextResponse.json(normalized);
  } catch (e) {
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้' },
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
      date: order.created_at ? new Date(order.created_at).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'ไม่ระบุ'
    },
    {
      step: 2,
      title: 'รอการชำระเงิน',
      description: order.payment_method === 'bank_transfer' ? 
        'รอการตรวจสอบหลักฐานการโอนเงิน กรุณารอการยืนยันจากทางร้าน' : 
        'รอการตรวจสอบการชำระเงิน',
      status: order.payment_status === 'paid' ? 'completed' as const : 'current' as const,
      date: order.payment_status === 'paid' && order.updated_at ? 
        new Date(order.updated_at).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : undefined
    }
  ];
  
  // เพิ่มขั้นตอนอื่นๆ ตามสถานะ
  if (order.payment_status === 'paid') {
    steps.push({
      step: 3,
      title: 'เตรียมจัดส่ง',
      description: 'กำลังเตรียมสินค้าเพื่อจัดส่ง',
      status: 
        ['confirmed', 'shipped', 'delivered'].includes(order.order_status) ? 'completed' as const :
        'current' as const,
      date: ['confirmed', 'shipped', 'delivered'].includes(order.order_status) && order.updated_at ?
        new Date(order.updated_at).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : undefined
    });
  }
  
  if (['shipped', 'delivered'].includes(order.order_status)) {
    steps.push({
      step: 4,
      title: 'จัดส่งแล้ว',
      description: order.tracking_number ? 
        `พัสดุถูกจัดส่งแล้ว (เลขพัสดุ: ${order.tracking_number})` : 
        'พัสดุถูกจัดส่งแล้ว',
      status: order.order_status === 'delivered' ? 'completed' as const : 'current' as const,
      date: order.updated_at ? new Date(order.updated_at).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : undefined
    });
  }
  
  if (order.order_status !== 'cancelled') {
    steps.push({
      step: 5,
      title: 'ได้รับสินค้าแล้ว',
      description: 'คุณได้รับสินค้าเรียบร้อยแล้ว',
      status: order.order_status === 'delivered' ? 'completed' as const : 'current' as const,
      date: order.order_status === 'delivered' && order.updated_at ? 
        new Date(order.updated_at).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : undefined
    });
  }
  
  return steps;
}