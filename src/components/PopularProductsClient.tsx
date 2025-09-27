'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

type Product = {
  id: number | string;
  name: string;
  category?: string;
  price: number;
  imageUrl?: string;
};

export default function PopularProductsClient({ products }: { products: Product[] }) {
  const [loading, setLoading] = useState(true);
  const [hoveredProduct, setHoveredProduct] = useState<number | string | null>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center text-gray-800">
            สินค้ายอดนิยม
          </h2>
          <p className="text-center text-gray-500 mb-8">รวมสินค้าที่ลูกค้าชื่นชอบมากที่สุด</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-md animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-md mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-1/3 mt-4" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center text-gray-800">สินค้ายอดนิยม</h2>
          <p className="text-center text-gray-500 mb-8">รวมสินค้าที่ลูกค้าชื่นชอบมากที่สุด</p>
        </motion.div>

        <div ref={productsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products && products.length > 0 ? (
            products.map((product: Product, index: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                onHoverStart={() => setHoveredProduct(product.id)}
                onHoverEnd={() => setHoveredProduct(null)}
              >
                <Link href={`/product/${product.id}`} className="group block h-full">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col relative">
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          className="transform group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
                          <span className="text-gray-500">ไม่มีรูปภาพ</span>
                        </div>
                      )}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold rounded-full px-3 py-1 shadow-md">ยอดนิยม</div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">{product.name}</h3>
                      {product.category && (
                        <p className="text-gray-600 dark:text-gray-300 mb-2">{product.category}</p>
                      )}
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {Number(product.price).toLocaleString()} บาท
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-4 text-center py-12 text-gray-500">ไม่พบสินค้ายอดนิยมในขณะนี้</div>
          )}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-full shadow-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 hover:shadow-lg"
          >
            ดูสินค้าทั้งหมด
            <svg className="ml-2 -mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
