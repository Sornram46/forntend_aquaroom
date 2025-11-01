export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { resolveBackendBase, logStart, logEnd } from '@/lib/backend';

export async function GET() {
  const rid = crypto.randomUUID();
  const base = resolveBackendBase();
  const url = `${base}/api/homepage-setting`;
  const t0 = Date.now();
  
  try {
    logStart(rid, '/api/homepage-setting', url);
    const r = await fetch(url, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    const data = await r.json().catch(() => ({}));
    logEnd(rid, url, r.status, Date.now() - t0);
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    console.error(`[${rid}] homepage-setting error:`, e?.code || e?.name, e?.message);
    return NextResponse.json({ error: 'proxy_error', message: e?.message }, { status: 502 });
  }
}
