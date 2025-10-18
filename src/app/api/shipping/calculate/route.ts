// src/app/api/shipping/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function pickBase() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:5000'
  );
}

export async function POST(request: NextRequest) {
  try {
    const { items, subtotal, destination } = await request.json();

    const normalizedItems = Array.isArray(items)
      ? items.map((it: any) => ({
          // ส่งคีย์ตามที่ backend ใช้จริง: productId
          productId: Number(it.productId ?? it.product_id ?? it.id ?? it.product?.id ?? 0),
          quantity: Number(it.quantity ?? 1),
          // ใส่ price ด้วย เพื่อให้ backend เช็ค free shipping ได้ถูก
          price: Number(
            typeof it.price === 'string' ? parseFloat(it.price) :
            it.price ?? it.unit_price ?? it.product?.price ?? 0
          ),
        }))
      : [];

    const payload = {
      items: normalizedItems.filter((x: any) => Number.isFinite(x.productId) && x.productId > 0),
      // ส่งต่อปลายทางถ้ามี (เช่น bangkok/provinces/remote)
      destination: destination ?? undefined,
      // subtotal ไม่จำเป็นสำหรับ backend นี้ ตัดออกได้
    };

    const BASE = pickBase();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);

    // เรียก endpoint ให้ตรงฝั่ง backend
    const res = await fetch(`${BASE}/api/calculate-shipping`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: request.headers.get('authorization') || '',
        cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => null as any);
    clearTimeout(t);

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      // backend คืน totalShippingCost ใน data
      const shippingCost = Number(
        data?.data?.totalShippingCost ?? data?.totalShippingCost ?? 0
      );
      return NextResponse.json({ success: true, shippingCost });
    }

    // Fallback: เดาสินค้าพิเศษ
    const special = Array.isArray(items) && items.some((it: any) => {
      const name = String(it.name ?? '').toLowerCase();
      const cat = String(it.category ?? '').toLowerCase();
      const flag = it.specialShipping ?? it.special_shipping ?? false;
      return flag || name.includes('ปลากัด') || name.includes('betta') || cat.includes('ปลากัด') || cat.includes('betta');
    });

    return NextResponse.json({ success: true, shippingCost: special ? 150 : 50 });
  } catch {
    return NextResponse.json({ success: true, shippingCost: 50 });
  }
}

export async function GET() {
  // สำหรับ health check
  return Response.json({ ok: true });
}