'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import Link from 'next/link';
import Image from 'next/image';
import { toAbsoluteUrl } from '@/lib/db';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  image_url?: string;
}

interface OrderTracking {
  id: number;
  order_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  tracking_number: string | null;
  shipping_company: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  delivery_steps: DeliveryStep[];
}

interface DeliveryStep {
  step: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
}

export default function OrderTrackingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchOrderTracking = useCallback(async () => {
    try {
      setLoading(true);

      const orderNo = encodeURIComponent(String(params.orderNumber ?? '').trim());
      if (!orderNo) throw new Error('ไม่พบหมายเลขคำสั่งซื้อ');

      const res = await fetch(`/api/orders/track/${encodeURIComponent(orderNo)}`, { cache: 'no-store', headers: { Accept: 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')||''}` }});
      const data = await res.json();
      const order = data?.order ?? data?.data?.order ?? null;
      const displayOrderNo = order?.order_number ?? order?.orderNumber ?? data?.orderNumber;
      // ใช้ order เพื่อตัดสินใจแสดงผล แทนที่จะสรุปว่าไม่พบเสมอ
      setOrder(order);
      
    } catch (error) {
      console.error('Error fetching order tracking:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลการติดตามคำสั่งซื้อได้',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      }).then(() => {
        router.push('/orders/tracking');
      });
    } finally {
      setLoading(false);
    }
  }, [params.orderNumber, router]);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (params?.orderNumber && isAuthenticated) {
      fetchOrderTracking();
    }
  }, [isLoading, isAuthenticated, params, router, fetchOrderTracking]);
  
  // ฟังก์ชันแปลงสถานะเป็นภาษาไทย
  const translateStatus = (status: string, type: 'payment' | 'order') => {
    if (type === 'payment') {
      switch (status) {
        case 'pending': return 'รอการชำระเงิน';
        case 'paid': return 'ชำระเงินแล้ว';
        case 'failed': return 'การชำระเงินล้มเหลว';
        case 'refunded': return 'คืนเงินแล้ว';
        default: return status;
      }
    } else {
      switch (status) {
        case 'processing': return 'กำลังดำเนินการ';
        case 'confirmed': return 'ยืนยันคำสั่งซื้อแล้ว';
        case 'shipped': return 'จัดส่งแล้ว';
        case 'delivered': return 'ได้รับสินค้าแล้ว';
        case 'cancelled': return 'ยกเลิกแล้ว';
        default: return status;
      }
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">ไม่พบข้อมูลคำสั่งซื้อ</h2>
          <p className="mt-2 text-gray-500">หมายเลขคำสั่งซื้อไม่ถูกต้องหรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้</p>
          <Link href="/orders/tracking" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
            กลับไปหน้าติดตามคำสั่งซื้อ
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/orders/tracking" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            กลับไปหน้าติดตามคำสั่งซื้อ
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">คำสั่งซื้อ #{order.order_number}</h1>
              <div className="flex space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                  order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {translateStatus(order.payment_status, 'payment')}
                </span>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.order_status === 'delivered' ? 'bg-green-100 text-green-800' : 
                  order.order_status === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                  order.order_status === 'confirmed' ? 'bg-indigo-100 text-indigo-800' : 
                  order.order_status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {translateStatus(order.order_status, 'order')}
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>วันที่สั่งซื้อ: {new Date(order.created_at).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p>วิธีการชำระเงิน: {
                order.payment_method === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' :
                order.payment_method === 'credit_card' ? 'บัตรเครดิต/เดบิต' :
                order.payment_method === 'cod' ? 'เก็บเงินปลายทาง' : order.payment_method
              }</p>
              {order.tracking_number && (
                <p>หมายเลขพัสดุ: {order.tracking_number} ({order.shipping_company || 'ไม่ระบุบริษัทขนส่ง'})</p>
              )}
              {order.estimated_delivery && (
                <p>วันที่คาดว่าจะได้รับ: {new Date(order.estimated_delivery).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">สถานะการจัดส่ง</h2>
            
            <div className="relative">
              {/* เส้นแสดงความคืบหน้า */}
              <div className="absolute left-3.5 top-0 h-full w-0.5 bg-gray-200"></div>
              
              <ul className="space-y-6 relative">
                {order.delivery_steps && order.delivery_steps.map((step) => (
                  <li key={step.step} className="relative pl-10">
                    {/* จุดแสดงสถานะ */}
                    <div className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center ${
                      step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'current' ? 'bg-blue-500' : 'bg-gray-200'
                    }`}>
                      {step.status === 'completed' ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                      ) : (
                        <div className={`w-3 h-3 rounded-full ${
                          step.status === 'current' ? 'bg-white' : 'bg-gray-400'
                        }`}></div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className={`text-base font-medium ${
                        step.status === 'completed' ? 'text-green-700' :
                        step.status === 'current' ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500">{step.description}</p>
                      {step.date && (
                        <p className="text-xs text-gray-400 mt-1">{step.date}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">รายการสินค้า</h2>
            
            <ul className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <li key={item.id} className="py-4 flex">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative">
                    {item.image_url ? (
                      <Image 
                        src={toAbsoluteUrl(item.image_url)} 
                        alt={item.product_name} 
                        fill 
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gray-400">ไม่มีรูปภาพ</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1 flex justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-800">{item.product_name}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {item.quantity} x {item.price.toLocaleString()} บาท
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.total.toLocaleString()} บาท
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>ยอดรวมทั้งสิ้น</p>
              <p>{order.total_amount.toLocaleString()} บาท</p>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Link 
                href="/profile/orders" 
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                ดูประวัติการสั่งซื้อทั้งหมด
              </Link>
              <Link 
                href="/"
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                กลับไปหน้าหลัก
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}