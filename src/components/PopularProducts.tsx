import { fetchPopularProducts, toAbsoluteUrl } from '@/lib/db';
import PopularProductsClient from '@/components/PopularProductsClient';

// Server component wrapper: fetch data on the server and pass to a client component
export default async function PopularProducts() {
  const raw = (await fetchPopularProducts()) || [];

  const isPopularFlag = (p: any) => {
    const v =
      p?.is_poppular ??
      p?.is_popular ??
      p?.isPopular ??
      p?.popular ??
      p?.featured ??
      p?.is_featured;

    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      return s === '1' || s === 'true' || s === 'y' || s === 'yes' || s === 't';
    }
    return false;
  };

  const filtered = raw.filter(isPopularFlag);

  // ถ้ากรองแล้วยังว่าง ให้ fallback เป็น raw (เชื่อว่า endpoint คัดมาแล้ว)
  const src = filtered.length > 0 ? filtered : raw;

  const products = src.map((p: any) => ({
    ...p,
    imageUrl: toAbsoluteUrl(p.imageUrl || p.image_url || p.image || p.thumbnail || p.cover),
  }));

  return <PopularProductsClient products={products} />;
}