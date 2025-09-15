'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import Image from 'next/image';
import { toAbsoluteUrl } from '@/lib/db';
import { validateSlipWithOCR, validateSlipQuick, SlipValidationResult } from '@/lib/slipValidator';

interface Address {
  id: number;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  district: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
}

// ปรับปรุง interface สำหรับ PaymentSettings
interface PaymentSettings {
  bank_transfer_enabled: boolean;
  credit_card_enabled: boolean;
  cod_enabled: boolean;
  cod_fee: number;
  cod_maximum: number;
  payment_timeout_hours: number;
  require_payment_proof: boolean;
  currency: string;
  payment_instructions?: string;
  bank_accounts: Array<{
    bank_name: string;
    account_name: string;
    account_number: string;
    bank_icon?: string | null;
    branch?: string | null;
  }>;
}

export default function PaymentPage() {
  const router = useRouter();
  const { 
    cartItems, 
    getCartTotal, 
    clearCart,
    // เพิ่มคูปองจาก context
    appliedCoupon,
    discount,
    removeCoupon
  } = useCart();
  const { user, isAuthenticated, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'credit_card' | 'cod'>('bank_transfer');
  const [isProcessing, setIsProcessing] = useState(false);

  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<'bank_transfer' | 'credit_card' | 'cod'>>([]);

  const subtotal = getCartTotal();
  const [shippingCost, setShippingCost] = useState(0);
  // แก้ไขการคำนวณยอดรวม
  const total = subtotal - discount + shippingCost;

  // เพิ่มในส่วน state
  const [isValidatingSlip, setIsValidatingSlip] = useState(false);
  const [slipValidationResult, setSlipValidationResult] = useState<SlipValidationResult | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (!isLoading && cartItems.length === 0) {
      router.push('/cart');
      return;
    }

    const fetchDefaultAddress = async () => {
      try {
        const response = await fetch('/api/user/addresses/default', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดที่อยู่จัดส่งได้');
        }

        const data = await response.json();

        if (!data.address) {
          router.push('/profile/address?redirect=checkout');
          return;
        }

        setShippingAddress(data.address);
      } catch (error) {
        console.error('Error fetching address:', error);
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโหลดที่อยู่จัดส่งได้',
          icon: 'error',
          confirmButtonText: 'ตกลง',
        });
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && isAuthenticated) {
      fetchDefaultAddress();
    }
  }, [isLoading, isAuthenticated, cartItems, router]);

  // เพิ่มการโหลดการตั้งค่าการชำระเงินจาก API
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        console.log('🔄 [DEBUG] Starting to fetch payment settings...');
        console.time('PaymentSettings Load Time');
        
        const response = await fetch('/api/payment-settings');
        console.log('📡 [DEBUG] Response status:', response.status);
        console.log('📡 [DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('📄 [DEBUG] Full response data:', JSON.stringify(data, null, 2));
        
        if (data.success) {
          console.log('✅ [DEBUG] Payment settings loaded successfully');
          console.log('🏦 [DEBUG] Bank accounts received:', data.data.bank_accounts);
          console.log('💰 [DEBUG] COD settings:', {
            enabled: data.data.cod_enabled,
            fee: data.data.cod_fee,
            maximum: data.data.cod_maximum
          });
          
          // ตรวจสอบ icon ของแต่ละธนาคาร
          if (data.data.bank_accounts && Array.isArray(data.data.bank_accounts)) {
            console.log(`🏦 [DEBUG] Found ${data.data.bank_accounts.length} bank accounts`);
            
            data.data.bank_accounts.forEach((account: any, index: number) => {
              console.log(`🏦 [DEBUG] Bank Account #${index + 1}:`, {
                bank_name: account.bank_name,
                account_name: account.account_name,
                account_number: account.account_number,
                bank_icon: account.bank_icon,
                icon_exists: !!account.bank_icon,
                icon_type: typeof account.bank_icon,
                branch: account.branch
              });
              
              // ตรวจสอบ URL ของ icon
              if (account.bank_icon) {
                console.log(`🖼️ [DEBUG] Bank ${account.bank_name} icon URL:`, account.bank_icon);
                
                // ทดสอบโหลด icon
                const img = new (window as any).Image();
                img.onload = () => {
                  console.log(`✅ [DEBUG] Icon loaded successfully for ${account.bank_name}`);
                };
                img.onerror = (error: Event) => {
                  console.error(`❌ [DEBUG] Failed to load icon for ${account.bank_name}:`, error);
                  console.error(`❌ [DEBUG] Icon URL that failed:`, account.bank_icon);
                };
                img.src = account.bank_icon;
              } else {
                console.warn(`⚠️ [DEBUG] No icon found for ${account.bank_name}`);
              }
            });
          } else {
            console.warn('⚠️ [DEBUG] No bank accounts found or invalid format');
          }
          
          setPaymentSettings(data.data);
          
          // กำหนดวิธีการชำระเงินที่ใช้ได้
          const methods: Array<'bank_transfer' | 'credit_card' | 'cod'> = [];
          if (data.data.bank_transfer_enabled) {
            methods.push('bank_transfer');
            console.log('✅ [DEBUG] Bank transfer enabled');
          }
          if (data.data.credit_card_enabled) {
            methods.push('credit_card');
            console.log('✅ [DEBUG] Credit card enabled');
          }
          if (data.data.cod_enabled) {
            methods.push('cod');
            console.log('✅ [DEBUG] COD enabled');
          }
          
          console.log('💳 [DEBUG] Available payment methods:', methods);
          setAvailablePaymentMethods(methods);
          
          // ตั้งค่า default payment method
          if (methods.length > 0) {
            setPaymentMethod(methods[0]);
            console.log('🎯 [DEBUG] Default payment method set to:', methods[0]);
          } else {
            console.error('❌ [DEBUG] No payment methods available!');
          }
          
          console.timeEnd('PaymentSettings Load Time');
          
        } else {
          console.error('❌ [DEBUG] Payment settings request failed:', data.message);
          throw new Error(data.message || 'Failed to load payment settings');
        }
        
      } catch (error) {
        console.error('❌ [DEBUG] Error in fetchPaymentSettings:', error);
        console.error('❌ [DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.timeEnd('PaymentSettings Load Time');
        
        // ตั้งค่า fallback
        console.log('🔄 [DEBUG] Setting fallback payment settings...');
        setPaymentSettings({
          bank_transfer_enabled: true,
          credit_card_enabled: false,
          cod_enabled: true,
          cod_fee: 30,
          cod_maximum: 0,
          payment_timeout_hours: 24,
          require_payment_proof: true,
          currency: 'THB',
          bank_accounts: []
        });
        setAvailablePaymentMethods(['bank_transfer', 'cod']);
        setPaymentMethod('bank_transfer');
      }
    };

    // เพิ่ม delay เล็กน้อยเพื่อให้ component mount เสร็จ
    console.log('🚀 [DEBUG] PaymentPage component mounted');
    setTimeout(() => {
      fetchPaymentSettings();
    }, 100);
    
  }, []);

  // เพิ่ม debug สำหรับ state changes
  useEffect(() => {
    console.log('🔄 [DEBUG] Payment method changed to:', paymentMethod);
  }, [paymentMethod]);

  useEffect(() => {
    console.log('🔄 [DEBUG] Payment settings state updated:', paymentSettings);
  }, [paymentSettings]);

  useEffect(() => {
    console.log('🔄 [DEBUG] Available payment methods updated:', availablePaymentMethods);
  }, [availablePaymentMethods]);


  const validateSlip = async (file: File): Promise<{isValid: boolean, message: string}> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/validate-slip', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success && result.isSlip) {
      return {
        isValid: true,
        message: `ตรวจสอบแล้ว: เป็นสลิปโอนเงิน (ความมั่นใจ ${result.confidence.toFixed(1)}%)`
      };
    } else {
      return {
        isValid: false,
        message: 'รูปภาพนี้อาจไม่ใช่สลิปโอนเงิน กรุณาตรวจสอบอีกครั้ง'
      };
    }
  } catch (error) {
    return {
      isValid: true, // ให้ผ่านไปก่อนถ้าตรวจสอบไม่ได้
      message: 'ไม่สามารถตรวจสอบได้ จะดำเนินการต่อ'
    };
  }
};

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📸 [DEBUG] File change triggered');
    setValidationError(null);
    setSlipValidationResult(null);
    
    const file = e.target.files?.[0] || null;

    if (!file) {
      console.log('📸 [DEBUG] No file selected');
      setPaymentProof(null);
      setPaymentProofPreview(null);
      return;
    }

    console.log('📸 [DEBUG] File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // ตรวจสอบขนาดไฟล์
    if (file.size > 5 * 1024 * 1024) {
      console.log('📸 [DEBUG] File too large:', file.size);
      setValidationError('ไฟล์ต้องมีขนาดไม่เกิน 5MB');
      e.target.value = '';
      return;
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      console.log('📸 [DEBUG] Invalid file type:', file.type);
      setValidationError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
      e.target.value = '';
      return;
    }

    console.log('📸 [DEBUG] File validation passed, reading file...');
    setPaymentProof(file);

    // แสดงรูปภาพก่อน
    const reader = new FileReader();
    reader.onloadend = async () => {
      console.log('📸 [DEBUG] File read completed');
      const result = reader.result as string;
      setPaymentProofPreview(result);
      
      // เริ่มตรวจสอบสลิป
      setIsValidatingSlip(true);
      setValidationError('กำลังตรวจสอบความถูกต้องของสลิป...');
      
      try {
        // ใช้การตรวจสอบแบบเร็วก่อน
        const quickCheck = validateSlipQuick(file);
        console.log('🚀 Quick validation result:', quickCheck);
        
        if (quickCheck.confidence >= 70) {
          // ถ้าผ่านการตรวจสอบเร็วด้วยคะแนนสูง ไม่ต้อง OCR
          setSlipValidationResult(quickCheck);
          setValidationError(null);
          setIsValidatingSlip(false);
          
          // แสดง toast สำเร็จ
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          
          Toast.fire({
            icon: 'success',
            title: quickCheck.message
          });
          
          return;
        }
        
        // ถ้าไม่ผ่านการตรวจสอบเร็ว ใช้ OCR
        console.log('🔍 Starting OCR validation...');
        const ocrResult = await validateSlipWithOCR(file);
        console.log('📖 OCR validation result:', ocrResult);
        
        setSlipValidationResult(ocrResult);
        setValidationError(null);
        
        // แสดงผลลัพธ์
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
        });
        
        Toast.fire({
          icon: ocrResult.isValid ? 'success' : 'warning',
          title: ocrResult.message
        });
        
      } catch (error) {
        console.error('❌ Error validating slip:', error);
        setValidationError('ไม่สามารถตรวจสอบได้ จะดำเนินการต่อ');
        setSlipValidationResult({
          isValid: true,
          confidence: 0,
          message: 'ไม่สามารถตรวจสอบได้'
        });
      } finally {
        setIsValidatingSlip(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('📸 [DEBUG] Error reading file:', error);
      setValidationError('ไม่สามารถอ่านไฟล์ได้ กรุณาลองอีกครั้ง');
      setIsValidatingSlip(false);
    };
    
    reader.readAsDataURL(file);
  };
  const handlePayment = async () => {
    if (paymentMethod === 'bank_transfer' && !paymentProof) {
      setValidationError('กรุณาแนบหลักฐานการโอนเงิน');
      document.getElementById('payment-proof-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // ตรวจสอบข้อมูลสินค้าในตะกร้าก่อนส่งไปยัง API
    const validCartItems = cartItems.filter(item => item.id !== undefined && item.id !== null);
    
    if (validCartItems.length !== cartItems.length) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'พบข้อมูลสินค้าในตะกร้ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    // แปลง id ให้เป็นตัวเลขเสมอ เพื่อให้ตรงกับรูปแบบในฐานข้อมูล
    const normalizedCartItems = validCartItems.map(item => ({
      ...item,
      id: Number(item.id),
    }));

    setIsProcessing(true);

    try {
      let paymentProofUrl = null;

      // อัปโหลดหลักฐานการโอนไปยัง Supabase ก่อน (ถ้ามี)
      if (paymentMethod === 'bank_transfer' && paymentProof) {
        console.log('📤 Uploading payment proof to Supabase...');
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', paymentProof);

        const uploadResponse = await fetch(`${toAbsoluteUrl('/api/upload/payment-proof')}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: uploadFormData
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.message || 'ไม่สามารถอัปโหลดหลักฐานการโอนได้');
        }

        const uploadResult = await uploadResponse.json();
        paymentProofUrl = uploadResult.url; // URL ของไฟล์ใน Supabase
        
        console.log('✅ Payment proof uploaded successfully:', paymentProofUrl);
      }

      // สร้างคำสั่งซื้อ
      const orderData = {
        addressId: shippingAddress?.id.toString() || '',
        paymentMethod,
        subtotal: subtotal.toString(),
        shippingFee: shippingCost.toString(),
        discount: discount.toString(),
        couponCode: appliedCoupon || '',
        totalAmount: finalTotal.toString(),
        cartItems: JSON.stringify(normalizedCartItems),
        paymentProofUrl, // ส่ง URL แทนไฟล์
        couponId: null,
        couponDiscount: discount.toString()
      };

      console.log('Sending order data:', orderData);
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(orderData)
      });
      
      // ตรวจสอบข้อผิดพลาดจาก API แบบละเอียด
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
      }
      
      const apiResult = await response.json();
      const orderNumber = apiResult.order.orderNumber;

      // ล้างตะกร้าก่อนที่จะแสดง SweetAlert
      clearCart();

      console.log('Order created successfully:', {orderNumber});

      Swal.fire({
        title: 'สั่งซื้อสำเร็จ!',
        text: `หมายเลขคำสั่งซื้อของคุณคือ ${orderNumber}`,
        icon: 'success',
        confirmButtonText: 'ดูรายการสั่งซื้อ',
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = `/orders/tracking/${orderNumber}`;
        } else {
          router.push('/orders');
        }
      });
      
    } catch (error) {
      console.error('Error processing order:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: error instanceof Error ? error.message : 'ไม่สามารถดำเนินการสั่งซื้อได้',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // แก้ไขส่วนแสดงวิธีการชำระเงิน
  const renderPaymentMethodsSection = () => {
    if (availablePaymentMethods.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>ขณะนี้ยังไม่มีวิธีการชำระเงินที่เปิดใช้งาน</p>
          <p className="text-sm mt-2">กรุณาติดต่อเจ้าหน้าที่</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Bank Transfer */}
        {availablePaymentMethods.includes('bank_transfer') && (
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <input
              type="radio"
              name="payment"
              value="bank_transfer"
              checked={paymentMethod === 'bank_transfer'}
              onChange={() => setPaymentMethod('bank_transfer')}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="ml-3 flex-grow">
              <span className="block font-medium text-gray-800">โอนเงินผ่านธนาคาร</span>
              <span className="text-sm text-gray-500">โอนเงินผ่านบัญชีธนาคารหรือ Mobile Banking</span>
            </div>
          </label>
        )}

        {/* Credit Card */}
        {availablePaymentMethods.includes('credit_card') && (
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <input
              type="radio"
              name="payment"
              value="credit_card"
              checked={paymentMethod === 'credit_card'}
              onChange={() => setPaymentMethod('credit_card')}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="ml-3 flex-grow">
              <span className="block font-medium text-gray-800">บัตรเครดิต/เดบิต</span>
              <span className="text-sm text-gray-500">ชำระเงินด้วยบัตรเครดิตหรือเดบิตทุกธนาคาร</span>
            </div>
          </label>
        )}

        {/* COD */}
        {availablePaymentMethods.includes('cod') && (
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={() => setPaymentMethod('cod')}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="ml-3">
              <span className="block font-medium text-gray-800">ชำระเงินปลายทาง (COD)</span>
              <span className="text-sm text-gray-500">
                ชำระเมื่อได้รับสินค้า 
                {paymentSettings?.cod_fee && paymentSettings.cod_fee > 0 && (
                  ` (เพิ่มค่าบริการ ${paymentSettings.cod_fee} บาท)`
                )}
              </span>
            </div>
          </label>
        )}
      </div>
    );
  };

  // เพิ่มฟังก์ชันสำหรับแสดง toast
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // ลบ toast เก่าถ้ามี
  const existingToast = document.getElementById('copy-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // สร้าง toast ใหม่
  const toast = document.createElement('div');
  toast.id = 'copy-toast';
  toast.className = `fixed top-4 right-4 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
  
  toast.innerHTML = `
    <div class="flex items-center">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${type === 'success' 
          ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
          : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
        }
      </svg>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // แสดง toast
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 100);
  
  // ซ่อน toast หลัง 3 วินาที
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.remove();
      }
    }, 300);
  }, 3000);
};

  // ปรับปรุงฟังก์ชัน copyAccountNumber
  const copyAccountNumber = async (accountNumber: string) => {
    try {
      console.log('📋 [DEBUG] Attempting to copy account number:', accountNumber);
      
      if (!accountNumber) {
        console.warn('⚠️ [DEBUG] No account number to copy');
        showToast('ไม่มีเลขที่บัญชีให้คัดลอก', 'error');
        return;
      }

      await navigator.clipboard.writeText(accountNumber);
      console.log('✅ [DEBUG] Account number copied successfully');
      
      // แสดง toast เมื่อคัดลอกสำเร็จ
      showToast(`คัดลอกเลขบัญชี ${accountNumber} แล้ว`, 'success');
      
    } catch (error) {
      console.error('❌ [DEBUG] Failed to copy account number:', error);
      
      // Fallback สำหรับ browser ที่ไม่รองรับ clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = accountNumber;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          console.log('✅ [DEBUG] Account number copied using fallback method');
          showToast(`คัดลอกเลขบัญชี ${accountNumber} แล้ว`, 'success');
        } else {
          throw new Error('Fallback copy failed');
        }
        
      } catch (fallbackError) {
        console.error('❌ [DEBUG] Fallback copy method also failed:', fallbackError);
        showToast('ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตัวเอง', 'error');
        
        // แสดง popup พร้อมเลขบัญชีให้คัดลอกด้วยตัวเอง
        Swal.fire({
          title: 'คัดลอกเลขบัญชี',
          text: accountNumber,
          icon: 'info',
          confirmButtonText: 'ตกลง',
          customClass: {
            title: 'text-lg font-semibold',
            htmlContainer: 'text-xl font-mono tracking-wider select-all',
          }
        });
      }
    }
  };

// ✅ ปรับปรุงการแสดง bank icon ให้รองรับ full URL
const renderBankDetails = () => {
  if (!paymentSettings?.bank_accounts?.length) {
    return (
      <div className="mt-6 border-t border-gray-200 pt-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">ขณะนี้ยังไม่มีข้อมูลบัญชีธนาคาร</p>
          <p className="text-xs text-yellow-600 mt-1">กรุณาติดต่อเจ้าหน้าที่เพื่อรับข้อมูลการโอนเงิน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">รายละเอียดการโอนเงิน</h3>
      <div className="space-y-3">
        {paymentSettings.bank_accounts.map((account, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* ชื่อธนาคารพร้อม icon */}
                <div className="flex items-center mb-3">
                  {account.bank_icon ? (
                    <div className="relative flex-shrink-0 w-12 h-12 mr-3 bg-white rounded-lg border border-gray-200 p-2">
                      <Image
                        src={toAbsoluteUrl(account.bank_icon)}
                        alt={`${account.bank_name} Logo`}
                        fill
                        sizes="48px"
                        className="object-contain"
                        onError={(e) => {
                          console.error('❌ Failed to load bank icon:', {
                            bank: account.bank_name,
                            iconUrl: account.bank_icon,
                            error: 'Image load failed'
                          });
                          const target = e.currentTarget as any;
                          if (target?.style) target.style.display = 'none';
                          const fallback = (target?.parentElement as HTMLElement)?.querySelector('.bank-fallback');
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }}
                      />
                      {/* Fallback icon */}
                      <div className="bank-fallback hidden absolute inset-0 w-full h-full bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    // ถ้าไม่มี icon ให้แสดง default icon
                    <div className="flex-shrink-0 w-12 h-12 mr-3 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h8a2 2 0 012 2v-2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-800">
                      {account.bank_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {account.account_name}
                    </p>
                    {/* เพิ่มข้อมูล debug */}
                    {process.env.NODE_ENV === 'development' && (
                      <p className="text-xs text-blue-500 mt-1">
                        Icon: {account.bank_icon ? '✅ URL Available' : '❌ No Icon'}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* เลขที่บัญชี */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        เลขที่บัญชี
                      </label>
                      <p className="text-lg font-mono font-semibold text-gray-800 tracking-wider">
                        {account.account_number}
                      </p>
                    </div>
                    <button
                      onClick={() => copyAccountNumber(account.account_number)}
                      className="ml-3 p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group"
                      title="คัดลอกเลขบัญชี"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* สาขา */}
                {account.branch && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      สาขา: {account.branch}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
  // แก้ไขการคำนวณยอดรวม
  const getCODFee = (): number => {
    return paymentSettings?.cod_fee || 30;
  };

  // ใช้ในการคำนวณ
  const codFee = paymentMethod === 'cod' ? getCODFee() : 0;
  const finalTotal = total + codFee;

  // ใช้ในการแสดงผล
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ชำระเงิน</h1>
          <p className="mt-2 text-sm text-gray-500">เลือกวิธีการชำระเงินและตรวจสอบรายละเอียดการสั่งซื้อ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">ที่อยู่จัดส่ง</h2>
                  <button
                    onClick={() => router.push('/profile/address?redirect=checkout')}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    เปลี่ยน
                  </button>
                </div>

                {shippingAddress && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium">{shippingAddress.name}</p>
                    <p className="text-gray-600 mt-1">{shippingAddress.phone}</p>
                    <p className="text-gray-600 mt-1">
                      {shippingAddress.address_line1}
                      {shippingAddress.address_line2 && <span>, {shippingAddress.address_line2}</span>}
                      <br />
                      {shippingAddress.district}, {shippingAddress.city}
                      <br />
                      {shippingAddress.province}, {shippingAddress.postal_code}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">วิธีการชำระเงิน</h2>

                {renderPaymentMethodsSection()}

                {paymentMethod === 'bank_transfer' && renderBankDetails()}

                {paymentMethod === 'bank_transfer' && paymentSettings?.require_payment_proof && (
                  <div id="payment-proof-section" className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      แนบหลักฐานการโอนเงิน <span className="text-red-500">*</span>
                    </h3>
                    
                    {/* แสดงผลการตรวจสอบ */}
                    {slipValidationResult && (
                      <div className={`mb-4 p-3 rounded-md ${
                        slipValidationResult.isValid 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-yellow-50 border border-yellow-200'
                      }`}>
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 ${
                            slipValidationResult.isValid ? 'text-green-500' : 'text-yellow-500'
                          }`}>
                            {slipValidationResult.isValid ? '✅' : '⚠️'}
                          </div>
                          <div className="ml-2">
                            <p className={`text-sm font-medium ${
                              slipValidationResult.isValid ? 'text-green-800' : 'text-yellow-800'
                            }`}>
                              {slipValidationResult.message}
                            </p>
                            {slipValidationResult.foundKeywords && slipValidationResult.foundKeywords.length > 0 && (
                              <p className="text-xs text-gray-600 mt-1">
                                พบคำสำคัญ: {slipValidationResult.foundKeywords.slice(0, 3).join(', ')}
                                {slipValidationResult.foundKeywords.length > 3 && '...'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* แสดงสถานะการตรวจสอบ */}
                    {isValidatingSlip && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <p className="ml-2 text-sm text-blue-700">กำลังตรวจสอบสลิปโอนเงิน...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* ...existing file upload JSX... */}
                    {paymentProofPreview && (
                      <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">หลักฐานการโอนเงิน:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentProof(null);
                              setPaymentProofPreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ลบรูป
                          </button>
                        </div>
                        <div className="relative w-full h-64 bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <Image
                            src={paymentProofPreview}
                            alt="หลักฐานการโอนเงิน"
                            fill
                            className="object-contain"
                            onLoad={() => console.log('📸 [DEBUG] Image loaded successfully')}
                            onError={(e) => {
                              console.error('📸 [DEBUG] Image failed to load:', e);
                              setValidationError('ไม่สามารถแสดงรูปภาพได้ กรุณาลองอัปโหลดใหม่');
                            }}
                          />
                        </div>
                        {paymentProof && (
                          <p className="text-xs text-gray-500 mt-2">
                            ไฟล์: {paymentProof.name} ({(paymentProof.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* พื้นที่อัปโหลด */}
                    <div
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors cursor-pointer ${
                        paymentProofPreview 
                          ? 'border-green-300 bg-green-50 hover:border-green-400' 
                          : 'border-gray-300 hover:border-indigo-400'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="space-y-1 text-center">
                        {paymentProofPreview ? (
                          <>
                            <svg className="mx-auto h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-green-600 font-medium">อัปโหลดสำเร็จ</p>
                            <p className="text-xs text-gray-500">คลิกเพื่อเปลี่ยนรูปภาพ</p>
                          </>
                        ) : (
                          <>
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                <span>อัปโหลดรูปภาพ</span>
                                <input
                                  ref={fileInputRef}
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                />
                              </label>
                              <p className="pl-1">หรือลากและวางที่นี่</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, JPEG ขนาดไม่เกิน 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {validationError && (
                      <p className="mt-2 text-sm text-red-600">{validationError}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">รายการสินค้า</h2>

                <ul className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <li key={item.id} className="py-4 flex">
                      <div className="flex-shrink-0 relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
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
                      <div className="ml-4 flex-1 flex justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-xs text-gray-500">จำนวน: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                          {(item.price * item.quantity).toLocaleString()} บาท
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-md overflow-hidden sticky top-20"
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
                      {shippingCost === 0 ? 'ฟรี' : `${shippingCost} บาท`}
                    </span>
                  </div>

                  {/* เพิ่มแสดงส่วนลด */}
                  {appliedCoupon && discount > 0 && (
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

                  {paymentMethod === 'cod' && (
                    <div className="flex justify-between text-gray-600">
                      <span>ค่าบริการ COD</span>
                      <span>30 บาท</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 flex justify-between">
                    <span className="text-lg font-semibold text-gray-800">ยอดรวมทั้งสิ้น</span>
                    <span className="text-xl font-bold text-indigo-600">
                      {(total + (paymentMethod === 'cod' ? 30 : 0)).toLocaleString()} บาท
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePayment}
                    disabled={isProcessing || (paymentMethod === 'bank_transfer' && !paymentProof)}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center disabled:bg-indigo-300 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                        <span>กำลังดำเนินการ...</span>
                      </>
                    ) : (
                      <>ยืนยันการสั่งซื้อ</>
                    )}
                  </motion.button>

                  {paymentMethod === 'bank_transfer' && !paymentProof && (
                    <p className="mt-2 text-sm text-red-500 text-center">
                      * กรุณาแนบหลักฐานการโอนเงินก่อนยืนยันการสั่งซื้อ
                    </p>
                  )}

                  <p className="mt-4 text-xs text-gray-500 text-center">
                    การคลิก "ยืนยันการสั่งซื้อ" ถือว่าท่านได้อ่านและยอมรับ 
                    <a href="#" className="text-indigo-600 hover:underline">ข้อกำหนดและเงื่อนไข</a> ของเรา
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}