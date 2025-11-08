import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeSlug(raw: string) {
  return decodeURIComponent(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')            // remove combining marks
    .replace(/[^a-z0-9ก-๙\s-]/g, '')            // keep thai, latin, digits, space, dash
    .replace(/\s+/g, '-')                       // spaces -> dash
    .replace(/-+/g, '-');                       // collapse dashes
}

function collectCategoryCandidates(p: any): string[] {
  const list: string[] = [];
  const add = (v: any) => {
    if (!v) return;
    const s = String(v).trim();
    if (s) list.push(s);
  };
  add(p.category);
  add(p.category_name);
  add(p.categoryName);
  add(p.category_slug);
  if (p.category?.slug) add(p.category.slug);
  if (Array.isArray(p.categories)) p.categories.forEach(add);
  if (Array.isArray(p.product_categories)) p.product_categories.forEach(add);
  if (Array.isArray(p.productCategories)) p.productCategories.forEach(add);
  return list;
}

function normalizeForCompare(v: string) {
  return normalizeSlug(v)
    .replace(/-/g, ' ') // สลับกลับเป็นเว้นวรรคเพื่อลอง match หลายรูปแบบ
    .trim();
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const started = Date.now();
  const rid = crypto.randomUUID();

  const rawTarget = slug;
  const normTarget = normalizeSlug(rawTarget);
  const compareTarget = normalizeForCompare(normTarget);

  console.log(`[CategoriesProducts][${rid}] request slug="${rawTarget}" norm="${normTarget}" compare="${compareTarget}"`);

  try {
    // เรียกสินค้าทั้งหมดผ่าน proxy /api/products (relative → ใช้ domain ปัจจุบันเสมอ)
    const productsUrl = new URL('/api/products', req.nextUrl.origin).toString();
    console.log(`[CategoriesProducts][${rid}] fetch all products via ${productsUrl}`);

    const productsRes = await fetch(productsUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });

    if (!productsRes.ok) {
      console.error(`[CategoriesProducts][${rid}] /api/products status ${productsRes.status}`);
      return NextResponse.json({
        success: true,
        products: [],
        total: 0,
        category: rawTarget,
        _fallback: true,
        _error: `products status ${productsRes.status}`
      }, {
        status: 200,
        headers: { 'X-Category-Fallback': 'products-fetch-failed' }
      });
    }

    const payload = await productsRes.json().catch(() => []);
    let items: any[] = [];
    if (Array.isArray(payload)) items = payload;
    else if (Array.isArray(payload.items)) items = payload.items;
    else if (Array.isArray(payload.products)) items = payload.products;
    else if (Array.isArray(payload.data)) items = payload.data;

    console.log(`[CategoriesProducts][${rid}] total fetched items=${items.length}`);

    // กรอง exact (หลัง normalize)
    let filtered = items.filter(p => {
      const cats = collectCategoryCandidates(p);
      return cats.some(c => {
        const nc = normalizeSlug(c);
        const cc = normalizeForCompare(nc);
        return nc === normTarget || cc === compareTarget;
      });
    });

    // ถ้าไม่เจอ ลอง partial match
    if (filtered.length === 0) {
      const targetParts = compareTarget.split(' ').filter(Boolean);
      filtered = items.filter(p => {
        const cats = collectCategoryCandidates(p)
          .map(c => normalizeForCompare(normalizeSlug(c)));
        return cats.some(catNorm => targetParts.every(tp => catNorm.includes(tp)));
      });
      if (filtered.length) {
        console.log(`[CategoriesProducts][${rid}] using partial match, found ${filtered.length}`);
      }
    }

    const elapsed = Date.now() - started;
    console.log(`[CategoriesProducts][${rid}] filtered=${filtered.length} elapsed=${elapsed}ms`);

    return NextResponse.json({
      success: true,
      products: filtered,
      total: filtered.length,
      category: rawTarget,
      _fallback: true,
      _rid: rid,
      _elapsed: elapsed,
      _allCount: items.length
    }, {
      status: 200,
      headers: { 'X-Category-Fallback': 'true' }
    });

  } catch (err: any) {
    console.error(`[CategoriesProducts][${rid}] fatal`, err?.message);
    return NextResponse.json({
      success: true,
      products: [],
      total: 0,
      category: rawTarget,
      _fallback: true,
      _error: err?.message || 'unknown'
    }, {
      status: 200,
      headers: { 'X-Category-Fallback': 'fatal-error' }
    });
  }
}