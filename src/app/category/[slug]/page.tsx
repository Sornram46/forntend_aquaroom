import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';
import { headers } from 'next/headers';
import React from 'react';

export const dynamic = 'force-dynamic';

async function baseUrl() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

async function getData(slug: string) {
  const url = `${await baseUrl()}/api/categories/${encodeURIComponent(slug)}/products`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return res.json();
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug || '');

  const data = await getData(decoded);
  if (!data?.success) {
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

  const category = data.category;
  const products = Array.isArray(data.products) ? data.products : [];

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