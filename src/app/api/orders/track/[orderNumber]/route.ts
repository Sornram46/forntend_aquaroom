import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

//

export const runtime = 'nodejs';

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  '';
const BASE = raw && raw.startsWith('http') ? raw : raw ? `https://${raw}` : '';

export async function GET(
  request: Request,
  context: { params: Record<string, string | string[]> }
) {
  const p = context.params?.orderNumber;
  const orderNumber = Array.isArray(p) ? p[0] : p;
  
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const token = request.headers.get('authorization') || '';
    const res = await fetch(`${BASE}/api/orders/track/${encodeURIComponent(orderNumber)}`, {
      headers: {
        accept: 'application/json',
        authorization: token,
      },
      cache: 'no-store',
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy GET /api/orders/track/[orderNumber] failed:', e);
    return Response.json({ success: false, message: 'Upstream error' }, { status: 502 });
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