import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // คำสั่ง SQL เพื่อดึงข้อมูลสินค้ายอดนิยม
    const query = `
      SELECT p.id, p.name, p.description, p.price, p.image_url, 
             c.name as category
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.is_popular = true
    `;
    
    const result = await pool.query(query);
    
    // แปลงข้อมูลให้ตรงกับโครงสร้างที่ใช้
    const popularProducts = result.rows.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.image_url,
      category: product.category || 'ไม่ระบุหมวดหมู่'
    }));
    
    return NextResponse.json(popularProducts);
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular products' },
      { status: 500 }
    );
  }
}