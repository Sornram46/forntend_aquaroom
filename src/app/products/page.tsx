'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

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
  const [categories, setCategories] = useState<string[]>([]);

  // โหลดข้อมูลสินค้า
  useEffect(() => {
    async function fetchProducts() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/products', {
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        console.log('Products loaded:', data.length);
        setProducts(data);
        setFilteredProducts(data);
        
        const uniqueCategories: string[] = Array.from(
          new Set(data.filter((p: Product) => p.category).map((p: Product) => p.category))
        );
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    }
    
    fetchProducts();
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
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
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
          // สถานะกำลังโหลด - Mobile: 2 columns, Tablet: 3 columns, Desktop: 4 columns
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-3 sm:p-4 shadow-md animate-pulse">
                <div className="w-full aspect-square bg-gray-200 rounded-md mb-3 sm:mb-4"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 sm:h-6 bg-gray-200 rounded w-1/3 mt-3 sm:mt-4"></div>
              </div>
            ))}
          </div>
        ) : (
          // แสดงสินค้า - Mobile: 2 columns, Tablet: 3 columns, Desktop: 4 columns
          <AnimatePresence>
            {filteredProducts.length > 0 ? (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <Link href={`/product/${product.id}`} className="block group">
                      <div className="relative aspect-square bg-gray-100">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
                            <span className="text-xs sm:text-sm text-gray-500">ไม่มีรูปภาพ</span>
                          </div>
                        )}
                        
                        {/* Category Badge */}
                        <div className="absolute top-2 right-2">
                          <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                            {product.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 sm:p-4">
                        {/* Product Name */}
                        <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight mb-2">
                          {product.name}
                        </h3>
                        
                        {/* Price */}
                        <p className="text-base sm:text-lg lg:text-xl font-bold text-indigo-600 mb-2">
                          ฿{product.price.toLocaleString()}
                        </p>
                        
                        {/* Stock Status */}
                        <div className="mb-3 sm:mb-4">
                          {product.stock > 0 ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              product.stock > 10 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {product.stock > 10 ? 'มีสินค้า' : `เหลือ ${product.stock} ชิ้น`}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                              สินค้าหมด
                            </span>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          {/* View Details Button - Full width on mobile */}
                          <button className="w-full sm:w-auto text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm font-medium flex items-center justify-center sm:justify-start">
                            ดูรายละเอียด
                            <svg className="ml-1 h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          
                          {/* Add to Cart Button - Hidden on mobile, shown on tablet+ */}
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="hidden sm:block bg-indigo-100 p-2 rounded-full text-indigo-600 hover:bg-indigo-200 transition-colors duration-200"
                            disabled={product.stock <= 0}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </motion.button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              // No Products Found
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    ล้างตัวกรองทั้งหมด
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}