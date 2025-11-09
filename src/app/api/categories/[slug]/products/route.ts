import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // กัน validation บางเคสของ Next

function resolveBase() {
  const raw =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.ADMIN_API_URL ||
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://backend-aquaroom.vercel.app');
  if (!raw) return 'https://backend-aquaroom.vercel.app';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(localhost|127\.0\.0\.1)/i.test(raw)) return `http://${raw}`;
  return `https://${raw}`;
}
const normalizeBase = (u: string) => u.replace(/\/+$/, '');
const sameHost = (base: string, host: string) => {
  try { return new URL(base).host.toLowerCase() === host.toLowerCase(); } catch { return false; }
};
const norm = (s: any) => {
  try { return decodeURIComponent(String(s ?? '')).trim().toLowerCase(); }
  catch { return String(s ?? '').trim().toLowerCase(); }
};
const isNumericId = (s: string) => /^\d+$/.test(s);

type AnyObj = Record<string, any>;

function extractAuth(req: Request) {
  let auth = req.headers.get('authorization') || '';
  if (!auth) {
    const cookieHeader = req.headers.get('cookie') || '';
    const m = cookieHeader.match(/(?:^|;\s*)(access_token|token|auth|jwt)=([^;]+)/i);
    if (m) auth = `Bearer ${decodeURIComponent(m[2])}`;
  }
  return auth;
}

// ใช้ any เพื่อเลี่ยง validation bug ของ Next.js ตอน build
export async function GET(req: Request, ctx: any) {
  const { slug } = (await ctx?.params) ?? {};
  const inputParam: string = String(slug ?? '');
  const base = normalizeBase(resolveBase());
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  if (sameHost(base, host)) {
    return NextResponse.json({ success: false, message: 'API base URL misconfigured' }, { status: 500 });
  }

  const auth = extractAuth(req);
  const makeHeaders = () => ({ accept: 'application/json', ...(auth ? { authorization: auth } : {}) });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const started = Date.now();

  const fetchCategoryProducts = async (val: string) => {
    const url = `${base}/api/categories/${encodeURIComponent(val)}/products`;
    console.log(`[cat-products] -> ${url}`);
    const r = await fetch(url, { headers: makeHeaders(), cache: 'no-store', signal: controller.signal });
    const txt = await r.text();
    let data: any; try { data = txt ? JSON.parse(txt) : {}; } catch { data = { raw: txt }; }
    return { r, data, url };
  };

  const fetchTree = async () => {
    const url = `${base}/api/categories/tree`;
    const r = await fetch(url, { headers: makeHeaders(), cache: 'no-store', signal: controller.signal });
    const txt = await r.text();
    let data: any; try { data = txt ? JSON.parse(txt) : null; } catch { data = null; }
    return data;
  };

  const findByNameInTree = (tree: any, name: string): AnyObj | null => {
    const target = norm(name);
    const stack = Array.isArray(tree) ? [...tree] : (tree ? [tree] : []);
    while (stack.length) {
      const n = stack.pop();
      if (!n || typeof n !== 'object') continue;
      if (norm(n.name) === target || norm(n.title) === target) return n;
      for (const ck of ['children','items','subcategories','nodes']) {
        if (Array.isArray(n[ck])) stack.push(...n[ck]);
      }
    }
    return null;
  };

  try {
    // 1) ถ้าเป็นตัวเลข ให้ยิงด้วย id ตรงๆ
    if (isNumericId(inputParam)) {
      const { r, data, url } = await fetchCategoryProducts(inputParam);
      clearTimeout(timeout);
      console.log(`[cat-products] <- ${r.status} ${Date.now()-started}ms from ${url}`);
      return NextResponse.json(data, { status: r.status });
    }

    // 2) ลองยิงด้วย param เดิม (กรณี backend รองรับชื่อ)
    let attempts: { tried: string; status: number; message?: any }[] = [];
    let { r, data, url } = await fetchCategoryProducts(inputParam);
    attempts.push({ tried: inputParam, status: r.status, message: data?.message });

    const notFound = r.status === 404 || /ไม่พบหมวดหมู่/i.test(String(data?.message ?? ''));

    // 3) ถ้าไม่พบ -> ไปหา id จาก tree โดยเทียบกับ name/title
    if (notFound) {
      const tree = await fetchTree();
      const node = findByNameInTree(tree, inputParam);
      const idCandidate = node?.id != null ? String(node.id) : '';
      if (idCandidate) {
        const attempt = await fetchCategoryProducts(idCandidate);
        attempts.push({ tried: idCandidate, status: attempt.r.status, message: attempt.data?.message });
        if (attempt.r.ok) {
          clearTimeout(timeout);
          console.log(`[cat-products] resolved "${inputParam}" -> id=${idCandidate} in ${Date.now()-started}ms`);
          return NextResponse.json(attempt.data, { status: attempt.r.status });
        }
      }
      clearTimeout(timeout);
      return NextResponse.json(
        { success: false, message: 'ไม่พบหมวดหมู่', input: inputParam, attempts },
        { status: 404 }
      );
    }

    // 4) กรณีพบจากการลอง param เดิม
    clearTimeout(timeout);
    console.log(`[cat-products] success "${inputParam}" ${r.status} ${Date.now()-started}ms`);
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    clearTimeout(timeout);
    console.error('Proxy error products:', e?.message || e);
    return NextResponse.json({ success: false, message: 'proxy error' }, { status: 502 });
  }
}