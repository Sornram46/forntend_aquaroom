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
  const BASE = resolveBase();
  try {
    const rid = (() => { try { // @ts-ignore
      return (globalThis.crypto?.randomUUID?.() as string) || Math.random().toString(36).slice(2); } catch { return Math.random().toString(36).slice(2); } })();
    const url = `${BASE}/api/categories`;
    const started = Date.now();
    console.log(`[${rid}] GET /api/categories -> ${url}`);
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    console.log(`[${rid}] GET /api/categories <- ${res.status} in ${Date.now() - started}ms`);
    const raw = await res.json().catch(() => null);
    const list = Array.isArray(raw) ? raw : (raw.categories ?? raw.data?.categories ?? raw.data ?? []);
    const normalized = Array.isArray(list) ? list.map(mapCategory) : [];
    return NextResponse.json({ success: true, categories: normalized }, { status: res.ok ? 200 : res.status });
  } catch {
    // fallback ไป tree proxy
    const altUrl = `${BASE}/api/categories/tree`;
    console.warn(`GET /api/categories primary failed, trying: ${altUrl}`);
    const alt = await fetch(altUrl).catch(() => null as any);
    if (alt && alt.ok) {
      const data = await alt.json().catch(() => ({}));
      return NextResponse.json(data);
    }
    return NextResponse.json({ success: true, categories: [] }, { status: 200 });
  }
}
