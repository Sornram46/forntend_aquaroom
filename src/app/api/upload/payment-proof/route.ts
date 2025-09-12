import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs'; // บังคับใช้ Node runtime

import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ตัวอย่างการใช้งานภายใน POST/handler
// const supabase = getSupabaseAdmin();
// await supabase.storage.from(process.env.SUPABASE_BUCKET || 'image_url').upload(path, file);

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ Authorization
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }

    // ตรวจสอบ JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
        userId: string;
      };
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // รับข้อมูล FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบไฟล์ที่อัปโหลด' },
        { status: 400 }
      );
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP)' },
        { status: 400 }
      );
    }

    // ตรวจสอบขนาดไฟล์ (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'ขนาดไฟล์ต้องไม่เกิน 5MB' },
        { status: 400 }
      );
    }

    // สร้างชื่อไฟล์ที่ไม่ซ้ำ
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `payment_proof_${decoded.userId}_${timestamp}.${fileExtension}`;

    console.log('📤 Uploading payment proof to Supabase:', fileName);

    // แปลงไฟล์เป็น ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // อัปโหลดไปยัง Supabase Storage
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถอัปโหลดไฟล์ได้', error: error.message },
        { status: 500 }
      );
    }

    // สร้าง public URL
    const { data: publicUrlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    const fileUrl = publicUrlData.publicUrl;

    console.log('✅ Payment proof uploaded successfully:', fileUrl);

    return NextResponse.json({
      success: true,
      message: 'อัปโหลดหลักฐานการโอนเรียบร้อย',
      url: fileUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('❌ Error uploading payment proof:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' },
      { status: 500 }
    );
  }
}