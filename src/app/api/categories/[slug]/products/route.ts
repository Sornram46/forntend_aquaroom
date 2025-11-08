import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeSlug(raw: string) {
  return decodeURIComponent(String(raw || ''))
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining marks
    .replace(/[^a-z0-9ก-๙\s-]/g, '') // keep thai, latin, digits, space, dash
    .replace(/\s+/g, '-')            // spaces -> dash
    .replace(/-+/g, '-');
}

function normalizeForCompare(v: string) {
  return normalizeSlug(v).replace(/-/g, ' ').trim();
}

// ดึง candidate ของหมวดจากสินค้า (รองรับหลายฟิลด์)
function collectCategoryCandidates(p: any) {
  const names = new Set<string>();
  const ids = new Set<string>();

  const addName = (v: any) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (s) names.add(s);
  };
  const addId = (v: any) => {
    if (v === undefined || v === null) return;
    const s = String(v);
    if (s.trim() !== '') ids.add(s);
  };

  // common single fields
  addName(p.category);
  addName(p.category_name);
  addName(p.categoryName);
  addName(p.category_slug);
  addName(p.category_th);
  addName(p.category_en);
  addName(p.categoryThai);
  addName(p.categoryEnglish);
  addName(p.type);
  addName(p.tag);

  // nested object
  if (p.category && typeof p.category === 'object') {
    addName(p.category.name);
    addName(p.category.slug);
    addId(p.category.id);
    addName(p.category.th);
    addName(p.category.en);
  }

  // id-like
  addId(p.categoryId);
  addId(p.category_id);

  // arrays that may contain names or objects
  const arrays = [
    p.categories,
    p.product_categories,
    p.productCategories,
    p.tags,
    p.labels,
  ];
  arrays.forEach(arr => {
    if (!Array.isArray(arr)) return;
    arr.forEach((it: any) => {
      if (it && typeof it === 'object') {
        // try common keys
        if ('id' in it) addId((it as any).id);
        if ('name' in it) addName((it as any).name);
        if ('slug' in it) addName((it as any).slug);
        if ('title' in it) addName((it as any).title);
        if ('label' in it) addName((it as any).label);
        if ('th' in it) addName((it as any).th);
        if ('en' in it) addName((it as any).en);
      } else {
        const s = String(it);
        if (/^\d+$/.test(s)) addId(s);
        else addName(s);
      }
    });
  });

  return { names: Array.from(names), ids: Array.from(ids) };
}

type CategoryNode = {
  id?: string | number;
  name?: string;
  slug?: string;
  children?: CategoryNode[];
};

