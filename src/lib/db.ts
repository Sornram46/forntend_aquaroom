

// หมายเหตุ: ห้ามเชื่อมต่อ DB ตรงจาก frontend

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  'https://backend-aquaroom.vercel.app';

// ให้แน่ใจว่ามี https:// เสมอ
export const API_BASE_URL = raw.startsWith('http') ? raw : `https://${raw}`;

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
    const res = await fetch(`${API_BASE_URL}/api/products/popular`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await jsonOr(res, []);
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