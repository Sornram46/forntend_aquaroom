import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // ดึงพารามิเตอร์ URL (ถ้ามี)
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    // สร้าง where clause
    let whereClause = '';
    const whereParams = [];
    
    if (category) {
      whereClause = 'WHERE c.name = $3';
      whereParams.push(category);
    }
    
    if (search) {
      whereClause = whereClause 
        ? `${whereClause} AND (p.name ILIKE $4 OR p.description ILIKE $4)` 
        : 'WHERE (p.name ILIKE $3 OR p.description ILIKE $3)';
      whereParams.push(`%${search}%`);
    }
    
    // คำสั่ง SQL สำหรับดึงข้อมูลสินค้า
    const productsQuery = `
      SELECT p.id, p.name, p.description, p.price, p.image_url, p.stock,
             c.name as category
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
      ${whereClause}
      ORDER BY p.id DESC
      LIMIT $1 OFFSET $2
    `;
    
    // ประมวลผลคำสั่ง SQL
    const result = await query(productsQuery, [limit, offset, ...whereParams]);
    
    // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      imageUrl: row.image_url,
      category: row.category || 'ไม่ระบุหมวดหมู่',
      stock: parseInt(row.stock) || 0
    }));
    
    // ส่งข้อมูลกลับ
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}