import { fetchPopularProducts, toAbsoluteUrl } from '@/lib/db';
import PopularProductsClient from '@/components/PopularProductsClient';

// Server component wrapper: fetch data on the server and pass to a client component
export default async function PopularProducts() {
  const raw = await fetchPopularProducts();
  const products = (raw || []).map((p: any) => ({
    ...p,
    // Normalize to a single field and absolutize once on the server
    imageUrl: toAbsoluteUrl(p.imageUrl || p.image_url || p.image),
  }));

  return <PopularProductsClient products={products} />;
}