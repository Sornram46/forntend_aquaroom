import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

function resolveBase() {
  const raw =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.ADMIN_API_URL ||
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://backend-aquaroom.vercel.app');
  const s = (raw || '').trim();
  const lower = s.toLowerCase();
  if (!s || lower.startsWith('postgres://') || lower.startsWith('postgresql://') || lower.includes(':5432')) {
    return 'https://backend-aquaroom.vercel.app';
  }
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('localhost') || s.startsWith('127.0.0.1')) return `http://${s}`;
  return `https://${s}`;
}
const BASE = resolveBase();

// Normalize ให้ได้โครงสร้างที่เพจคาดหวัง
function normalizeProduct(src: any) {
  const p = src ?? {};

  const id = p.id ?? p._id ?? p.productId ?? p.sku ?? null;
  const name = p.name ?? p.title ?? p.product_name ?? '';

  const priceRaw = p.price ?? p.unit_price ?? p.sale_price ?? p.regular_price ?? 0;
  const price = typeof priceRaw === 'string' ? parseFloat(priceRaw) || 0 : Number(priceRaw) || 0;

  const stockRaw = p.stock ?? p.quantity ?? p.inventory ?? p.available ?? p.qty ?? 0;
  const stock = typeof stockRaw === 'string' ? parseInt(stockRaw, 10) || 0 : Number(stockRaw) || 0;

  // รวมทุกแหล่งรูป + ตัดซ้ำ
  const list: string[] = [
    ...(Array.isArray(p.images) ? p.images : []),
    ...(Array.isArray(p.image_urls) ? p.image_urls : []),
    p.imageUrl,
    p.image_url,
    p.image_url_two,
    p.image_url_three,
    p.image_url_four,
    p.thumbnail,
    p.cover,
    p.image,
  ].filter(Boolean);
  const images = Array.from(new Set(list));
  const [imageUrl, imageUrlTwo, imageUrlThree, imageUrlFour] = images;

  return {
    ...p,
    id,
    name,
    price,
    stock,
    quantity: typeof p.quantity !== 'undefined' ? p.quantity : stock,
    images,
    imageUrl: imageUrl ?? null,
    imageUrlTwo: imageUrlTwo ?? null,
    imageUrlThree: imageUrlThree ?? null,
    imageUrlFour: imageUrlFour ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const rid = (() => {
      try { // @ts-ignore
        return (globalThis.crypto?.randomUUID?.() as string) || Math.random().toString(36).slice(2);
      } catch { return Math.random().toString(36).slice(2); }
    })();
    if (!BASE) throw new Error('BACKEND URL is missing');

    const url = new URL(request.url);
    const id = url.pathname.split('/').filter(Boolean).pop();
    if (!id) return Response.json({ error: 'Missing product id' }, { status: 400 });

    const auth = request.headers.get('authorization') || '';
    const targets = [
      `${BASE}/api/products/${encodeURIComponent(id)}`,
      `${BASE}/api/product/${encodeURIComponent(id)}`,
      `${BASE}/api/products?id=${encodeURIComponent(id)}`,
      `${BASE}/api/product?id=${encodeURIComponent(id)}`,
    ];

    let last: Response | null = null;

    const eqId = (val: unknown, want: string) => {
      if (val == null) return false;
      const a = String(val).trim();
      const b = String(want).trim();
      if (a === b) return true;
      // numeric compare
      const na = Number(a);
      const nb = Number(b);
      return Number.isFinite(na) && Number.isFinite(nb) && na === nb;
    };

    const matchesRequestedId = (obj: any, want: string) => {
      if (!obj || typeof obj !== 'object') return false;
      const keys = ['id', '_id', 'productId', 'product_id', 'sku', 'slug_id', 'id_product', 'pid'];
      for (const k of keys) {
        if (k in obj && eqId((obj as any)[k], want)) return true;
      }
      return false;
    };

    const pickProductFromPayload = (payload: any, wantId: string): any | null => {
      if (!payload) return null;
      if (matchesRequestedId(payload, wantId)) return payload;
      const candidatesArrays: any[] = [];
      const obj = payload as any;
      if (Array.isArray(obj)) candidatesArrays.push(obj);
      if (Array.isArray(obj?.data)) candidatesArrays.push(obj.data);
      if (Array.isArray(obj?.result)) candidatesArrays.push(obj.result);
      if (Array.isArray(obj?.items)) candidatesArrays.push(obj.items);
      if (Array.isArray(obj?.products)) candidatesArrays.push(obj.products);
      // Some APIs wrap the object directly
      const direct = obj?.product ?? obj?.item ?? obj?.data ?? obj?.result;
      if (direct && !Array.isArray(direct) && typeof direct === 'object') {
        if (matchesRequestedId(direct, wantId)) return direct;
      }
      for (const arr of candidatesArrays) {
        const found = arr.find((it: any) => matchesRequestedId(it, wantId));
        if (found) return found;
        if (arr.length === 1 && typeof arr[0] === 'object') return arr[0];
      }
      return null;
    };
    console.log(`[${rid}] GET /api/products/[id](${id}) candidates:`, targets);
    for (const t of targets) {
      const started = Date.now();
      console.log(`[${rid}] -> ${t}`);
      const res = await fetch(t, { cache: 'no-store', headers: { accept: 'application/json', authorization: auth } });
      last = res;
      console.log(`[${rid}] <- ${res.status} from ${t} in ${Date.now() - started}ms`);
      if (!res.ok) { if (res.status === 404) continue; break; }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        return new Response(await res.text(), { status: res.status, headers: { 'content-type': ct } });
      }
      const payload = await res.json();
      const candidate = pickProductFromPayload(payload, id);
      if (!candidate) {
        console.log(`[${rid}] no exact match in payload for id=${id}`);
      }
      if (candidate) {
        return Response.json(normalizeProduct(candidate), { status: 200 });
      }
      // No matching product in this upstream, try next target
      continue;
    }

    if (last) {
      return new Response(await last.text(), {
        status: last.status,
        headers: { 'content-type': last.headers.get('content-type') ?? 'application/json' },
      });
    }
    return Response.json({ error: 'Product not found' }, { status: 404 });
  } catch (e) {
    console.error('Proxy GET /api/products/[id] failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 1];
    const res = await fetch(`${BASE}/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'content-type': request.headers.get('content-type') || 'application/json',
        authorization: request.headers.get('authorization') || '',
      },
      body: await request.text(),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy PUT /api/products/[id] failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const id = segments[segments.length - 1];
    const res = await fetch(`${BASE}/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { authorization: request.headers.get('authorization') || '' },
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy DELETE /api/products/[id] failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}