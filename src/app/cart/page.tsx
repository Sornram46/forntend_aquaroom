'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';
import Swal from 'sweetalert2';

export default function CartPage() {
  const router = useRouter();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal, 
    clearCart,
    // เพิ่มคูปองจาก context
    appliedCoupon,
    discount,
    applyCoupon: applyCartCoupon,
    removeCoupon
  } = useCart();
  
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCheckingAddress, setIsCheckingAddress] = useState(false);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  
  // เพิ่ม: เก็บ stock ของแต่ละสินค้า
  const [productsStock, setProductsStock] = useState<Record<number, number>>({});

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  // ดึง stock ของสินค้าทั้งหมดในตะกร้า
  useEffect(() => {
    const fetchProductsStock = async () => {
      if (cartItems.length === 0) return;
      
      try {
        const stockData: Record<number, number> = {};
        
        await Promise.all(
          cartItems.map(async (item) => {
            try {
              const response = await fetch(`/api/products/${item.id}`);
              if (response.ok) {
                const product = await response.json();
                stockData[item.id] = product.stock || 0;
              }
            } catch (err) {
              console.error(`Error fetching stock for product ${item.id}:`, err);
            }
          })
        );
        
        setProductsStock(stockData);
      } catch (error) {
        console.error('Error fetching products stock:', error);
      }
    };
    
    fetchProductsStock();
  }, [cartItems.length]); // รันเมื่อจำนวน item เปลี่ยน

  const subtotal = getCartTotal();
  const total = subtotal - discount + Number(shippingCost ?? 0);

  // ฟังก์ชันคำนวณค่าจัดส่ง
  const calculateShipping = useCallback(async () => {
  if (cartItems.length === 0) {
    setShippingCost(0);
    return;
  }

   setIsCalculatingShipping(true);
  try {
    // ✅ จัดกลุ่ม items ตาม product id + รวม quantity
    const groupedItems = cartItems.reduce((acc, item) => {
      const existing = acc.find(i => i.id === item.id);
      if (existing) {
        // รวม quantity ของสินค้าเดียวกัน
        existing.quantity += item.quantity;
      } else {
        // เพิ่ม item ใหม่
        acc.push({ ...item });
      }
      return acc;
    }, [] as typeof cartItems);

    console.log('🔵 Original items:', cartItems.length);
    console.log('🟢 Grouped items:', groupedItems.length);
    console.log('📦 Items detail:', groupedItems.map(i => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity
    })));

    const response = await fetch('/api/calculate-shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
      body: JSON.stringify({
        items: groupedItems, // ✅ ส่ง items ที่รวมแล้ว
        subtotal: subtotal
      })
    });

    console.log('📥 Response status:', response.status);
    const data = await response.json();
    console.log('📥 Response data:', data);

    if (response.ok && data?.success) {
      const calculatedCost = data.shippingCost ?? data.data?.totalShippingCost ?? 0;
      console.log('✅ Final shipping cost:', calculatedCost);
      setShippingCost(Number(calculatedCost));
    } else {
      console.warn('⚠️ API failed, using fallback');
      const special = groupedItems.some((it) => {
        const name = String(it.name ?? '').toLowerCase();
        const cat = String(it.category ?? '').toLowerCase();
        const flag = (it as any).specialShipping ?? (it as any).special_shipping ?? false;
        return flag || name.includes('ปลากัด') || name.includes('betta') || cat.includes('ปลากัด') || cat.includes('betta');
      });
      setShippingCost(special ? 150 : 50);
    }
  } catch (error) {
    console.error('❌ Error calculating shipping:', error);
    const special = cartItems.some((it) => {
      const name = String(it.name ?? '').toLowerCase();
      const cat = String(it.category ?? '').toLowerCase();
      const flag = (it as any).specialShipping ?? (it as any).special_shipping ?? false;
      return flag || name.includes('ปลากัด') || name.includes('betta') || cat.includes('ปลากัด') || cat.includes('betta');
    });
    setShippingCost(special ? 150 : 50);
  } finally {
    setIsCalculatingShipping(false);
  }
}, [cartItems, subtotal]);


  useEffect(() => {
    calculateShipping();
  }, [calculateShipping]);

  // แก้ไขฟังก์ชัน applyCoupon ให้ debug ดีขึ้น
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      console.log('🎫 Applying coupon:', couponCode);
      console.log('🎫 Order total:', subtotal);
      
      // ทดสอบ API ก่อนด้วย HEAD (หลีกเลี่ยง GET 400 เมื่อไม่มี code)
      const testResponse = await fetch('/api/coupons/validate', { method: 'HEAD' });
      console.log('🎫 API test response (HEAD):', testResponse.status);
      if (!testResponse.ok) throw new Error('API endpoint not available');
      
      // เรียกใช้ API ตรวจสอบคูปอง
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: couponCode,
          order_total: subtotal,
          items: cartItems,
          email: user?.email || null
        })
      });

      console.log('🎫 Response status:', response.status);
      console.log('🎫 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎫 Error response text:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          // prefer message -> error for better UX
          throw new Error(errorJson.message || errorJson.error || `Server error: ${response.status}`);
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
      }

      const result = await response.json();
      console.log('🎫 API Result:', result);

      if (result.success) {
        // ใช้ context function
        applyCartCoupon(result.data.code, result.data.discount_amount);
        
        Swal.fire({
          title: 'ใช้คูปองสำเร็จ',
          text: result.data.message,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        throw new Error(result.error || 'คูปองไม่ถูกต้องหรือหมดอายุ');
      }

    } catch (error) {
      console.error('❌ Error applying coupon:', error);
      
      // แสดง error ที่เกิดขึ้น
      let errorMessage = 'คูปองไม่ถูกต้องหรือหมดอายุ';
      
      if (error instanceof Error) {
        if (error.message.includes('API endpoint not available')) {
          errorMessage = 'ระบบคูปองไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง';
        } else if (error.message.includes('Server error')) {
          errorMessage = 'เซิร์ฟเวอร์ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง';
        } else {
          errorMessage = error.message;
        }
      }
      
      Swal.fire({
        title: 'ไม่สามารถใช้คูปองได้',
        text: errorMessage,
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
      });
    }

    setCouponCode('');
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Swal.fire({
        title: 'ตะกร้าว่าง',
        text: 'กรุณาเพิ่มสินค้าลงตะกร้าก่อนดำเนินการชำระเงิน',
        icon: 'warning',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#4F46E5',
      });
      return;
    }

    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }

    setIsCheckingAddress(true);

    try {
      const response = await fetch('/api/user/addresses/check', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'ไม่สามารถตรวจสอบที่อยู่จัดส่งได้');
      }

      if (!data.hasAddress) {
        Swal.fire({
          title: 'ยังไม่มีที่อยู่จัดส่ง',
          text: 'กรุณาเพิ่มที่อยู่จัดส่งก่อนดำเนินการชำระเงิน',
          icon: 'info',
          confirmButtonText: 'เพิ่มที่อยู่จัดส่ง',
          confirmButtonColor: '#4F46E5',
          showCancelButton: true,
          cancelButtonText: 'ยกเลิก',
        }).then((result) => {
          if (result.isConfirmed) {
            router.push('/profile/address?redirect=checkout');
          }
        });
        return;
      }

      proceedToPayment();

    } catch (error) {
      console.error('Error checking address:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถตรวจสอบที่อยู่จัดส่งได้ กรุณาลองอีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#4F46E5',
      });
    } finally {
      setIsCheckingAddress(false);
    }
  };

  const proceedToPayment = () => {
    Swal.fire({
      title: 'กำลังดำเนินการ',
      text: 'โปรดรอสักครู่...',
      allowOutsideClick: false,
      didOpen: () => {
        const btn = Swal.getConfirmButton(); // HTMLButtonElement | null
        if (btn) {
          Swal.showLoading(btn);
        } else {
          // fallback สำหรับบางเวอร์ชันให้ build ผ่าน
          Swal.showLoading();
        }
      },
      // อย่าปิดปุ่มก่อน showLoading กับปุ่ม (ให้ใช้ค่า default = แสดงปุ่ม)
      // showConfirmButton: true,
    });

    setTimeout(() => {
      router.push('/checkout/payment');
      Swal.fire({
        title: 'สำเร็จ!',
        text: 'ดำเนินการชำระเงินเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonColor: '#4F46E5',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true
      })
    }, 1500);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ตะกร้าสินค้า</h1>
          <p className="mt-2 text-sm text-gray-500">
            {cartItems.length === 0 && !loading 
              ? 'ตะกร้าสินค้าของคุณว่างเปล่า' 
              : `${cartItems.length} รายการในตะกร้า`}
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="animate-pulse space-y-6">
                <div className="h-7 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="grid grid-cols-6 gap-4">
                      <div className="h-24 bg-gray-200 rounded col-span-1"></div>
                      <div className="col-span-5 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16 bg-white rounded-lg shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-gray-800">ตะกร้าสินค้าของคุณว่างเปล่า</h2>
            <p className="mt-2 text-sm text-gray-500">ดูเหมือนว่าคุณยังไม่ได้เพิ่มสินค้าใดๆ ลงในตะกร้า</p>
            <div className="mt-6">
              <Link href="/products" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                เลือกซื้อสินค้าต่อ
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.li 
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 sm:p-6"
                      >
                        <div className="flex flex-col sm:flex-row">
                          <div className="flex-shrink-0 relative w-full sm:w-24 h-24 mb-4 sm:mb-0 bg-gray-100 rounded-md overflow-hidden">
                            {item.imageUrl ? (
                              <Image 
                                src={item.imageUrl} 
                                alt={item.name} 
                                fill 
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-gray-400">ไม่มีรูปภาพ</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 sm:ml-6">
                            <div className="flex justify-between">
                              <div>
                                <h3 className="text-base font-medium text-gray-800">
                                  <Link href={`/product/${item.id}`} className="hover:text-indigo-600">
                                    {item.name}
                                  </Link>
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                              </div>
                              <p className="text-base font-medium text-gray-800">
                                {(item.price * item.quantity).toLocaleString()} บาท
                              </p>
                            </div>
                            
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center border border-gray-300 rounded">
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </button>
                                <span className="px-4 py-1 text-gray-800">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={item.quantity >= (productsStock[item.id] || 0)}
                                  title={item.quantity >= (productsStock[item.id] || 0) ? `สินค้าเหลือแค่ ${productsStock[item.id] || 0} ชิ้น` : ''}
                                >
                                  +
                                </button>
                              </div>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-sm text-red-500 hover:text-red-700 flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                ลบ
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-between mb-4">
                    <Link 
                      href="/products" 
                      className="flex items-center text-indigo-600 hover:text-indigo-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      กลับไปเลือกซื้อสินค้าเพิ่มเติม
                    </Link>
                    
                    <button 
                      onClick={clearCart}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      ล้างตะกร้า
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">สรุปคำสั่งซื้อ</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ยอดรวม ({cartItems.length} รายการ)</span>
                      <span className="text-gray-800 font-medium">{subtotal.toLocaleString()} บาท</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">ค่าจัดส่ง</span>
                      <span className="text-gray-800 font-medium">
                        {isCalculatingShipping
                          ? 'กำลังคำนวณ...'
                          : Number(shippingCost ?? 0) === 0
                            ? 'ฟรี'
                            : `${Number(shippingCost ?? 0).toLocaleString()} บาท`}
                      </span>
                    </div>
                    
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <div className="flex items-center">
                          <span>ส่วนลด ({appliedCoupon})</span>
                          <button 
                            onClick={removeCoupon} 
                            className="ml-2 text-xs text-red-500 hover:text-red-700"
                          >
                            ยกเลิก
                          </button>
                        </div>
                        <span>-{discount.toLocaleString()} บาท</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-4 flex justify-between">
                      <span className="text-lg font-semibold text-gray-800">ยอดรวมทั้งสิ้น</span>
                      <span className="text-xl font-bold text-indigo-600">{total.toLocaleString()} บาท</span>
                    </div>
                  </div>
                  
                  {!appliedCoupon && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <p className="text-sm text-gray-600 mb-2">มีรหัสคูปอง?</p>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="รหัสคูปอง"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={applyCoupon}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          ใช้คูปอง
                        </motion.button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCheckout}
                      disabled={isCheckingAddress}
                      className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center"
                    >
                      {isCheckingAddress ? (
                        <>
                          <div className="mr-2 h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin" />
                          <span>กำลังตรวจสอบ...</span>
                        </>
                      ) : (
                        <>
                          <span className="mr-2">ดำเนินการชำระเงิน</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </>
                      )}
                    </motion.button>
                    
                    <div className="mt-4 text-sm text-gray-500 text-center">
                      <p>เรารับชำระเงินด้วยวิธีการต่างๆ</p>
                      <div className="flex justify-center space-x-2 mt-2">
                        <svg className="h-8 w-8 text-gray-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                        </svg>
                        <svg className="h-8 w-8 text-gray-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2zm-1 14H5c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v9c0 .55-.45 1-1 1z" />
                        </svg>
                        <svg className="h-8 w-8 text-gray-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                          <path d="M4 6h16v2H4zm0 6h16v2H4zm0 6h16v2H4z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6 bg-indigo-50 rounded-lg p-4 border border-indigo-100"
              >
                <h3 className="text-sm font-medium text-indigo-800 mb-2">ข้อมูลเพิ่มเติม</h3>
                <ul className="space-y-2 text-xs text-indigo-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    ฟรีค่าจัดส่งเมื่อซื้อสินค้าครบ 1,000 บาท
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    รับประกันความพึงพอใจหรือคืนเงิน 15 วัน (บางรายการ)
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    มีคำถาม? ติดต่อฝ่ายบริการลูกค้า 095-160-4051
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        redirectAfterLogin="/cart"
      />
    </div>
  );
}