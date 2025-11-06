'use client';

import ProductCard, { ProductCardProps } from './ProductCard';

export interface ProductGridProps {
  products: ProductCardProps[];
}

export default function ProductGrid({ products }: { products: any[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} {...p} />
      ))}
    </div>
  );
}
