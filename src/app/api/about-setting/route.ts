import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - ดึงข้อมูลการตั้งค่าหน้า About
export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM about_setting ORDER BY id DESC LIMIT 1',
      []
    );

    if (result.rows.length === 0) {
      return NextResponse.json({});
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about setting' },
      { status: 500 }
    );
  }
}

// POST - บันทึกหรืออัปเดตการตั้งค่าหน้า About
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // ตรวจสอบว่ามีข้อมูลส่งมาหรือไม่
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data provided' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    const existingResult = await query(
      'SELECT id FROM about_setting ORDER BY id DESC LIMIT 1',
      []
    );

    let result;
    if (existingResult.rows.length > 0) {
      // อัปเดตข้อมูลที่มีอยู่
      const updateFields = Object.keys(data);
      const updateValues = Object.values(data);
      const setClause = updateFields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');
      
      result = await query(
        `UPDATE about_setting SET ${setClause} WHERE id = $${updateFields.length + 1} RETURNING *`,
        [...updateValues, existingResult.rows[0].id]
      );
    } else {
      // สร้างข้อมูลใหม่
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const quotedFields = fields.map(field => `"${field}"`).join(', ');
      
      result = await query(
        `INSERT INTO about_setting (${quotedFields}) VALUES (${placeholders}) RETURNING *`,
        values
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save about setting',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
