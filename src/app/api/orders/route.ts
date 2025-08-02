import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

// ฟังก์ชันสร้างเลขที่คำสั่งซื้อ (Order Number)
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `OR${year}${month}${day}${random}`;
}

export async function POST(request: NextRequest) {
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
    
    const formData = await request.formData();
    
    // รับข้อมูลคำสั่งซื้อจาก form data
    const addressId = formData.get('addressId');
    const paymentMethod = formData.get('paymentMethod');
    const subtotal = parseFloat(formData.get('subtotal') as string);
    const shippingFee = parseFloat(formData.get('shippingFee') as string);
    const discount = parseFloat(formData.get('discount') as string || '0');
    const totalAmount = parseFloat(formData.get('totalAmount') as string);
    const cartItemsJson = formData.get('cartItems') as string;
    const cartItems = JSON.parse(cartItemsJson);
    
    // 1. แสดงข้อมูลที่ได้รับเพื่อตรวจสอบ
    console.log('Received order data:', {
      addressId, 
      paymentMethod, 
      subtotal, 
      shippingFee, 
      discount, 
      totalAmount
    });
    console.log('Received cart items:', cartItems);
    
    // 2. ตรวจสอบข้อมูลสินค้าอย่างละเอียด
    for (const item of cartItems) {
      if (!item.id || isNaN(Number(item.id))) {
        console.error('Invalid product ID:', item.id, 'for product:', item.name);
        return NextResponse.json(
          { success: false, message: `พบข้อมูลสินค้าไม่ถูกต้อง: ${item.name}` },
          { status: 400 }
        );
      }

      // ตรวจสอบว่าสินค้ามีอยู่ในฐานข้อมูลหรือไม่
      const productId = Number(item.id);
      const checkProduct = await query('SELECT id, name, stock FROM products WHERE id = $1', [productId]);
      
      if (checkProduct.rows.length === 0) {
        console.error('Product not found:', productId);
        return NextResponse.json(
          { success: false, message: `ไม่พบสินค้า: ${item.name} (รหัส ${productId})` },
          { status: 400 }
        );
      }
      
      // ตรวจสอบสต็อกสินค้า
      const product = checkProduct.rows[0];
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { 
            success: false, 
            message: `สินค้า "${product.name}" มีจำนวนไม่เพียงพอ (ต้องการ ${item.quantity}, มีเหลือ ${product.stock})` 
          },
          { status: 400 }
        );
      }
    }
    
    // สร้างเลขที่คำสั่งซื้อ
    const orderNumber = generateOrderNumber();
    
    // 2. เริ่ม transaction
    await query('BEGIN');
    
    try {
      // บันทึกข้อมูลคำสั่งซื้อหลัก
      const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'pending';
      
      const orderInsertQuery = `
        INSERT INTO orders (
          user_id, order_number, address_id, total_amount, subtotal, 
          shipping_fee, discount, payment_method, payment_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;
      
      const orderResult = await query(orderInsertQuery, [
        decoded.userId, orderNumber, addressId, totalAmount, subtotal,
        shippingFee, discount, paymentMethod, paymentStatus
      ]);
      
      const orderId = orderResult.rows[0].id;
      
      // บันทึกรายการสินค้าในคำสั่งซื้อ
      for (const item of cartItems) {
        const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
        
        const orderItemInsertQuery = `
          INSERT INTO order_items (
            order_id, product_id, quantity, price, total
          )
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await query(orderItemInsertQuery, [
          orderId, item.id, item.quantity, item.price, itemTotal
        ]);
      }
      
      // จัดการหลักฐานการชำระเงิน (เฉพาะกรณีโอนผ่านธนาคาร)
      let paymentProofPath = null;
      
      if (paymentMethod === 'bank_transfer') {
        const paymentProofFile = formData.get('paymentProof') as File;
        
        if (!paymentProofFile) {
          throw new Error('ไม่พบหลักฐานการชำระเงิน');
        }
        
        // สร้างโฟลเดอร์สำหรับเก็บไฟล์ (ถ้ายังไม่มี)
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment_proofs');
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch (err) {
          console.error('Error creating directory:', err);
        }
        
        // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
        const fileExtension = paymentProofFile.name.split('.').pop();
        const fileName = `payment_${orderId}_${uuidv4()}.${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        
        // บันทึกไฟล์
        const buffer = Buffer.from(await paymentProofFile.arrayBuffer());
        await writeFile(filePath, buffer);
        
        // เก็บ path สำหรับเข้าถึงไฟล์ผ่าน URL
        paymentProofPath = `/uploads/payment_proofs/${fileName}`;
        
        // บันทึกข้อมูลหลักฐานการชำระเงิน
        const paymentProofInsertQuery = `
          INSERT INTO payment_proofs (
            order_id, file_path, original_filename, file_size
          )
          VALUES ($1, $2, $3, $4)
        `;
        
        await query(paymentProofInsertQuery, [
          orderId, paymentProofPath, paymentProofFile.name, paymentProofFile.size
        ]);
      }
      
      // 3. ลดจำนวนสินค้าในคลัง
      for (const item of cartItems) {
        await query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.id]
        );
      }
      
      // 4. Commit transaction
      await query('COMMIT');
      
      return NextResponse.json({
        success: true,
        order: {
          id: orderId,
          orderNumber,
          totalAmount,
          paymentMethod,
          paymentStatus
        }
      }, { status: 201 });
      
    } catch (error) {
      // Rollback transaction ในกรณีที่เกิดข้อผิดพลาด
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}

// เพิ่มฟังก์ชัน GET

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
    
    // คำสั่ง SQL สำหรับดึงข้อมูลคำสั่งซื้อพร้อมรายการสินค้า
    const ordersQuery = `
      SELECT o.id, o.order_number, o.total_amount, o.payment_method, 
             o.payment_status, o.order_status, o.created_at, o.updated_at
      FROM orders o
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `;
    
    const ordersResult = await query(ordersQuery, [decoded.userId]);
    
    // ดึงข้อมูลรายการสินค้าสำหรับแต่ละคำสั่งซื้อ
    const orders = await Promise.all(ordersResult.rows.map(async (order) => {
      const itemsQuery = `
        SELECT oi.id, oi.product_id, p.name as product_name, oi.quantity, 
               oi.price, oi.total, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `;
      
      const itemsResult = await query(itemsQuery, [order.id]);
      
      return {
        ...order,
        items: itemsResult.rows
      };
    }));
    
    return NextResponse.json({
      success: true,
      orders
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}