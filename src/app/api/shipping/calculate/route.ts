// src/app/api/shipping/calculate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { items, subtotal } = await request.json();
    
    let totalShippingCost = 0;
    let hasSpecialShipping = false;
    
    // ตรวจสอบแต่ละสินค้าในตะกร้า
    for (const item of items) {
      const productQuery = `
        SELECT has_special_shipping, special_shipping_base, 
               special_shipping_qty, special_shipping_extra
        FROM products 
        WHERE id = $1
      `;
      
      const result = await query(productQuery, [item.id]);
      
      if (result.rows.length > 0) {
        const product = result.rows[0];
        
        if (product.has_special_shipping) {
          hasSpecialShipping = true;
          
          const baseShipping = parseFloat(product.special_shipping_base) || 80;
          const qtyThreshold = product.special_shipping_qty || 4;
          const extraCost = parseFloat(product.special_shipping_extra) || 10;
          
          if (item.quantity <= qtyThreshold) {
            totalShippingCost += baseShipping;
          } else {
            const extraQty = item.quantity - qtyThreshold;
            totalShippingCost += baseShipping + (extraQty * extraCost);
          }
        }
      }
    }
    
    // ถ้าไม่มีสินค้าพิเศษ ใช้ค่าจัดส่งปกติ
    if (!hasSpecialShipping) {
      totalShippingCost = subtotal >= 1000 ? 0 : 50;
    }
    
    return NextResponse.json({
      success: true,
      shippingCost: totalShippingCost,
      hasSpecialShipping,
      freeShippingThreshold: hasSpecialShipping ? null : 1000
    });
    
  } catch (error) {
    console.error('Error calculating shipping:', error);
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถคำนวณค่าจัดส่งได้' },
      { status: 500 }
    );
  }
}