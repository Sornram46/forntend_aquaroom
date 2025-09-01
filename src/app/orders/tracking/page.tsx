'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function OrdersTrackingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [orderNumber, setOrderNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);
  
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      Swal.fire({
        title: 'กรุณาระบุหมายเลขคำสั่งซื้อ',
        icon: 'warning',
        confirmButtonText: 'ตกลง',
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      // เรียกตรงไปที่หน้า tracking detail เลย
      // แทนที่จะเรียก API เพื่อตรวจสอบก่อน
      router.push(`/orders/tracking/${orderNumber.trim()}`);
      
      /* 
      // วิธีเดิม - เรียก API เพื่อตรวจสอบก่อน
      const response = await fetch(`/api/orders/track?orderNumber=${orderNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('ไม่พบข้อมูลคำสั่งซื้อ');
      }
      
      // ถ้าพบคำสั่งซื้อ ให้นำทางไปยังหน้ารายละเอียด
      router.push(`/orders/tracking/${orderNumber}`);
      */
      
    } catch (error) {
      console.error('Error tracking order:', error);
      Swal.fire({
        title: 'ไม่พบคำสั่งซื้อ',
        text: 'กรุณาตรวจสอบหมายเลขคำสั่งซื้อให้ถูกต้อง',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">ติดตามสถานะคำสั่งซื้อ</h1>
            <p className="text-gray-600 mb-6">กรอกหมายเลขคำสั่งซื้อเพื่อติดตามสถานะการจัดส่งสินค้าของคุณ</p>
            
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="กรอกหมายเลขคำสั่งซื้อ (เช่น OR230001234)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                  {isSearching ? (
                    <span className="flex items-center justify-center">
                      <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                      กำลังค้นหา...
                    </span>
                  ) : (
                    'ติดตามสถานะ'
                  )}
                </button>
              </div>
            </form>
            
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">ไม่ทราบหมายเลขคำสั่งซื้อ?</h2>
              <p className="text-gray-600 mb-4">คุณสามารถดูรายการคำสั่งซื้อทั้งหมดได้ในหน้าประวัติการสั่งซื้อของคุณ</p>
              <Link
                href="/profile/orders"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <span>ดูประวัติการสั่งซื้อ</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}