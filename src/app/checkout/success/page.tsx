'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function OrderSuccessPage() {
  const router = useRouter();
  
  // ถ้าผู้ใช้รีเฟรชหน้านี้หรือเข้ามาโดยตรง ให้เปลี่ยนเส้นทางไปยังหน้าหลัก
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (document.referrer.includes('checkout')) {
        // ถ้ามาจากหน้า checkout จะอยู่ในหน้านี้ได้
        return;
      }
      
      router.push('/');
    }, 0);
    
    return () => clearTimeout(timeout);
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 md:p-10 rounded-lg shadow-md text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">ขอบคุณสำหรับการสั่งซื้อ!</h1>
          <p className="text-lg text-gray-600 mb-6">
            คำสั่งซื้อของคุณได้รับการยืนยันเรียบร้อยแล้ว
          </p>
          
          <div className="bg-gray-50 p-4 rounded-md mb-8 max-w-md mx-auto text-left">
            <h2 className="text-lg font-medium text-gray-900 mb-2">รายละเอียดการสั่งซื้อ</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">หมายเลขคำสั่งซื้อ:</span> #TH-123456789</p>
              <p><span className="font-medium">วันที่สั่งซื้อ:</span> {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><span className="font-medium">วิธีการชำระเงิน:</span> โอนเงินผ่านธนาคาร</p>
              <p><span className="font-medium">สถานะการชำระเงิน:</span> <span className="text-green-600">ชำระเงินแล้ว</span></p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-8">
            เราได้ส่งอีเมลยืนยันการสั่งซื้อไปยังอีเมลของคุณแล้ว หากมีข้อสงสัยหรือต้องการข้อมูลเพิ่มเติม 
            กรุณาติดต่อฝ่ายบริการลูกค้าของเราที่ <a href="mailto:support@aquaroom.com" className="text-indigo-600 underline">support@aquaroom.com</a>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
              >
                กลับไปยังหน้าหลัก
              </motion.button>
            </Link>
            <Link href="/products">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
              >
                เลือกซื้อสินค้าเพิ่มเติม
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}