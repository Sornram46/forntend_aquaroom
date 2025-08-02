import { NextRequest, NextResponse } from 'next/server';

// คูปองทดสอบ
const TEST_COUPONS = [
  {
    code: 'WELCOME10',
    name: 'ส่วนลดต้อนรับสมาชิกใหม่',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 500,
    max_discount_amount: 1000,
    is_active: true,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2025-12-31')
  },
  {
    code: 'AQUA100',
    name: 'ส่วนลด 100 บาท',
    discount_type: 'fixed_amount',
    discount_value: 100,
    min_order_amount: 800,
    max_discount_amount: null,
    is_active: true,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2025-12-31')
  },
  {
    code: 'SAVE50',
    name: 'ส่วนลด 50 บาท',
    discount_type: 'fixed_amount',
    discount_value: 50,
    min_order_amount: 300,
    max_discount_amount: null,
    is_active: true,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2025-12-31')
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('🎫 Coupon validation API called');
    
    const body = await request.json();
    const { code, order_total, items, email } = body;

    console.log('🎫 Request data:', { code, order_total });

    if (!code) {
      return NextResponse.json({
        success: false,
        error: 'กรุณาระบุรหัสคูปอง'
      }, { status: 400 });
    }

    // ค้นหาคูปอง
    const coupon = TEST_COUPONS.find(c => 
      c.code.toLowerCase() === code.toLowerCase() && c.is_active
    );

    console.log('🎫 Found coupon:', coupon?.code);

    if (!coupon) {
      return NextResponse.json({
        success: false,
        error: 'ไม่พบรหัสคูปองที่ระบุหรือคูปองไม่พร้อมใช้งาน'
      }, { status: 404 });
    }

    const now = new Date();

    // ตรวจสอบวันที่ใช้งาน
    if (now < coupon.start_date) {
      return NextResponse.json({
        success: false,
        error: 'คูปองยังไม่เริ่มใช้งาน'
      }, { status: 400 });
    }

    if (now > coupon.end_date) {
      return NextResponse.json({
        success: false,
        error: 'คูปองหมดอายุแล้ว'
      }, { status: 400 });
    }

    // ตรวจสอบยอดขั้นต่ำ
    if (coupon.min_order_amount && Number(order_total) < coupon.min_order_amount) {
      return NextResponse.json({
        success: false,
        error: `ยอดสั่งซื้อขั้นต่ำ ${coupon.min_order_amount.toLocaleString('th-TH')} บาท (ปัจจุบัน ${Number(order_total).toLocaleString('th-TH')} บาท)`
      }, { status: 400 });
    }

    // คำนวณส่วนลด
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = Math.round((Number(order_total) * coupon.discount_value) / 100);
      
      // ตรวจสอบส่วนลดสูงสุด
      if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
        discount = coupon.max_discount_amount;
      }
    } else {
      discount = coupon.discount_value;
    }

    // ตรวจสอบว่าส่วนลดไม่เกินยอดสั่งซื้อ
    if (discount > Number(order_total)) {
      discount = Number(order_total);
    }

    console.log('🎫 Calculated discount:', discount);

    return NextResponse.json({
      success: true,
      data: {
        coupon_id: coupon.code,
        code: coupon.code,
        name: coupon.name,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discount,
        message: `ใช้คูปอง "${coupon.name}" ได้ส่วนลด ${discount.toLocaleString('th-TH')} บาท`
      }
    });

  } catch (error) {
    console.error('❌ Error validating coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'ไม่สามารถตรวจสอบคูปองได้: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

// เพิ่ม GET method สำหรับทดสอบ
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Coupon validation API is working',
    available_coupons: TEST_COUPONS.map(c => ({
      code: c.code,
      name: c.name,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      min_order_amount: c.min_order_amount
    }))
  });
}