'use client';

import ProductCard, { ProductCardProps } from './ProductCard';

export interface ProductGridProps {
  products: ProductCardProps[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">ไม่มีสินค้าที่จะแสดง</div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {products.map((p) => (
        <ProductCard key={`${p.id}`} {...p} />
      ))}
    </div>
  );
}
