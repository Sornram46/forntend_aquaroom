'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
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

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isLoading, isAuthenticated, router]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
      }
      
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
    } finally {
      setLoading(false);
    }
  };
  
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
  
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">คำสั่งซื้อของฉัน</h1>
          <p className="mt-2 text-sm text-gray-500">รายการคำสั่งซื้อและสถานะการจัดส่ง</p>
        </div>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">ยังไม่มีคำสั่งซื้อ</h3>
            <p className="mt-1 text-base text-gray-500">คุณยังไม่ได้สั่งซื้อสินค้าใด ๆ</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              เลือกซื้อสินค้า
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">คำสั่งซื้อ #{order.order_number}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
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
                
                <div className="px-6 py-4">
                  <ul className="divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <li key={item.id} className="py-4 flex">
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative">
                          {item.image_url && (
                            <Image
                              src={toAbsoluteUrl(item.image_url)}
                              alt={item.product_name}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
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
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>ยอดรวมทั้งสิ้น</p>
                    <p>{order.total_amount.toLocaleString()} บาท</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    วิธีการชำระเงิน: {
                      order.payment_method === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' :
                      order.payment_method === 'credit_card' ? 'บัตรเครดิต/เดบิต' :
                      order.payment_method === 'cod' ? 'เก็บเงินปลายทาง' : order.payment_method
                    }
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push(`/profile/orders/${order.id}`)}
                      className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      ดูรายละเอียดเพิ่มเติม
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}