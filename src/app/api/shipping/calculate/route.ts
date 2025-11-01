// src/app/api/shipping/calculate/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendBase, logStart, logEnd } from '@/lib/backend';

export async function POST(req: NextRequest) {
  const rid = crypto.randomUUID();
  const base = resolveBackendBase();
  const url = `${base}/api/shipping/calculate`;
  const body = await req.json().catch(() => ({}));
  const t0 = Date.now();
  
  try {
    logStart(rid, '/api/shipping/calculate', url, 'POST');
    const r = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    logEnd(rid, url, r.status, Date.now() - t0);
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    console.error(`[${rid}] shipping error:`, e?.code || e?.name, e?.message);
    return NextResponse.json({ error: 'proxy_error', message: e?.message }, { status: 502 });
  }
}

export async function GET() {
  // สำหรับ health check
  return Response.json({ ok: true });
}