import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // คำสั่ง SQL เพื่อดึงข้อมูลสินค้าตาม ID (เพิ่ม stock เข้าไปในการ select)
    const sqlQuery = `
      SELECT p.id, p.name, p.description, p.price, p.image_url,p.image_url_two,p.image_url_three,p.image_url_four, p.stock,
             c.name as category
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      WHERE p.id = $1
    `;
    
    const result = await query(sqlQuery, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const product = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      price: parseFloat(result.rows[0].price),
      imageUrl: result.rows[0].image_url,
      imageUrlTwo: result.rows[0].image_url_two,
      imageUrlThree: result.rows[0].image_url_three,
      imageUrlFour: result.rows[0].image_url_four,
      category: result.rows[0].category || 'ไม่ระบุหมวดหมู่',
      stock: parseInt(result.rows[0].stock) || 0 // เพิ่มข้อมูล stock
    };
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}