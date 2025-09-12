import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  '';
const BASE = raw && raw.startsWith('http') ? raw : raw ? `https://${raw}` : '';

// GET - ดึงข้อมูลการตั้งค่าหน้าแรก รวม Logo
export async function GET() {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(`${BASE}/api/homepage-setting`, { cache: 'no-store' });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy /api/homepage-setting failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}


// PATCH - อัปเดตเฉพาะ Logo
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📝 PATCH homepage-setting received data:', data);
    
    // กรองเฉพาะ field ที่เกี่ยวกับ logo
    const logoFields = [
      'logo_url', 
      'logo_alt_text', 
      'logo_width', 
      'logo_height', 
      'dark_logo_url'
    ];
    
    type LogoData = {
      logo_url?: string;
      logo_alt_text?: string;
      logo_width?: number;
      logo_height?: number;
      dark_logo_url?: string;
    };

    const logoData = Object.keys(data)
      .filter((key): key is keyof LogoData => logoFields.includes(key))
      .reduce<LogoData>((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {});
    
    if (Object.keys(logoData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No logo data provided' },
        { status: 400 }
      );
    }
    
    // Validate logo dimensions
    if (logoData.logo_width && (logoData.logo_width < 50 || logoData.logo_width > 300)) {
      return NextResponse.json(
        { success: false, error: 'Logo width must be between 50-300 pixels' },
        { status: 400 }
      );
    }
    
    if (logoData.logo_height && (logoData.logo_height < 20 || logoData.logo_height > 100)) {
      return NextResponse.json(
        { success: false, error: 'Logo height must be between 20-100 pixels' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    const existingResult = await query(
      'SELECT id FROM homepage_setting ORDER BY id DESC LIMIT 1',
      []
    );

    let result;
    if (existingResult.rows.length > 0) {
      // อัปเดตเฉพาะ logo fields
      const updateFields = Object.keys(logoData);
      const updateValues = Object.values(logoData);
      const setClause = updateFields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');
      
      result = await query(
        `UPDATE homepage_setting SET ${setClause}, updated_at = NOW() WHERE id = $${updateFields.length + 1} RETURNING *`,
        [...updateValues, existingResult.rows[0].id]
      );
    } else {
      // สร้างข้อมูลใหม่พร้อม logo
      const allLogoData = {
        logo_alt_text: 'AquaRoom Logo',
        logo_width: 120,
        logo_height: 40,
        ...logoData
      };
      
      const fields = Object.keys(allLogoData);
      const values = Object.values(allLogoData);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const quotedFields = fields.map(field => `"${field}"`).join(', ');
      
      result = await query(
        `INSERT INTO homepage_setting (${quotedFields}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *`,
        values
      );
    }

    console.log('✅ Logo settings updated successfully');

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Logo settings updated successfully'
    });
  } catch (error) {
    console.error('❌ Database query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update logo settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - บันทึกหรืออัปเดตการตั้งค่าหน้าแรก รวม Logo  
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📝 POST homepage-setting received data:', data);
    
    // ตรวจสอบว่ามีข้อมูลส่งมาหรือไม่
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data provided' },
        { status: 400 }
      );
    }
    
    // Validate logo data ถ้ามี
    if (data.logo_width && (data.logo_width < 50 || data.logo_width > 300)) {
      return NextResponse.json(
        { success: false, error: 'Logo width must be between 50-300 pixels' },
        { status: 400 }
      );
    }
    
    if (data.logo_height && (data.logo_height < 20 || data.logo_height > 100)) {
      return NextResponse.json(
        { success: false, error: 'Logo height must be between 20-100 pixels' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่ามีข้อมูลอยู่แล้วหรือไม่
    const existingResult = await query(
      'SELECT id FROM homepage_setting ORDER BY id DESC LIMIT 1',
      []
    );

    let result;
    if (existingResult.rows.length > 0) {
      // อัปเดตข้อมูลที่มีอยู่
      const updateFields = Object.keys(data);
      const updateValues = Object.values(data);
      const setClause = updateFields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');
      
      result = await query(
        `UPDATE homepage_setting SET ${setClause}, updated_at = NOW() WHERE id = $${updateFields.length + 1} RETURNING *`,
        [...updateValues, existingResult.rows[0].id]
      );
    } else {
      // สร้างข้อมูลใหม่
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const quotedFields = fields.map(field => `"${field}"`).join(', ');
      
      result = await query(
        `INSERT INTO homepage_setting (${quotedFields}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *`,
        values
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Homepage setting updated successfully'
    });
  } catch (error) {
    console.error('❌ Database query error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save homepage setting',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
