import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.API_BASE_URL ||
  'https://backend-aquaroom.vercel.app';

const SPECIAL_BASE = Number(process.env.SPECIAL_SHIPPING_BASE ?? '80');
const SPECIAL_THRESHOLD = Number(process.env.SPECIAL_SHIPPING_THRESHOLD ?? '4');
const SPECIAL_EXTRA = Number(process.env.SPECIAL_SHIPPING_EXTRA ?? '10');

function mergeItems(items: Array<{ id: number; quantity: number; name?: string }>) {
  const m = new Map<number, { id: number; quantity: number; name?: string }>();
  for (const it of items || []) {
    const q = Number(it.quantity || 0);
    const prev = m.get(it.id);
    if (prev) prev.quantity += q;
    else m.set(it.id, { id: it.id, quantity: q, name: it.name });
  }
  return Array.from(m.values());
}

const toNum = (v: any): number | null => {
  if (v === null || v === undefined) return null;
  try {
    const s = typeof v === 'object' && typeof v.toString === 'function' ? v.toString() : v;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  } catch { return null; }
};

function pickPerProductCost(p: any): number | null {
  const provinces = toNum(p?.shipping_cost_provinces);
  const bangkok   = toNum(p?.shipping_cost_bangkok);
  const remote    = toNum(p?.shipping_cost_remote);
  return provinces ?? bangkok ?? remote ?? null;
}

async function fetchProduct(backend: string, id: number) {
  const urls = [
    `${backend}/api/products?id=${id}`,
    `${backend}/api/products/${id}`,
    `${backend}/api/product/${id}`
  ];
  for (const u of urls) {
    try {
      const r = await fetch(u, { cache: 'no-store' });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j) continue;
      if (Array.isArray(j)) return j.find((x: any) => x?.id === id) || null;
      if (j?.product?.id === id) return j.product;
      if (j?.id === id) return j;
      if (Array.isArray(j?.products)) return j.products.find((x: any) => x?.id === id) || null;
    } catch {}
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = mergeItems(Array.isArray(body?.items) ? body.items : []);
    const subtotal = Number(body?.subtotal || 0);

    // 1) เรียก backend เดิมก่อน
    const beRes = await fetch(`${API_BASE_URL}/api/calculate-shipping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, subtotal })
    });
    const beJson = await beRes.json().catch(() => ({} as any));

    const details = beJson?.data?.details || [];
    const versionMissing = !beJson?.version;
    const onlyDefaults = Array.isArray(details) && details.length > 0 && details.every((d: any) => d?.type === 'default');

    // 2) ถ้า backend ยังเก่า/เป็น default ล้วน → คำนวณแบบ “ผสม” ทาง proxy
    if (versionMissing || onlyDefaults) {
      // ดึงข้อมูลสินค้า
      const productMap = new Map<number, any>();
      await Promise.all(items.map(async it => {
        const p = await fetchProduct(API_BASE_URL, it.id);
        if (p) productMap.set(it.id, p);
      }));

      // แยกพิเศษ/ปกติ
      const specials: Array<{ id: number; name: string; qty: number; p: any }> = [];
      const normals: Array<{ id: number; name: string; qty: number; p: any }> = [];
      for (const it of items) {
        const p = productMap.get(it.id);
        const name = it.name || p?.name || `#${it.id}`;
        const qty = Number(it.quantity || 0);
        if (p?.has_special_shipping) specials.push({ id: it.id, name, qty, p });
        else normals.push({ id: it.id, name, qty, p });
      }

      // พิเศษ: รวมทั้งกลุ่ม
      let total = 0;
      const newDetails: any[] = [];
      if (specials.length > 0) {
        const totalQty = specials.reduce((s, x) => s + x.qty, 0);
        let cost = SPECIAL_BASE;
        if (totalQty > SPECIAL_THRESHOLD) cost += (totalQty - SPECIAL_THRESHOLD) * SPECIAL_EXTRA;
        total += cost;
        newDetails.push({
          type: 'special_group',
          products: specials.map(x => ({ id: x.id, name: x.name, qty: x.qty })),
          total_qty: totalQty,
          config: { base: SPECIAL_BASE, threshold: SPECIAL_THRESHOLD, extra: SPECIAL_EXTRA },
          shipping: cost
        });
      }

      // ปกติ: ใช้ค่าส่งระดับสินค้า
      for (const x of normals) {
        const per = pickPerProductCost(x.p);
        if (per != null && per > 0) {
          total += per;
          newDetails.push({
            type: 'product_shipping',
            product: { id: x.id, name: x.name },
            quantity: x.qty,
            shipping: per,
            raw: {
              provinces: x.p?.shipping_cost_provinces ?? null,
              bangkok: x.p?.shipping_cost_bangkok ?? null,
              remote: x.p?.shipping_cost_remote ?? null
            }
          });
        }
      }

      const patched = {
        ...beJson,
        version: 'proxy-fix-v3-mixed',
        shippingCost: total,
        data: { ...(beJson?.data || {}), totalShippingCost: total, details: newDetails }
      };
      return new Response(JSON.stringify(patched), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 3) ถ้า backend ใหม่แล้ว → ส่งต่อผลเดิม
    return new Response(JSON.stringify(beJson), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'proxy error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}