import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function resolveBase() {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'https://backend-aquaroom.vercel.app';
  return (raw || '').trim().replace(/\/+$/, '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const base = resolveBase();
    const category = params.category;

    // URL encode category ให้ถูกต้อง
    const encodedCategory = encodeURIComponent(category);
    const backendUrl = `${base}/api/categories/${encodedCategory}/products`;

    // ส่ง headers authentication (ถ้ามี) และ headers อื่นๆ ที่จำเป็น
    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    // Copy authorization header จาก client request (ถ้ามี)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Copy cookie จาก client request (ถ้ามี)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    console.log(`[API] Fetching categories products: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[API] Backend error: ${response.status} ${response.statusText}`);

      // ถ้า 401 ลองเรียกแบบไม่ใส่ auth (เผื่อเป็น public endpoint)
      if (response.status === 401) {
        console.log('[API] Retrying without authentication...');
        const retryResponse = await fetch(backendUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (retryResponse.ok) {
          const data = await retryResponse.json();
          return Response.json(data);
        }
      }

      return Response.json(
        { error: `Backend returned ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('[API] Error fetching category products:', error);
    return Response.json(
      { error: 'Failed to fetch category products' },
      { status: 500 }
    );
  }
}