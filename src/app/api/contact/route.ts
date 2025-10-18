import { NextRequest, NextResponse } from 'next/server';

// POST - ส่งข้อความติดต่อ
export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await request.json();
    
    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ส่งข้อมูลไปยัง Admin API
    const adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${adminApiUrl}/api/contact-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        subject,
        message
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit contact message');
    }

    const result = await response.json();

    // TODO: ส่งอีเมลแจ้งเตือนให้ admin (optional)
    
    return NextResponse.json({
      success: true,
      message: 'ขอบคุณสำหรับข้อความของคุณ เราจะติดต่อกลับโดยเร็วที่สุด',
      data: result.data
    });

  } catch (error) {
    console.error('Error submitting contact message:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองอีกครั้ง' 
      },
      { status: 500 }
    );
  }
}

// GET - ดึง contact setting สำหรับ frontend
export async function GET(request: NextRequest) {
  try {
    const rawBases = [
      process.env.API_BASE_URL,
      process.env.NEXT_PUBLIC_BACKEND_URL,
      process.env.BACKEND_URL,
      process.env.ADMIN_API_URL,
      'http://localhost:5000',
      'https://backend-aquaroom.vercel.app',
    ].filter(Boolean) as string[];

    const BASES = rawBases.map((b) => (b.startsWith('http') ? b : `https://${b}`));

    // Build candidate endpoints; handle when base already contains '/api/admin'
    const candidates: string[] = [];
    for (const base of BASES) {
      const lower = base.toLowerCase();
      const hasApiAdmin = lower.includes('/api/admin');
      const hasApi = lower.includes('/api/');
      if (hasApiAdmin) {
        // If base already at /api/admin, the public route is likely one level up
        const root = base.replace(/\/api\/admin\/?$/, '');
        candidates.push(`${root}/api/contact-setting`);
        candidates.push(`${root}/api/admin/contact-setting`);
      } else if (hasApi) {
        // Base already includes /api
        candidates.push(`${base.replace(/\/?$/, '')}/contact-setting`);
        candidates.push(`${base.replace(/\/?$/, '')}/admin/contact-setting`);
      } else {
        // Plain origin
        candidates.push(`${base}/api/contact-setting`);
        candidates.push(`${base}/api/admin/contact-setting`);
      }
    }

    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal, headers: { accept: 'application/json' } });
        clearTimeout(timeout);
        if (!res.ok) {
          if (res.status === 404) continue;
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const payload = await res.json().catch(() => null);
            return NextResponse.json(payload ?? { success: false }, { status: res.status });
          }
          return new NextResponse(await res.text(), { status: res.status, headers: { 'content-type': ct || 'text/plain' } });
        }
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          return new NextResponse(await res.text(), { status: 200, headers: { 'content-type': ct || 'text/plain' } });
        }
        const data = await res.json();
        return NextResponse.json(data);
      } catch (e) {
        lastErr = e;
        continue;
      }
    }

    console.error('Contact GET failed across candidates:', lastErr);
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถโหลดข้อมูลติดต่อ' },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'ไม่สามารถโหลดข้อมูลติดต่อ' },
      { status: 500 }
    );
  }
}
