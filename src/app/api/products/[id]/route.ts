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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const rid = crypto.randomUUID();
  const base = resolveBackendBase();
  const url = `${base}/api/products/${encodeURIComponent(params.id)}`;
  const t0 = Date.now();
  try {
    logStart(rid, `/api/products/${params.id}`, url);
    const r = await fetch(url, { cache: 'no-store', headers: { accept: 'application/json' } });
    const data = await r.json().catch(() => ({}));
    logEnd(rid, url, r.status, Date.now() - t0);
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    console.error(`[${rid}] products/${params.id} error:`, e?.code || e?.name, e?.message);
    return NextResponse.json({ error: 'proxy_error', message: e?.message }, { status: 502 });
  }
}