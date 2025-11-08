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
    
    // ลอง fallback ทันที (เพราะ backend ต้องการ auth)
    console.log(`[Categories] Using fallback strategy (backend requires auth)`);
    
    try {
      // เรียก /api/products ผ่าน internal Next.js API (ไม่ผ่าน network)
      const productsUrl = `${BASE}/api/products`;
      console.log(`[Categories] Fetching all products from ${productsUrl}`);
      
      const productsRes = await fetch(productsUrl, {
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      
      console.log(`[Categories] Products response status: ${productsRes.status}`);
      
      if (!productsRes.ok) {
        throw new Error(`Products API returned ${productsRes.status}`);
      }
      
      const allProducts = await productsRes.json();
      console.log(`[Categories] Received products:`, typeof allProducts, Array.isArray(allProducts));
      
      // Normalize response
      let items: any[] = [];
      if (Array.isArray(allProducts)) {
        items = allProducts;
      } else if (allProducts?.items && Array.isArray(allProducts.items)) {
        items = allProducts.items;
      } else if (allProducts?.products && Array.isArray(allProducts.products)) {
        items = allProducts.products;
      } else if (allProducts?.data && Array.isArray(allProducts.data)) {
        items = allProducts.data;
      }
      
      console.log(`[Categories] Total items: ${items.length}`);
      
      // กรองสินค้าตาม category (case-insensitive + trim)
      const targetSlug = slug.toLowerCase().trim();
      const filtered = items.filter((p: any) => {
        const cat = String(p.category || p.categoryName || p.category_name || '').toLowerCase().trim();
        return cat === targetSlug;
      });
      
      console.log(`[Categories] Filtered ${filtered.length} products for category "${slug}"`);
      
      // ส่ง response ในรูปแบบที่หน้าเว็บคาดหวัง
      return NextResponse.json({ 
        success: true, 
        products: filtered,
        total: filtered.length,
        category: slug,
        _fallback: true,
        _timestamp: new Date().toISOString()
      });
      
    } catch (fallbackError) {
      console.error('[Categories] Fallback error:', fallbackError);
      
      // ส่ง empty array แทน error เพื่อไม่ให้หน้าเว็บพัง
      return NextResponse.json({ 
        success: true,
        products: [],
        total: 0,
        category: slug,
        _fallback: true,
        _error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      });
    }
    
  } catch (e) {
    console.error('[Categories] Fatal error:', e);
    return NextResponse.json({ 
      success: false, 
      products: [],
      message: 'Failed to fetch category products',
      error: e instanceof Error ? e.message : String(e)
    }, { status: 500 });
  }
}