function flattenCategoryTree(root: CategoryNode[] | undefined): { ids: Set<string>, names: Set<string> } {
  const ids = new Set<string>();
  const names = new Set<string>();
  const stack = Array.isArray(root) ? [...root] : [];
  while (stack.length) {
    const node = stack.pop()!;
    if (!node) continue;
    if (node.id !== undefined) ids.add(String(node.id));
    if (node.name) names.add(node.name);
    if (node.slug) names.add(node.slug);
    if (Array.isArray(node.children)) stack.push(...node.children);
  }
  return { ids, names };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const debug = ['1', 'true', 'yes'].includes((req.nextUrl.searchParams.get('debug') || '').toLowerCase());
  const rid = crypto.randomUUID();
  const started = Date.now();

  const rawTarget = String(slug || '');
  const normTarget = normalizeSlug(rawTarget);
  const compareTarget = normalizeForCompare(normTarget);
  const targetParts = compareTarget.split(' ').filter(Boolean);

  try {
    // 1) same-origin fetch
    const origin = req.nextUrl.origin;
    const productsUrl = new URL('/api/products', origin).toString();
    const treeUrl = new URL('/api/categories/tree', origin).toString();

    const [productsRes, treeRes] = await Promise.all([
      fetch(productsUrl, { cache: 'no-store', headers: { Accept: 'application/json' } }),
      fetch(treeUrl, { cache: 'no-store', headers: { Accept: 'application/json' } }).catch(() => undefined),
    ]);

    if (!productsRes.ok) {
      return NextResponse.json(
        { success: true, products: [], total: 0, category: rawTarget, _fallback: true, _error: `products status ${productsRes.status}`, _rid: rid },
        { status: 200, headers: { 'X-Category-Route': 'v4-products-fetch-failed' } }
      );
    }

    const payload = await productsRes.json().catch(() => []);
    let items: any[] = [];
    if (Array.isArray(payload)) items = payload;
    else if (Array.isArray(payload.items)) items = payload.items;
    else if (Array.isArray(payload.products)) items = payload.products;
    else if (Array.isArray(payload.data)) items = payload.data;

    // 2) tree (optional)
    let tree: CategoryNode[] | undefined;
    if (treeRes && treeRes.ok) {
      const t = await treeRes.json().catch(() => null);
      if (Array.isArray(t)) tree = t as any;
      else if (Array.isArray(t?.items)) tree = t.items as any;
      else if (Array.isArray(t?.data)) tree = t.data as any;
    }
    const flattened = flattenCategoryTree(tree);

    // map names from tree that match slug
    const targetNames = new Set<string>();
    flattened.names.forEach(n => {
      const nNorm = normalizeSlug(n);
      const nCmp = normalizeForCompare(nNorm);
      if (nNorm === normTarget || nCmp === compareTarget) targetNames.add(n);
    });

    // 3) filter exact/compare
    const normalizeName = (s: string) => ({ norm: normalizeSlug(s), cmp: normalizeForCompare(s) });

    // Manual mapping (แก้ไขตามจริง)
    const MANUAL_MAP: Record<string, string[]> = {
      // slug: [productId,...]
      'ปลากัด': ['16','14'],          // ตัวอย่าง
      'เครื่องกรองน้ำ': [],
      'เครื่องปั้มลม': [],
    };

    // Heuristic + manual map
    let filtered = items.filter(p => {
      const idStr = String(p.id);
      const name = String(p.name || '').toLowerCase();
      const slugHit = MANUAL_MAP[normTarget]?.includes(idStr);
      const nameHit = name.includes(normTarget);          // “ปลากัด” ปรากฏในชื่อ
      return slugHit || nameHit;
    });

    // ถ้ายังว่าง ลองแยกคำ slug แล้ว match ทีละคำ
    if (filtered.length === 0) {
      const parts = normTarget.split('-').filter(Boolean);
      filtered = items.filter(p => {
        const name = String(p.name || '').toLowerCase();
        return parts.every(pt => name.includes(pt));
      });
    }

    // 4) partial match by words
    if (filtered.length === 0 && targetParts.length) {
      filtered = items.filter(p => {
        const cat = collectCategoryCandidates(p);
        const normNames = cat.names.map(n => normalizeForCompare(n));
        return normNames.some(nn => targetParts.every(pt => nn.includes(pt)));
      });
    }

    // 5) heuristic fallback by product name/description
    if (filtered.length === 0) {
      filtered = items.filter(p => {
        const name = normalizeForCompare(String(p.name || ''));
        const desc = normalizeForCompare(String(p.description || p.details || ''));
        return targetParts.every(tp => name.includes(tp) || desc.includes(tp));
      });
    }

    // debug dump (เฉพาะ 5 รายการแรก)
    let debugDump: any[] | undefined;
    if (debug) {
      debugDump = items.slice(0, 5).map((p: any) => {
        const c = collectCategoryCandidates(p);
        return {
          id: p.id,
          name: p.name,
          candidates: {
            names: c.names,
            ids: c.ids,
          },
        };
      });
    }

    const elapsed = Date.now() - started;
    const body: any = {
      success: true,
      products: filtered,
      total: filtered.length,
      category: rawTarget,
      _fallback: true,
      _rid: rid,
      _elapsed: elapsed,
      _allCount: items.length,
      _source: 'internal-products+tree',
    };
    if (debug) body._debug = debugDump;

    return NextResponse.json(body, { status: 200, headers: { 'X-Category-Route': 'v4' } });
  } catch (err: any) {
    return NextResponse.json(
      { success: true, products: [], total: 0, category: rawTarget, _fallback: true, _error: err?.message || 'unknown', _rid: rid },
      { status: 200, headers: { 'X-Category-Route': 'v4-fatal' } }
    );
  }

  const SERVICE_KEY = process.env.BACKEND_SERVICE_KEY; // ใส่ใน Vercel (Environment Variable)
  if (SERVICE_KEY) {
    const directUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/,'')}/api/categories/${encodeURIComponent(rawTarget)}/products`;
    const directRes = await fetch(directUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      cache: 'no-store',
    });
    if (directRes.ok) {
      const directData = await directRes.json().catch(()=>[]);
      const arr = Array.isArray(directData) ? directData
        : Array.isArray(directData.items) ? directData.items
        : Array.isArray(directData.products) ? directData.products
        : Array.isArray(directData.data) ? directData.data
        : [];
      return NextResponse.json({
        success: true,
        products: arr,
        total: arr.length,
        category: rawTarget,
        _method: 'backend-direct',
      });
    }
  }
}