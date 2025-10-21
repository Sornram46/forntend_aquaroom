// หมายเหตุ: ห้ามเชื่อมต่อ DB ตรงจาก frontend

const defaultBase =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://backend-aquaroom.vercel.app';

const raw =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  defaultBase;

// ให้แน่ใจว่ามี protocol ที่ถูกต้องเสมอ และหลีกเลี่ยงค่า DB URL/พอร์ต 5432
export const API_BASE_URL = (() => {
  const s = (raw || '').trim();
  const lower = s.toLowerCase();
  if (!s || lower.startsWith('postgres://') || lower.startsWith('postgresql://') || lower.includes(':5432')) {
    return defaultBase;
  }
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('localhost') || s.startsWith('127.0.0.1')) {
    return `http://${s}`;
  }
  return `https://${s}`;
})();

// แปลง path เป็น absolute URL (กันกรณี /uploads/...)
export function toAbsoluteUrl(src?: string | null) {
  if (!src) return '';
  if (/^https?:\/\//i.test(src)) return src;
  const base = API_BASE_URL.replace(/\/+$/, '');
  const rel = src.startsWith('/') ? src : `/${src}`;
  return `${base}${rel}`;
}

async function jsonOr<T>(res: Response, fallback: T): Promise<T> {
  try { return (await res.json()) as T; } catch { return fallback; }
}

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await jsonOr(res, []);
  } catch (e) {
    console.error('Error fetching categories:', e);
    return [];
  }
}

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await jsonOr(res, []);
  } catch (e) {
    console.error('Error fetching products:', e);
    return [];
  }
}

export async function fetchPopularProducts() {
  try {
    // Try dedicated endpoint first
    const res = await fetch(`${API_BASE_URL}/api/products/popular`, { cache: 'no-store' });
    if (res.ok) {
      const data = await jsonOr<any>(res, []);
      const arr = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray((data as any)?.products)
        ? (data as any).products
        : [];
      if (arr.length > 0) return arr;
    }
    // Fallback: fetch all and filter by popular flags
    const allRes = await fetch(`${API_BASE_URL}/api/products`, { cache: 'no-store' });
    if (!allRes.ok) return [];
  const all = await jsonOr<any[]>(allRes, []);
    const isPopular = (p: any) => {
      const v = p?.is_poppular ?? p?.is_popular ?? p?.isPopular ?? p?.popular ?? p?.featured ?? p?.is_featured;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v === 1;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return s === '1' || s === 'true' || s === 'y' || s === 'yes' || s === 't';
      }
      return false;
    };
    const filtered = (all || []).filter(isPopular);
    return filtered.length > 0 ? filtered : all;
  } catch (e) {
    console.error('Error fetching popular products:', e);
    return [];
  }
}

export async function fetchHomepageSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/homepage-setting`, { cache: 'no-store' });
    if (!res.ok) return {};
    return await jsonOr(res, {});
  } catch (e) {
    console.error('Error fetching homepage settings:', e);
    return {};
  }
}

// NOTE: Some server route files import `query` from '@/lib/db'.
// This workspace is a frontend-only repo and doesn't have direct DB access here.
// Export a stub `query` function so imports compile; it will throw if called at runtime.
export async function query(_sql: string, _params?: any[]): Promise<any> {
  throw new Error('Server-side database query called from frontend package. This environment does not support direct DB queries.');
}