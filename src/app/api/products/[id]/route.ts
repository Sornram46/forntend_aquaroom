import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendBase, logStart, logEnd } from '@/lib/backend';

export const runtime = 'nodejs';

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const rid = crypto.randomUUID();
  const base = resolveBackendBase();
  const url = `${base}/api/products/${encodeURIComponent(params.id)}`;
  const t0 = Date.now();
  
  try {
    logStart(rid, `/api/products/${params.id}`, url);
    const r = await fetch(url, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await r.text();
      logEnd(rid, url, r.status, Date.now() - t0);
      return new NextResponse(text, { status: r.status, headers: { 'content-type': ct } });
    }

    const payload = await r.json().catch(() => ({}));
    const product = payload?.product ?? payload?.data ?? payload;
    const normalized = normalizeProduct(product);

    logEnd(rid, url, r.status, Date.now() - t0);
    return NextResponse.json(normalized, { status: r.status });
  } catch (e: any) {
    console.error(`[${rid}] products/${params.id} error:`, e?.code || e?.name, e?.message);
    return NextResponse.json({ error: 'proxy_error', message: e?.message }, { status: 502 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const rid = crypto.randomUUID();
  const base = resolveBackendBase();
  const url = `${base}/api/products/${encodeURIComponent(params.id)}`;
  const t0 = Date.now();

  try {
    logStart(rid, `/api/products/${params.id}`, url, 'PUT');
    const body = await request.text();
    const r = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'Authorization': request.headers.get('authorization') || '',
        'Accept': 'application/json',
      },
      body,
      cache: 'no-store',
    });
    
    const data = await r.text();
    logEnd(rid, url, r.status, Date.now() - t0);
    return new NextResponse(data, {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e: any) {
    console.error(`[${rid}] PUT products/${params.id} error:`, e?.code || e?.name, e?.message);
    return NextResponse.json({ error: 'proxy_error', message: e?.message }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const rid = crypto.randomUUID();
  const base = resolveBackendBase();
  const url = `${base}/api/products/${encodeURIComponent(params.id)}`;
  const t0 = Date.now();

  try {
    logStart(rid, `/api/products/${params.id}`, url, 'DELETE');
    const r = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('authorization') || '',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    const data = await r.text();
    logEnd(rid, url, r.status, Date.now() - t0);
    return new NextResponse(data, {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e: any) {
    console.error(`[${rid}] DELETE products/${params.id} error:`, e?.code || e?.name, e?.message);
    return NextResponse.json({ error: 'proxy_error', message: e?.message }, { status: 502 });
  }
}