import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendBase, logStart, logEnd } from '@/lib/backend';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rid = crypto.randomUUID();
  const base = resolveBackendBase();
  const params = req.nextUrl.searchParams.toString();
  const url = `${base}/api/products${params ? `?${params}` : ''}`;
  const t0 = Date.now();

  try {
    logStart(rid, '/api/products', url);
    const r = await fetch(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    const data = await r.json().catch(() => []);
    logEnd(rid, url, r.status, Date.now() - t0);
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    console.error(`[${rid}] products error:`, e?.code || e?.name, e?.message);
    return NextResponse.json({ error: 'proxy_error', message: e?.message }, { status: 502 });
  }
}