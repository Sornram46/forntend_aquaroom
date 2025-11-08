import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function resolveBase() {
  const raw =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.ADMIN_API_URL ||
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://backend-aquaroom.vercel.app');
  if (!raw) return 'https://backend-aquaroom.vercel.app';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('localhost') || raw.startsWith('127.0.0.1')) return `http://${raw}`;
  return `https://${raw}`;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const BASE = resolveBase();
  
  try {
    const url = `${BASE}/api/categories/${encodeURIComponent(slug)}/products`;
    const started = Date.now();
    console.log(`[Categories] GET -> ${url}`);
    
    // สร้าง headers และส่ง authorization/cookie จาก client
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    // ส่ง Authorization header (ถ้ามี)
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    // ส่ง Cookie header (ถ้ามี)
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    const res = await fetch(url, {
      headers,
      cache: 'no-store',
    });
    
    console.log(`[Categories] <- ${res.status} in ${Date.now() - started}ms`);
    
    // ถ้าได้ 401 ลอง fallback: ดึงสินค้าทั้งหมดแล้วกรองเอง
    if (res.status === 401) {
      console.log(`[Categories] 401 received, trying fallback via /api/products`);
      
      try {
        const productsUrl = `${BASE}/api/products`;
        const productsRes = await fetch(productsUrl, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });
        
        if (productsRes.ok) {
          const allProducts = await productsRes.json();
          const items = Array.isArray(allProducts) ? allProducts : allProducts?.items || [];
          
          // กรองสินค้าตาม category
          const filtered = items.filter((p: any) => {
            const cat = String(p.category || '').toLowerCase();
            const target = slug.toLowerCase();
            return cat === target;
          });
          
          console.log(`[Categories] Fallback success: ${filtered.length} products in "${slug}"`);
          return NextResponse.json({ 
            success: true, 
            products: filtered,
            _fallback: true 
          });
        }
      } catch (fallbackError) {
        console.error('[Categories] Fallback failed:', fallbackError);
      }
    }
    
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
    
  } catch (e) {
    console.error('[Categories] Error:', e);
    return NextResponse.json({ 
      success: false, 
      message: 'proxy error',
      error: e instanceof Error ? e.message : String(e)
    }, { status: 502 });
  }
}