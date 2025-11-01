import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendBase, logStart, logEnd } from '@/lib/backend';

export const runtime = 'nodejs';

function toSlug(name: string) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function mapCategory(c: any): any {
  return {
    id: Number(c?.id ?? c?.category_id ?? 0),
    name: String(c?.name ?? c?.title ?? 'หมวดหมู่'),
    slug: String(c?.slug ?? c?.seo_slug ?? toSlug(c?.name ?? '')).toLowerCase(),
    image_url: c?.image_url ?? c?.image_url_cate ?? c?.icon ?? null,
    products_count: Number(c?.products_count ?? c?._count?.product_categories ?? 0),
    children: Array.isArray(c?.children) ? c.children.map(mapCategory) : [],
  };
}

export async function GET(_req: NextRequest) {
  const rid = crypto.randomUUID();
  const base = resolveBackendBase();
  const url = `${base}/api/categories`;
  const t0 = Date.now();
  try {
    logStart(rid, '/api/categories', url);
    const r = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    const data = await r.json().catch(() => ([]));
    logEnd(rid, url, r.status, Date.now() - t0);
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    console.error(`[${rid}] categories error:`, e?.code || e?.name, e?.message);
    return NextResponse.json({ error: 'proxy_error', message: e?.message }, { status: 502 });
  }
}
