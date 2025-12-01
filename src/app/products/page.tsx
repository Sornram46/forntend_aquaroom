'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductGrid from '@/components/ProductGrid';

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
  stock: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // โหลดข้อมูลสินค้า
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const toAbs = (u?: string | null): string | null => {
          if (!u) return null;
          try {
            if (u.startsWith('http://') || u.startsWith('https://')) return u;
            // relative path from backend like /uploads/...
            const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend-aquaroom.vercel.app';
            return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
          } catch {
            return null;
          }
        };

        const pickImage = (p: any): string | null => {
          const arr = [
            p.imageUrl,
            p.image_url,
            Array.isArray(p.images) ? p.images[0] : undefined,
            Array.isArray(p.image_urls) ? p.image_urls[0] : undefined,
            p.thumbnail,
            p.cover,
            p.mainImage,
            p.photo,
          ].filter(Boolean);
          return toAbs(arr[0] as string | undefined) ?? null;
        };

        const mapped: Product[] = (Array.isArray(data) ? data : data?.items || []).map((p: any) => ({
          id: Number(p.id ?? p._id ?? p.productId ?? 0),
          name: String(p.name ?? p.title ?? ''),
          price: Number(p.price ?? p.unit_price ?? 0),
          imageUrl: pickImage(p),
          category: String(p.category ?? p.category_name ?? 'ทั่วไป'),
          stock: Number(p.stock ?? p.quantity ?? 0),
        }));
        

        const missing = mapped.filter(x => !x.imageUrl);
        if (missing.length) {
          console.warn('[Products] items with no imageUrl:', missing.length, missing.map(m => ({ id: m.id, name: m.name })));
        }

        setProducts(mapped);
        setFilteredProducts(mapped);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);


  useEffect(() => {
  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }
  fetchCategories();
}, []);

  // กรองสินค้าเมื่อค่าการค้นหาหรือหมวดหมู่เปลี่ยนแปลง
  useEffect(() => {
    let results = products;
    
    if (searchQuery) {
      results = results.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      results = results.filter(product => product.category === selectedCategory);
    }
    
    setFilteredProducts(results);
  }, [searchQuery, selectedCategory, products]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">สินค้าทั้งหมด</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">ค้นพบสินค้าคุณภาพดีจากทุกหมวดหมู่</p>
        </motion.div>
        
        {/* ส่วนค้นหาและกรอง */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white shadow-md rounded-lg p-3 sm:p-4 mb-6 sm:mb-8"
        >
          <div className="flex flex-col space-y-3 sm:space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            {/* ช่องค้นหา */}
            <div className="relative flex-1 md:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 pr-4 py-2 w-full text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* ตัวกรองหมวดหมู่ */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4">
              <label htmlFor="category-filter" className="text-xs sm:text-sm font-medium text-gray-700">
                หมวดหมู่:
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md py-2 pl-3 pr-8 text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
               <option value="all">ทั้งหมด</option>
{categories.map((cat) => (
  <option key={cat.id} value={cat.name}>
    {cat.name}
  </option>
))}
              </select>
            </div>
          </div>
        </motion.div>
        
        {/* แสดงจำนวนสินค้าที่พบ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-4 text-xs sm:text-sm text-gray-500"
        >
          พบ {filteredProducts.length} สินค้า
        </motion.div>
        
        {loading ? (
          // สถานะกำลังโหลด - Mobile: 2 cols, ≥sm: 4 cols, ≥lg: 6 cols
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-3 sm:p-4 shadow-md animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-md mb-3 sm:mb-4"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 sm:h-6 bg-gray-200 rounded w-1/3 mt-3 sm:mt-4"></div>
              </div>
            ))}
          </div>
        ) : (
          filteredProducts.length > 0 ? (
            <ProductGrid
              products={filteredProducts.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                imageUrl: p.imageUrl,
                category: p.category,
                stock: p.stock,
              }))}
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">ไม่พบสินค้า</h3>
              <p className="mt-1 text-gray-500">ลองค้นหาด้วยคำที่แตกต่างหรือล้างตัวกรอง</p>
              <div className="mt-6">
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}