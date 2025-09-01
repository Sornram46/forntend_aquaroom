import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }
    
    const resolvedParams = await params;
    const orderNumber = resolvedParams.orderNumber;
    
    console.log('🔍 Tracking order:', orderNumber);
    
    // ตรวจสอบ token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
        userId: string;
      };
    } catch (jwtError) {
      console.error('❌ JWT Error:', jwtError);
      return NextResponse.json(
        { success: false, message: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }
    
    // เรียก Backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    // ลองหลายวิธีเพื่อหา order
    const endpointsToTry = [
      `${backendUrl}/api/orders/track/${orderNumber}`,
      `${backendUrl}/api/orders?user_id=${decoded.userId}`,
      `${backendUrl}/api/orders/${orderNumber}`,
      `${backendUrl}/api/orders?order_number=${orderNumber}`
    ];
    
    for (const endpoint of endpointsToTry) {
      console.log('🔗 Trying endpoint:', endpoint);
      
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        });

        console.log(`📊 Response status for ${endpoint}:`, response.status);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log(`📦 Response data from ${endpoint}:`, data);

            // ถ้าเป็น orders list ให้หา order ที่ตรงกัน
            if (data.orders || data.data) {
              const orders = data.orders || data.data || [];
              const targetOrder = orders.find((order: any) => {
                const orderNum = order.order_number || order.orderNumber || `ORD${order.id}`;
                console.log('🔍 Comparing:', orderNum, 'with', orderNumber);
                return orderNum === orderNumber;
              });

              if (targetOrder) {
                console.log('✅ Found order:', targetOrder);
                
                // ดึงรายการสินค้าถ้ายังไม่มี
                let orderItems = targetOrder.items || [];
                
                if (orderItems.length === 0) {
                  console.log('🛒 No items in order, trying to fetch separately...');
                  try {
                    const itemsResponse = await fetch(`${backendUrl}/api/orders/${targetOrder.id}/items`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      }
                    });
                    
                    if (itemsResponse.ok) {
                      const itemsData = await itemsResponse.json();
                      orderItems = itemsData.items || itemsData.data || [];
                      console.log('🛒 Got items from separate API:', orderItems);
                    }
                  } catch (itemsError) {
                    console.error('❌ Error fetching items separately:', itemsError);
                  }
                }

                // ปรับแต่ง items ให้มี format ที่ถูกต้อง
                if (orderItems && Array.isArray(orderItems)) {
                  orderItems = orderItems.map((item: any) => ({
                    id: item.id || item.item_id,
                    product_id: item.product_id || item.productId,
                    product_name: item.product_name || item.productName || item.name,
                    quantity: parseInt(item.quantity) || 1,
                    price: parseFloat(item.price) || 0,
                    total: parseFloat(item.total) || (parseFloat(item.price || 0) * parseInt(item.quantity || 1)),
                    image_url: item.image_url || item.imageUrl || item.product_image || null
                  }));
                }
                
                const completeOrder = {
                  ...targetOrder,
                  items: orderItems,
                  delivery_steps: generateDeliverySteps(targetOrder)
                };

                return NextResponse.json({
                  success: true,
                  order: completeOrder
                });
              }
            }
            
            // ถ้าเป็น order เดี่ยว
            if (data.order || (data.order_number && data.order_number === orderNumber)) {
              const order = data.order || data;
              console.log('✅ Found single order:', order);
              
              // ดึงรายการสินค้าถ้ายังไม่มี
              let orderItems = order.items || [];
              
              if (orderItems.length === 0) {
                console.log('🛒 No items in order, trying to fetch separately...');
                try {
                  const itemsResponse = await fetch(`${backendUrl}/api/orders/${order.id}/items`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    }
                  });
                  
                  if (itemsResponse.ok) {
                    const itemsData = await itemsResponse.json();
                    orderItems = itemsData.items || itemsData.data || [];
                    console.log('🛒 Got items from separate API:', orderItems);
                  }
                } catch (itemsError) {
                  console.error('❌ Error fetching items separately:', itemsError);
                }
              }

              // ปรับแต่ง items ให้มี format ที่ถูกต้อง
              if (orderItems && Array.isArray(orderItems)) {
                orderItems = orderItems.map((item: any) => ({
                  id: item.id || item.item_id,
                  product_id: item.product_id || item.productId,
                  product_name: item.product_name || item.productName || item.name,
                  quantity: parseInt(item.quantity) || 1,
                  price: parseFloat(item.price) || 0,
                  total: parseFloat(item.total) || (parseFloat(item.price || 0) * parseInt(item.quantity || 1)),
                  image_url: item.image_url || item.imageUrl || item.product_image || null
                }));
              }
              
              const completeOrder = {
                ...order,
                items: orderItems,
                delivery_steps: generateDeliverySteps(order)
              };

              return NextResponse.json({
                success: true,
                order: completeOrder
              });
            }
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Error from ${endpoint}:`, response.status, errorText);
        }
      } catch (fetchError) {
        console.error(`❌ Failed to connect to ${endpoint}:`, fetchError);
        continue; // ลองต่อไป
      }
    }
    
    // ถ้าลองทุกวิธีแล้วไม่เจอ
    return NextResponse.json(
      { 
        success: false, 
        message: 'ไม่พบคำสั่งซื้อที่ระบุ',
        debug_info: {
          orderNumber: orderNumber,
          userId: decoded.userId,
          endpoints_tried: endpointsToTry,
          backend_url: backendUrl
        }
      },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('❌ Error fetching order tracking:', error);
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