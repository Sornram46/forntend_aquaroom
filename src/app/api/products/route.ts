import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Build a prioritized list of backend base URLs
const rawCandidates = [
  process.env.API_BASE_URL,
  process.env.NEXT_PUBLIC_BACKEND_URL,
  process.env.ADMIN_API_URL,
  process.env.BACKEND_URL,
  process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://backend-aquaroom.vercel.app',
  'https://backend-aquaroom.vercel.app',
].filter(Boolean) as string[];

const BASES = rawCandidates
  .map((r) => (r.startsWith('http') ? r : r.startsWith('localhost') || r.startsWith('127.0.0.1') ? `http://${r}` : `https://${r}`))
  .filter((u) => {
    const s = u.toLowerCase();
    return !s.startsWith('postgres://') && !s.startsWith('postgresql://') && !s.includes(':5432');
  });

function normalizeProduct(src: any) {
  const p = src ?? {};
  const id = p.id ?? p._id ?? p.productId ?? p.sku ?? null;
  const name = p.name ?? p.title ?? p.product_name ?? '';
  const priceRaw = p.price ?? p.unit_price ?? p.sale_price ?? p.regular_price ?? 0;
  const price = typeof priceRaw === 'string' ? parseFloat(priceRaw) || 0 : Number(priceRaw) || 0;
  const stockRaw = p.stock ?? p.quantity ?? p.inventory ?? p.available ?? p.qty ?? 0;
  const stock = typeof stockRaw === 'string' ? parseInt(stockRaw, 10) || 0 : Number(stockRaw) || 0;

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
    category: p.category ?? p.category_name ?? p.type ?? 'ทั่วไป',
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization') || '';
    const { search } = new URL(request.url);

    // Build endpoint candidates across all bases
    const endpointCandidates: string[] = [];
    for (const base of BASES) {
      endpointCandidates.push(`${base}/api/products${search}`);
      endpointCandidates.push(`${base}/api/product${search}`);
    }

    const controller = new AbortController();
    const TIMEOUT_MS = 6000; // quicker failover than 10s
    let lastError: any = null;
    let lastResponse: Response | null = null;

    for (const url of endpointCandidates) {
      try {
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { accept: 'application/json', authorization: auth },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        lastResponse = res;

        if (!res.ok) {
          // try next on 404, otherwise break and surface
          if (res.status === 404) continue;

          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            return new Response(await res.text(), { status: res.status, headers: { 'content-type': ct } });
          }
          const errPayload = await res.json().catch(() => null);
          return Response.json(errPayload ?? { success: false }, { status: res.status });
        }

        // OK response
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          return new Response(await res.text(), { status: res.status, headers: { 'content-type': ct } });
        }

        const payload = await res.json();
        const items = payload?.products ?? payload?.data ?? payload?.result ?? payload?.items ?? payload;
        const arr = Array.isArray(items) ? items : items ? [items] : [];
        const normalized = arr.map(normalizeProduct);
        return Response.json(normalized, { status: 200 });
      } catch (err: any) {
        // network/connect timeout; continue to next candidate
        lastError = err;
        continue;
      }
    }

    if (lastResponse) {
      return new Response(await lastResponse.text(), {
        status: lastResponse.status,
        headers: { 'content-type': lastResponse.headers.get('content-type') ?? 'application/json' },
      });
    }

    console.error('Proxy GET /api/products exhausted candidates', {
      candidates: endpointCandidates,
      error: lastError?.code || lastError?.message || String(lastError),
    });
    // Keep UI alive with empty list if all hosts failed
    return Response.json([], { status: 200 });
  } catch (e) {
    console.error('Proxy GET /api/products failed:', e);
    return Response.json([], { status: 200 });
  }
}