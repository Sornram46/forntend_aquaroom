// สร้าง API route: /api/validate-slip
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, message: 'ไม่พบไฟล์' }, { status: 400 });
    }

    // แปลงเป็น base64 เพื่อส่งไปยัง AI service
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    // เรียก AI service (ตัวอย่าง Google Vision API หรือ Azure Computer Vision)
    const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: {
            content: base64
          },
          features: [{
            type: 'TEXT_DETECTION'
          }]
        }]
      })
    });

    const visionResult = await response.json();
    const detectedText = visionResult.responses[0]?.textAnnotations?.[0]?.description || '';

    // ตรวจสอบคำสำคัญที่บ่งบอกว่าเป็นสลิปโอนเงิน
    const bankKeywords = [
      'โอนเงิน', 'transfer', 'จำนวนเงิน', 'amount',
      'ธนาคาร', 'bank', 'บัญชี', 'account',
      'ยอดเงิน', 'balance', 'สำเร็จ', 'successful',
      'วันที่', 'date', 'เวลา', 'time'
    ];

    const foundKeywords = bankKeywords.filter(keyword => 
      detectedText.toLowerCase().includes(keyword.toLowerCase())
    );

    const isSlip = foundKeywords.length >= 3; // ต้องพบคำสำคัญอย่างน้อย 3 คำ

    return NextResponse.json({
      success: true,
      isSlip,
      confidence: (foundKeywords.length / bankKeywords.length) * 100,
      detectedText: detectedText.substring(0, 200), // แสดงแค่ 200 ตัวอักษรแรก
      foundKeywords
    });

  } catch (error) {
    console.error('Error validating slip:', error);
    return NextResponse.json({
      success: false,
      message: 'ไม่สามารถตรวจสอบได้'
    }, { status: 500 });
  }
}