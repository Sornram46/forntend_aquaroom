import Link from 'next/link';
import Image from 'next/image';
import { fetchCategories, toAbsoluteUrl } from '@/lib/db';

interface Category {
  id: number;
  name: string;
  image_url_cate?: string;
  is_active: boolean;
  products_count?: number;
}

export default async function CategoriesSection() {
  const categories: Category[] = await fetchCategories();
  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 scroll-fade">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 scroll-slide-up scroll-stagger-1">
            หมวดหมู่<span className="text-indigo-600">สินค้า</span>
          </h2>
          <div className="w-24 h-1 bg-indigo-600 mx-auto mb-4 sm:mb-6 scroll-scale scroll-stagger-2"></div>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto scroll-fade scroll-stagger-3">
            เลือกซื้อสินค้าตามหมวดหมู่ที่คุณสนใจ
          </p>
        </div>

        {/* Categories Grid - Mobile: 2 columns, Desktop: 4 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/products`}
              className="group block scroll-scale"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                {/* Category Image */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={toAbsoluteUrl(category.image_url_cate) || 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&auto=format&fit=crop'}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:from-black/70 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-1 group-hover:text-yellow-300 transition-colors duration-300">
                        {category.name}
                      </h3>
                      
                      {/* Products Count - ซ่อนใน Mobile */}
                      {category.products_count && (
                        <p className="hidden sm:block text-white/80 text-xs sm:text-sm">
                          {category.products_count} สินค้า
                        </p>
                      )}
                      
                      {/* View Icon */}
                      <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-300">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Category Info - แสดงข้อมูลเพิ่มเติมสำหรับ Tablet และ Desktop */}
                <div className="hidden sm:block p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg group-hover:text-indigo-600 transition-colors duration-300">
                        {category.name}
                      </h3>
                      {category.products_count && (
                        <p className="text-gray-600 text-xs sm:text-sm mt-1">
                          {category.products_count} สินค้า
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300">
                      <span className="text-xs sm:text-sm font-medium mr-1">ดู</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Categories Button */}
        <div className="text-center mt-8 sm:mt-12 lg:mt-16 scroll-slide-up">
          <Link 
            href="/products"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 hover:scale-105 text-sm sm:text-base"
          >
            ดูหมวดหมู่ทั้งหมด
            <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
