import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const backendUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/orders`;
    const raw = await request.json();

    const cookieStore = await cookies();

    const payload: any = {};

    // user_id
    payload.user_id = raw.user_id;
    if (!payload.user_id) {
      const userCookie = cookieStore.get('ar_user')?.value;
      if (userCookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(userCookie));
          payload.user_id = parsed?.id ?? parsed?.user?.id;
        } catch (err) {
          console.warn('❗️อ่านคุกกี้ ar_user ไม่ได้:', err);
        }
      }
    }
    if (typeof payload.user_id === 'string') payload.user_id = parseInt(payload.user_id, 10);

    // address_id
    const addr = raw.address_id ?? raw.addressId;
    payload.address_id = typeof addr === 'string' ? parseInt(addr, 10) : Number(addr);

    // helper แปลงเงินให้เป็น string ทศนิยม 2 ตำแหน่ง
    const toMoney = (v: unknown) => {
      const n = typeof v === 'string' ? parseFloat(v) : Number(v ?? 0);
      const safe = Number.isFinite(n) ? n : 0;
      return (Math.round(safe * 100) / 100).toFixed(2);
    };

    // items
    let items = raw.items;
    if (!items && raw.cartItems) {
      try {
        items = typeof raw.cartItems === 'string' ? JSON.parse(raw.cartItems) : raw.cartItems;
      } catch (e) {
        console.error('❌ ไม่สามารถ parse cartItems:', e);
      }
    }
    if (Array.isArray(items)) {
      payload.items = items
        .map((it: any) => {
          const pidRaw = it.product_id ?? it.id ?? it.productId ?? it.product?.id;
          const product_id = typeof pidRaw === 'string' ? parseInt(pidRaw, 10) : Number(pidRaw);
          const quantity = typeof it.quantity === 'string' ? parseInt(it.quantity, 10) : Number(it.quantity ?? 0);
          const priceRaw = it.price ?? it.unit_price ?? it.product?.price;
          const price = Number(typeof priceRaw === 'string' ? parseFloat(priceRaw) : Number(priceRaw ?? 0));
          return { product_id, quantity, price };
        })
        .filter((it: any) =>
          Number.isFinite(it.product_id) && it.product_id > 0 &&
          Number.isFinite(it.quantity) && it.quantity > 0 &&
          Number.isFinite(it.price) && it.price >= 0
        );
    }

    // shipping_fee / discount(+discount_amount)
    const ship = raw.shipping_fee ?? raw.shippingFee ?? 0;
    const disc = raw.discount_amount ?? raw.discount ?? raw.couponDiscount ?? 0;
    payload.shipping_fee = toMoney(ship);
    // ใส่ทั้งสองชื่อ เพื่อเข้ากันได้กับ backend หลายเวอร์ชัน
    payload.discount_amount = toMoney(disc);
    payload.discount = payload.discount_amount;

    // total_amount (ถ้า UI ส่งมาใช้เลย ไม่งั้นคำนวณ)
    let total = raw.total_amount ?? raw.totalAmount ?? raw.total ?? raw.orderTotal;
    if (total !== undefined && total !== null && `${total}` !== '') {
      payload.total_amount = toMoney(total);
    }

    // คำนวณ subtotal และ total_amount ถ้าจำเป็น
    const itemsTotal = Array.isArray(payload.items)
      ? payload.items.reduce((sum: number, it: any) => sum + Number(it.price) * Number(it.quantity), 0)
      : 0;
    payload.subtotal = toMoney(itemsTotal);

    if (!payload.total_amount) {
      const t = parseFloat(payload.subtotal) + parseFloat(payload.shipping_fee) - parseFloat(payload.discount_amount);
      payload.total_amount = toMoney(t);
    }

    // coupon_code, payment_method, notes
    payload.coupon_code = raw.coupon_code ?? raw.couponCode ?? null;
    payload.payment_method = raw.payment_method ?? raw.paymentMethod ?? 'bank_transfer';
    payload.notes = raw.notes ?? null;

    // ตรวจข้อมูลขั้นต่ำ
    const hasUserId = Boolean(payload.user_id);
    const hasAddressId = Boolean(payload.address_id);
    const hasTotal = typeof payload.total_amount === 'string' && payload.total_amount.length > 0;
    const hasItems = Array.isArray(payload.items) && payload.items.length > 0;

    if (!hasUserId || !hasAddressId || !hasTotal || !hasItems) {
      console.error('❌ Payload ไม่ครบ', { hasUserId, hasAddressId, hasTotal, hasItems, body: raw, mapped: payload });
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ครบถ้วน: ต้องมี user_id, address_id, total_amount และ items' },
        { status: 400 }
      );
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') ?? '',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(payload),
    });

    // คืนรายละเอียด error จาก backend ให้เห็นสาเหตุ
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      let errorPayload: any = null;
      if (contentType.includes('application/json')) {
        errorPayload = await response.json().catch(() => null);
      } else {
        const text = await response.text().catch(() => '');
        errorPayload = { success: false, message: 'Backend error', detail: text };
      }
      console.error('❌ Backend order creation failed:', response.status, errorPayload);
      return NextResponse.json(
        errorPayload ?? { success: false, message: 'Backend error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const res = NextResponse.json(data);
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) res.headers.append('set-cookie', setCookieHeader);
    return res;
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' }, { status: 500 });
  }
}

// GET method ยังคงเหมือนเดิม...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const status = searchParams.get('status') || '';

    // พยายามดึง user_id จากคุกกี้ ar_user (await cookies())
    let userId: string | number | undefined;
    try {
      const cookieStore = await cookies();
      const userCookie = cookieStore.get('ar_user')?.value;
      if (userCookie) {
        const parsed = JSON.parse(decodeURIComponent(userCookie));
        userId = parsed?.id ?? parsed?.user?.id;
      }
    } catch (e) {
      console.warn('อ่านคุกกี้ ar_user ไม่ได้:', e);
    }

    const backendUrl = new URL(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/orders`);
    backendUrl.searchParams.set('page', String(page));
    backendUrl.searchParams.set('limit', String(limit));
    if (status) backendUrl.searchParams.set('status', status);
    if (userId) backendUrl.searchParams.set('user_id', String(userId));

    const cookieHeader = request.headers.get('cookie') ?? '';

    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: request.headers.get('authorization') ?? '',
        Cookie: cookieHeader,
      },
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
      orders: backendData.orders || backendData.data || [],
    });
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}