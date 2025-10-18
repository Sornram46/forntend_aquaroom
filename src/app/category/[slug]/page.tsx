import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug || '');

  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/categories/${encodeURIComponent(decoded)}/products`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">ไม่พบหมวดหมู่</h1>
        <p className="text-gray-600 mt-2">หมวด: {decoded}</p>
        <div className="mt-6">
          <Link href="/" className="text-indigo-600 hover:underline">กลับหน้าแรก</Link>
        </div>
      </div>
    );
  }

  const data = await res.json().catch(() => ({} as any));
  const category = data?.category;
  const products = Array.isArray(data?.products) ? data.products : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">{category?.name || decoded}</h1>
      <p className="text-gray-600 mt-2">หมวดหมู่: {category?.slug || decoded}</p>

      {products.length === 0 ? (
        <div className="mt-10 text-gray-500">ยังไม่มีสินค้าในหมวดนี้</div>
      ) : (
        <div className="mt-8">
          <ProductGrid
            products={products.map((p: any) => {
              const pid = (p.id ?? p.product_id ?? p.productId ?? p.id_product ?? p.pid ?? p.slug_id ?? p.slug ?? '').toString();
              return {
                id: pid,
                name: p.name ?? p.product_name ?? 'สินค้ารายการ',
                price: Number(p.price ?? p.product_price ?? 0),
                imageUrl: p.image_url_product || p.image_url || p.image || null,
                category: category?.name || p.category || p.category_name || '',
                stock: typeof p.stock === 'number' ? p.stock : (typeof p.quantity === 'number' ? p.quantity : undefined),
              };
            })}
          />
        </div>
      )}
    </div>
  );
}