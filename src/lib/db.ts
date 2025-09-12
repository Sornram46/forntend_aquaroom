import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});
export default pool; // เพิ่มบรรทัดนี้เพื่อ export pool เป็นค่า default


export async function query(text: string, params?: any[]) {
    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query executed:', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  'https://backend-aquaroom.vercel.app';

export const API_BASE_URL = raw.startsWith('http') ? raw : `https://${raw}`;

export async function fetchCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [
      { id: 1, name: 'อุปกรณ์คอมพิวเตอร์', image_url_cate: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=500&h=300&fit=crop', is_active: true, products_count: 15 },
      { id: 2, name: 'เครื่องใช้ไฟฟ้า', image_url_cate: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop', is_active: true, products_count: 8 },
    ];
  }
}

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

export async function fetchPopularProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/popular`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching popular products:', err);
    return [];
  }
}

export async function fetchHomepageSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/homepage-setting`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching homepage settings:', err);
    return {};
  }
}