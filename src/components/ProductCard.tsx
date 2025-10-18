'use client';

import Link from 'next/link';
import Image from 'next/image';
import { toAbsoluteUrl } from '@/lib/db';

function isSupabasePublic(url?: string | null) {
  if (!url) return false;
  try {
    const u = new URL(decodeURIComponent(url));
    return u.hostname.endsWith('.supabase.co') && u.pathname.startsWith('/storage/v1/object/public/');
  } catch {
    return false;
  }
}

export interface ProductCardProps {
  id: number | string;
  name: string;
  price: number;
  imageUrl?: string | null;
  category?: string;
  stock?: number;
}

export default function ProductCard({ id, name, price, imageUrl, category = '', stock }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/product/${id}`} className="block group">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {imageUrl ? (
            <Image
              src={toAbsoluteUrl(imageUrl) || '/placeholder.png'}
              alt={name}
              fill
              unoptimized={isSupabasePublic(imageUrl)}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
              <span className="text-xs sm:text-sm text-gray-500">ไม่มีรูปภาพ</span>
            </div>
          )}

          {category ? (
            <div className="absolute top-2 right-2">
              <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                {category}
              </span>
            </div>
          ) : null}
        </div>

        <div className="p-3 sm:p-4">
          <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-tight mb-2">
            {name}
          </h3>

          <p className="text-base sm:text-lg lg:text-xl font-bold text-indigo-600 mb-2">
            ฿{Number(price || 0).toLocaleString()}
          </p>

          <div className="mb-3 sm:mb-4">
            {typeof stock === 'number' ? (
              stock > 0 ? (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${stock > 10 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                >
                  {stock > 10 ? 'มีสินค้า' : `เหลือ ${stock} ชิ้น`}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">สินค้าหมด</span>
              )
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <button className="w-full sm:w-auto text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm font-medium flex items-center justify-center sm:justify-start">
              ดูรายละเอียด
              <svg className="ml-1 h-3 w-3 sm:h-4 sm:w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="hidden sm:block bg-indigo-100 p-2 rounded-full text-indigo-600 hover:bg-indigo-200 transition-colors duration-200" disabled={typeof stock === 'number' ? stock <= 0 : false}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
