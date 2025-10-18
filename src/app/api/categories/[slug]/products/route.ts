import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const pickBase = () =>
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:5000';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const BASE = pickBase();
  try {
    const res = await fetch(`${BASE}/api/categories/${encodeURIComponent(slug)}/products`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'proxy error' }, { status: 502 });
  }
}