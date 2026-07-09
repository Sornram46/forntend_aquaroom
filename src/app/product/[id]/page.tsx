'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { toAbsoluteUrl } from '@/lib/db';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  imageUrlTwo: string | null;
  imageUrlThree: string | null;
  imageUrlFour: string | null;
  images?: string[];
  category: string;
  stock: number;
  
  // เพิ่มข้อมูลใหม่
  specifications?: string;
  features?: string;
  shippingInfo?: string;
  warrantyInfo?: string;
  returnPolicy?: string;
  careInstructions?: string;
  dimensions?: string;
  weight?: string;
  material?: string;
  countryOrigin?: string;
  shippingCost?: number;
   // ✅ เพิ่มข้อมูลการจัดส่งจากฐานข้อมูล
  hasSpecialShipping?: boolean;
  specialShippingBase?: number;
  specialShippingQty?: number;
  specialShippingExtra?: number;
  specialShippingNotes?: string;
  shippingCostBangkok?: number;
  shippingCostProvinces?: number;
  shippingCostRemote?: number;
  freeShippingThreshold?: number;
  deliveryTime?: string;
  shippingNotes?: string;
  specialHandling?: boolean;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // ✅ ค่าจัดส่งและสถานะคำนวณ
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // คำนวณในฝั่ง client เป็น fallback ถ้า API ล้มเหลว
  const computeShippingCost = (p: Product, qty: number): number => {
    if (!p) return 0;
    if (typeof p.freeShippingThreshold === 'number' && p.price * qty >= p.freeShippingThreshold) return 0;
    if (p.hasSpecialShipping) {
      const base = Number(p.specialShippingBase ?? 0);
      const threshold = Number(p.specialShippingQty ?? 0);
      const extra = Number(p.specialShippingExtra ?? 0);
      if (qty <= threshold) return base;
      return base + Math.max(0, qty - threshold) * extra;
    }
    if (typeof p.shippingCostProvinces === 'number') return p.shippingCostProvinces!;
    if (typeof p.shippingCostBangkok === 'number') return p.shippingCostBangkok!;
    if (typeof p.shippingCostRemote === 'number') return p.shippingCostRemote!;
    return 50;
  };

  // เรียก API ดึงค่าจัดส่ง (ใช้ NEXT_PUBLIC_API_BASE_URL ถ้ามี)
  const calculateShippingViaAPI = async (p: Product, qty: number, signal?: AbortSignal): Promise<number | null> => {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');
    const url = `${base}/api/shipping/calculate`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: p.id,
        quantity: qty,
        // เติมพารามิเตอร์อื่นที่แบ็กเอนด์รองรับได้ เช่น เขต/จังหวัด/รหัสไปรษณีย์
        // region: 'TH', postalCode: '10110'
      }),
      signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    // รองรับรูปแบบคีย์ได้หลายแบบ
    const apiCost =
      (typeof data?.cost === 'number' && data.cost) ??
      (typeof data?.shippingCost === 'number' && data.shippingCost) ??
      (typeof data?.total === 'number' && data.total) ??
      (typeof data?.data?.cost === 'number' && data.data.cost) ??
      null;
    return typeof apiCost === 'number' ? apiCost : null;
  };

  // คำนวณ/ดึงค่าจัดส่งเมื่อ product หรือ quantity เปลี่ยน
  useEffect(() => {
    if (!product) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        setIsCalculatingShipping(true);
        // เรียก API ก่อน
        const apiCost = await calculateShippingViaAPI(product, quantity, ctrl.signal);
        if (typeof apiCost === 'number') {
          setShippingCost(apiCost);
          return;
        }
        // ถ้า API ไม่ส่งค่าที่ใช้ได้ ให้ fallback local
        const fallback = computeShippingCost(product, quantity);
        setShippingCost(fallback);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('shipping calculate error:', err);
          setShippingCost(computeShippingCost(product, quantity));
        }
      } finally {
        if (!ctrl.signal.aborted) setIsCalculatingShipping(false);
      }
    })();
    return () => ctrl.abort();
  }, [product, quantity]);

  const { addToCart } = useCart();

  // Safe number formatter to avoid calling toLocaleString on undefined/null
  const formatCurrency = (value: unknown) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0';
    try {
      return n.toLocaleString();
    } catch {
      return `${n}`;
    }
  };

  const normalizeRelatedProduct = (item: any): Product => {
    const images = [
      ...(Array.isArray(item?.images) ? item.images : []),
      ...(Array.isArray(item?.image_urls) ? item.image_urls : []),
      item?.imageUrl,
      item?.image_url,
      item?.image_url_two,
      item?.image_url_three,
      item?.image_url_four,
      item?.thumbnail,
      item?.cover,
      item?.image,
    ].filter(Boolean);

    return {
      ...item,
      imageUrl: images[0] ?? null,
      imageUrlTwo: images[1] ?? null,
      imageUrlThree: images[2] ?? null,
      imageUrlFour: images[3] ?? null,
      images,
    };
  };

  function isSupabasePublic(url?: string | null) {
    if (!url) return false;
    try {
      const u = new URL(url);
      return u.hostname.endsWith('.supabase.co') && u.pathname.startsWith('/storage/v1/object/public/');
    } catch { return false; }
  }

  useEffect(() => {
    async function fetchProductDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('ไม่พบสินค้าที่คุณกำลังมองหา');
          }
          throw new Error('เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
        }
        
        const data = await response.json();
        setProduct(data);
        // ใช้ imageUrl ก่อน ถ้าไม่มีใช้ภาพแรกจาก images
        const firstImg = (data.imageUrl || (Array.isArray(data.images) ? data.images[0] : '')) || null;
        setCurrentImage(firstImg ? toAbsoluteUrl(firstImg) : null);
        
        // โหลดสินค้าที่เกี่ยวข้อง (สินค้าในหมวดหมู่เดียวกัน)
        const deriveCategoryKey = (p: any): string | null => {
          if (!p) return null;
          const nested = (p.category && (p.category.slug || p.category.name)) || null;
          const candidates = [
            p.category,
            p.category_slug,
            p.categorySlug,
            p.categoryName,
            p.category_name,
            p.seo_slug,
            nested,
          ];
          const found = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
          return found ? String(found) : null;
        };
        const catKey = deriveCategoryKey(data);
        if (catKey) {
          fetchRelatedProducts(catKey);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      } finally {
        setLoading(false);
      }
    }
    
    async function fetchRelatedProducts(category: string) {
      if (!category || typeof category !== 'string') return;
      try {
        // เรียกใช้ API เพื่อดึงสินค้าในหมวดหมู่เดียวกัน
        const response = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
        
        if (response.ok) {
          const data = await response.json();
          // กรองสินค้าปัจจุบันออก และจำกัดจำนวนสินค้าที่แสดง
          const filtered = data
            .map((item: any) => normalizeRelatedProduct(item))
            .filter((p: Product) => p.id !== parseInt(productId as string))
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
      }
    }
    
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);
  
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0 && product && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };
  
  const handleAddToCart = () => {
    if (!product) return;
    
    setAddingToCart(true);
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: quantity,
      category: product.category
    };
    
    addToCart(cartItem);
    
    setTimeout(() => {
      setAddingToCart(false);
      setShowAddedAnimation(true);
      
      setTimeout(() => {
        setShowAddedAnimation(false);
      }, 2000);
    }, 500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    // เก็บข้อมูลสินค้าไว้ใน sessionStorage แทนการใส่ตะกร้า
    const directPurchase = {
      items: [{
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantity,
        category: product.category
      }],
      timestamp: Date.now(),
      mode: 'direct' // บอกว่าเป็นการซื้อตรง ไม่ผ่าน cart
    };
    
    sessionStorage.setItem('directPurchase', JSON.stringify(directPurchase));
    router.push('/checkout/payment');
  };
  
  // ฟังก์ชันเลื่อนรูปภาพ
  const navigateImage = (direction: 'prev' | 'next') => {
    if (!product) return;
    
    // รวบรวมรูปภาพที่มีข้อมูล
    const images = [
      product.imageUrl,
      product.imageUrlTwo,
      product.imageUrlThree,
      product.imageUrlFour
    ].filter(img => img !== null && img !== '');
    
    const currentIndex = images.findIndex(img => img === currentImage);
    
    if (currentIndex !== -1) {
      if (direction === 'next') {
        const nextIndex = (currentIndex + 1) % images.length;
        setCurrentImage(images[nextIndex]);
      } else {
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setCurrentImage(images[prevIndex]);
      }
    }
  };

  // ฟังก์ชันสำหรับแสดงเนื้อหาตามแท็บ
  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">รายละเอียดสินค้า</h3>
            <div className="prose prose-indigo max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                {product?.description || 'ไม่มีรายละเอียดสินค้าเพิ่มเติม'}
              </p>
              
              {/* ข้อมูลพื้นฐาน */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {product?.dimensions && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="font-medium text-gray-900">ขนาด</dt>
                    <dd className="text-gray-700">{product.dimensions}</dd>
                  </div>
                )}
                {product?.weight && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="font-medium text-gray-900">น้ำหนัก</dt>
                    <dd className="text-gray-700">{product.weight}</dd>
                  </div>
                )}
                {product?.material && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="font-medium text-gray-900">วัสดุ</dt>
                    <dd className="text-gray-700">{product.material}</dd>
                  </div>
                )}
                {product?.countryOrigin && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <dt className="font-medium text-gray-900">ประเทศผู้ผลิต</dt>
                    <dd className="text-gray-700">{product.countryOrigin}</dd>
                  </div>
                )}
              </div>

              {/* รายละเอียดเพิ่มเติม */}
              {product?.features && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">คุณสมบัติพิเศษ</h4>
                  <div 
                    className="text-gray-700" 
                    dangerouslySetInnerHTML={{ __html: product.features }}
                  />
                </div>
              )}

              {/* ข้อมูลการรับประกัน */}
              
            </div>
          </div>
        );

      case 'specifications':
        return (
          <div className="py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">คุณสมบัติ</h3>
            <div className="prose prose-indigo max-w-none">
              {product?.specifications ? (
                <div 
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.specifications }}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">ข้อมูลทั่วไป</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">หมวดหมู่:</dt>
                          <dd className="font-medium">{product?.category}</dd>
                        </div>
                        {product?.dimensions && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600">ขนาด:</dt>
                            <dd className="font-medium">{product.dimensions}</dd>
                          </div>
                        )}
                        {product?.weight && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600">น้ำหนัก:</dt>
                            <dd className="font-medium">{product.weight}</dd>
                          </div>
                        )}
                        {product?.material && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600">วัสดุ:</dt>
                            <dd className="font-medium">{product.material}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">ข้อมูลเพิ่มเติม</h4>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">สต็อก:</dt>
                          <dd className="font-medium">{product?.stock} ชิ้น</dd>
                        </div>
                        {product?.countryOrigin && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600">ประเทศผู้ผลิต:</dt>
                            <dd className="font-medium">{product.countryOrigin}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                  
                  {product?.careInstructions && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">วิธีการดูแล</h4>
                      <p className="text-blue-800">{product.careInstructions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'shipping':
  return (
    <div className="py-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">การจัดส่ง</h3>
      <div className="prose prose-indigo max-w-none">
        {/* ✅ แสดงข้อมูลการจัดส่งเพิ่มเติมจากฐานข้อมูล */}
        {product?.shippingInfo && (
          <div 
            className="text-gray-700 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            dangerouslySetInnerHTML={{ __html: product.shippingInfo }}
          />
        )}
        
        <div className="space-y-6">
          {/* ✅ ข้อมูลการจัดส่งจริงจากฐานข้อมูล */}
          {product?.hasSpecialShipping ? (
            // การจัดส่งพิเศษ (สำหรับสินค้าพิเศษ เช่น ปลา)
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h4 className="font-bold text-orange-900">🐠 การจัดส่งพิเศษ (สำหรับสินค้าพิเศษ)</h4>
              </div>
              
              <div className="space-y-4 text-orange-800">
                <div className="bg-white bg-opacity-70 rounded-lg p-4">
                  <p className="font-medium mb-2 text-orange-900">📦 ค่าจัดส่งสำหรับสินค้าชิ้นนี้:</p>
                  
                  {product.specialShippingBase && product.specialShippingQty && product.specialShippingExtra && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-orange-100 p-3 rounded">
                          <h5 className="font-medium mb-2 text-orange-900">💰 การคำนวณค่าจัดส่ง:</h5>
                          <ul className="space-y-1 text-sm">
                            <li>🔹 สั่ง 1-{product.specialShippingQty} ตัว = <span className="font-bold">{product.specialShippingBase} บาท</span></li>
                            <li>🔹 สั่งเกิน {product.specialShippingQty} ตัว = <span className="font-bold">{product.specialShippingBase} + (จำนวนเกิน × {product.specialShippingExtra}) บาท</span></li>
                          </ul>
                        </div>
                        
                        <div className="bg-orange-100 p-3 rounded">
                          <h6 className="font-medium mb-2 text-orange-900">📊 ตัวอย่างการคำนวณ:</h6>
                          <div className="text-xs space-y-1">
                            <p>• สั่ง <span className="font-bold">{product.specialShippingQty + 1}</span> ตัว = {product.specialShippingBase} + (1×{product.specialShippingExtra}) = <span className="font-bold text-orange-700">{product.specialShippingBase + product.specialShippingExtra} บาท</span></p>
                            <p>• สั่ง <span className="font-bold">{product.specialShippingQty + 3}</span> ตัว = {product.specialShippingBase} + (3×{product.specialShippingExtra}) = <span className="font-bold text-orange-700">{product.specialShippingBase + (3 * product.specialShippingExtra)} บาท</span></p>
                            <p>• สั่ง <span className="font-bold">{product.specialShippingQty + 6}</span> ตัว = {product.specialShippingBase} + (6×{product.specialShippingExtra}) = <span className="font-bold text-orange-700">{product.specialShippingBase + (6 * product.specialShippingExtra)} บาท</span></p>
                          </div>
                        </div>
                      </div>
                      
                      {/* ✅ เพิ่มเครื่องคำนวณค่าจัดส่งแบบ Interactive */}
                      <div className="bg-white border border-orange-300 rounded-lg p-4">
                        <h6 className="font-medium text-orange-900 mb-3">🧮 คำนวณค่าจัดส่งของคุณ:</h6>
                        <div className="flex items-center space-x-4">
                          <div>
                            <label className="block text-sm font-medium text-orange-800 mb-1">จำนวนที่ต้องการสั่ง:</label>
                            <input 
                              type="number" 
                              min="1" 
                              defaultValue="1"
                              className="w-20 px-2 py-1 border border-orange-300 rounded text-center"
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 1;
                                const baseShipping = product.specialShippingBase || 0;
                                const threshold = product.specialShippingQty || 0;
                                const extraCost = product.specialShippingExtra || 0;
                                
                                let totalShipping = baseShipping;
                                if (qty > threshold) {
                                  totalShipping = baseShipping + ((qty - threshold) * extraCost);
                                }
                                
                                const resultElement = document.getElementById('shipping-calculator-result');
                                if (resultElement) {
                                  resultElement.innerHTML = `
                                    <span class="font-bold text-orange-700">${totalShipping} บาท</span>
                                    ${qty > threshold ? `(${baseShipping} + ${qty - threshold} × ${extraCost})` : ''}
                                  `;
                                }
                              }}
                            />
                          </div>
                          <div>
                            <span className="text-sm text-orange-800">ค่าจัดส่ง:</span>
                            <div id="shipping-calculator-result" className="font-bold text-orange-700">
                              {product.specialShippingBase} บาท
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {product.specialShippingNotes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
                      <p className="text-yellow-800 text-sm">
                        <strong>📝 หมายเหตุพิเศษ:</strong> {product.specialShippingNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // การจัดส่งปกติ
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                  </svg>
                  <h4 className="font-medium text-indigo-900">💰 ค่าจัดส่ง</h4>
                </div>
                <ul className="space-y-2 text-gray-700">
                 <li className="flex justify-between items-center">
                    <span>🚚 ค่าจัดส่งมาตรฐาน:</span>
                    <span className="font-bold text-gray-900">
                      {Number(shippingCost ?? 0) === 0 ? 'ฟรี' : `${formatCurrency(shippingCost)} บาท`}
                    </span>
                  </li>
                
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-medium text-green-900">⏰ เวลาจัดส่ง</h4>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    ระยะเวลาจัดส่ง: <span className="font-bold ml-1">{product?.deliveryTime || '2-3 วันทำการ'}</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    จัดส่งทั่วประเทศ
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    ติดตามพัสดุได้
                  </li>
                  {product?.specialHandling && (
                    <li className="flex items-center text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      🔶 สินค้าต้องการการดูแลพิเศษ
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          {/* ✅ เพิ่มข้อมูลการจัดส่งเพิ่มเติม */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* วิธีการจัดส่ง */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                🚚 วิธีการจัดส่ง
              </h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>📦 Thailand Post (EMS)</li>
                <li>🏪 รับที่หน้าร้าน (ฟรี)</li>
              </ul>
            </div>

            {/* พื้นที่จัดส่ง */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                🗺️ พื้นที่จัดส่ง
              </h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>🇹🇭 ทั่วประเทศไทย</li>
                <li>🏝️ เกาะต่างๆ (ค่าจัดส่งเพิ่ม)</li>
                <li>🚫 ไม่จัดส่งต่างประเทศ</li>
              </ul>
            </div>
          </div>
          
          {/* หมายเหตุการจัดส่งทั่วไป */}
          {product?.shippingNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                📋 หมายเหตุการจัดส่ง
              </h4>
              <p className="text-blue-800">{product.shippingNotes}</p>
            </div>
          )}
          
          {/* คำแนะนำทั่วไป */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-800">⚠️ ข้อควรทราบ</h4>
                <div className="text-yellow-700 mt-1 space-y-1">
                  <p>• ✅ ตรวจสอบสินค้าทันทีเมื่อได้รับ</p>
                  <p>• ⏰ กรณีสินค้าชำรุดแจ้งภายใน 24 ชั่วโมง</p>
                  <p>• 📦 เก็บบรรจุภัณฑ์เอาไว้สำหรับการเปลี่ยนหรือคืนสินค้า</p>
                  <p>• 📞 ติดต่อเราหากมีปัญหาการจัดส่ง</p>
                  {product?.hasSpecialShipping && (
                    <p className="font-medium text-yellow-800 bg-yellow-100 p-2 rounded border border-yellow-300">
                      🐠 สินค้าชิ้นนี้มีวิธีการจัดส่งพิเศษ กรุณาอ่านรายละเอียดด้านบน
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* ช่องทางติดต่อ */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-medium text-indigo-900 mb-3 flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              💬 ติดต่อสอบถาม
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-indigo-800">
              <div className="flex items-center">
                <span className="text-lg mr-2">📞</span>
                <div>
                  <p className="font-medium">โทรศัพท์</p>
                  <p className="text-sm">095-160-4051</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-lg mr-2">📱</span>
                <div>
                  <p className="font-medium">facebook fanpage</p>
                  <p className="text-sm">AquarRoom</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-lg mr-2">✉️</span>
                <div>
                  <p className="font-medium">อีเมล</p>
                  <p className="text-sm">sonrammuenpet32@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
          
         
        </div>
      </div>
    </div>
  );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/2 h-96 bg-gray-200 rounded-lg"></div>
                <div className="md:w-1/2 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">{error || 'ไม่พบสินค้า'}</h2>
            <p className="mt-2 text-gray-600">ขออภัย ไม่สามารถโหลดข้อมูลสินค้าที่คุณต้องการได้</p>
            <button
              onClick={() => router.push('/products')}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              กลับไปหน้าสินค้า
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="text-gray-500 hover:text-indigo-600">หน้าหลัก</Link>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href="/products" className="text-gray-500 hover:text-indigo-600">สินค้า</Link>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="text-gray-500 hover:text-indigo-600">
                {product.category}
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-gray-800 font-medium truncate">{product.name}</li>
          </ol>
        </nav>
        
        {/* รายละเอียดสินค้า */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="md:flex">
            {/* รูปภาพสินค้า */}
            <div className="md:w-1/2 p-6">
              {/* รูปภาพใหญ่ */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative h-80 md:h-96 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              >
                {currentImage ? (
                  <Image
                    src={toAbsoluteUrl(currentImage)}
                    alt={product.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="hover:scale-105 transition-transform duration-500"
                    unoptimized={isSupabasePublic(currentImage)}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
                    <span className="text-gray-500 text-xl">ไม่มีรูปภาพ</span>
                  </div>
                )}
              </motion.div>
              
              {/* Thumbnails รูปภาพย่อยด้านล่าง */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {(() => {
                  const list = (Array.isArray(product.images) && product.images.length
                    ? product.images
                    : [product.imageUrl, product.imageUrlTwo, product.imageUrlThree, product.imageUrlFour]
                  ).filter(Boolean) as string[];
                  return list.map((raw, index) => {
                    const img = toAbsoluteUrl(raw);
                    return (
                      <div
                        key={index}
                        onClick={() => setCurrentImage(img)}
                        className={`relative h-16 rounded-md overflow-hidden cursor-pointer border-2 ${
                          currentImage === img ? 'border-indigo-500' : 'border-transparent'
                        } hover:opacity-90 transition-all`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} - รูป ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                          unoptimized={isSupabasePublic(img)}
                        />
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            
            {/* ข้อมูลสินค้า */}
            <div className="md:w-1/2 p-6 md:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center">
                  <span className="text-sm font-medium px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                    {product.category}
                  </span>
                  <div className="ml-2 flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-sm text-gray-600">(12 รีวิว)</span>
                  </div>
                </div>
                
                <h1 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
                
                <p className="mt-2 text-3xl font-bold text-indigo-600">
                  {formatCurrency(product?.price)} บาท
                </p>
                
                <div className="mt-6">
                  <h2 className="text-lg font-medium text-gray-900">รายละเอียด</h2>
                  <p className="mt-2 text-gray-700 leading-relaxed">
                    {product.description || 'ไม่มีรายละเอียดสินค้า'}
                  </p>
                  
                  {/* แสดงสถานะจำนวนในคลัง */}
                  <div className="mt-4 flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">สถานะสินค้า:</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.stock > 10
                          ? 'bg-green-100 text-green-800'
                          : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      คงเหลือ {Number(product.stock).toLocaleString()} ชิ้น
                    </span>
                  </div>
                </div>
                
                {/* เลือกจำนวน */}
                <div className="mt-8">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวน
                  </label>
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="px-3 py-1 border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                      className="w-16 text-center py-1 border-t border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300"
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="px-3 py-1 border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="mt-8 space-y-4 relative">
                  <div className="flex gap-3">
                    {/* ปุ่มเพิ่มลงตะกร้า */}
                    <motion.button 
                      whileHover={{ scale: product.stock > 0 ? 1.02 : 1 }}
                      whileTap={{ scale: product.stock > 0 ? 0.98 : 1 }}
                      onClick={handleAddToCart}
                      disabled={addingToCart || product.stock === 0}
                      className={`flex-1 py-3 px-4 text-white rounded-md flex items-center justify-center text-sm font-medium ${
                        product.stock > 0 
                          ? 'bg-indigo-600 hover:bg-indigo-700' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {addingToCart ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          กำลังเพิ่ม...
                        </>
                      ) : product.stock > 0 ? (
                        <>
                          <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          เพิ่มลงตะกร้า
                        </>
                      ) : (
                        'สินค้าหมด'
                      )}
                    </motion.button>

                    {/* ปุ่มสั่งซื้อเลย */}
                    <motion.button
                      whileHover={{ scale: product.stock > 0 ? 1.02 : 1 }}
                      whileTap={{ scale: product.stock > 0 ? 0.98 : 1 }}
                      onClick={handleBuyNow}
                      disabled={product.stock === 0}
                      className={`flex-1 py-3 px-4 rounded-md flex items-center justify-center text-sm font-medium border-2 ${
                        product.stock > 0
                          ? 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                          : 'border-gray-300 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      สั่งซื้อเลย
                    </motion.button>
                  </div>
                  
                  <AnimatePresence>
                    {showAddedAnimation && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute inset-x-0 top-0 bg-green-100 text-green-800 py-3 px-4 rounded-md flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        เพิ่มลงตะกร้าแล้ว! <Link href="/cart" className="underline ml-1 font-medium">ไปที่ตะกร้า</Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <Link href="/products" className="block text-center text-indigo-600 hover:text-indigo-800 text-sm">
                    ← กลับไปหน้าสินค้า
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* รายละเอียดเพิ่มเติม (คุณสมบัติ, การจัดส่ง, การรับประกัน) */}
          <div className="border-t border-gray-200 px-6 py-6">
            <div className="max-w-3xl mx-auto">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button 
                    onClick={() => setActiveTab('details')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'details' 
                        ? 'border-indigo-500 text-indigo-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    รายละเอียดสินค้า
                  </button>
                  <button 
                    onClick={() => setActiveTab('specifications')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'specifications' 
                        ? 'border-indigo-500 text-indigo-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    คุณสมบัติ
                  </button>
                  <button 
                    onClick={() => setActiveTab('shipping')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'shipping' 
                        ? 'border-indigo-500 text-indigo-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    การจัดส่ง
                  </button>
                </nav>
              </div>
              
              {/* เนื้อหาของแท็บ */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {/* สินค้าที่เกี่ยวข้อง */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">สินค้าที่เกี่ยวข้อง</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <motion.div
                  key={relatedProduct.id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <Link href={`/product/${relatedProduct.id}`} className="block">
                    <div className="h-48 bg-gray-100 relative">
                      {relatedProduct.imageUrl ? (
                        <Image
                          src={toAbsoluteUrl(relatedProduct.imageUrl)}
                          alt={relatedProduct.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          unoptimized={isSupabasePublic(relatedProduct.imageUrl)}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
                          <span className="text-gray-500">ไม่มีรูปภาพ</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 hover:text-indigo-600">{relatedProduct.name}</h3>
                      <p className="mt-1 text-gray-500">{relatedProduct.category}</p>
                      <p className="mt-2 font-bold text-indigo-600">{formatCurrency(relatedProduct?.price)} บาท</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Lightbox สำหรับดูรูปขนาดใหญ่ */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-screen"
              onClick={(e) => e.stopPropagation()}
            >
              {currentImage && (
                <Image
                  src={toAbsoluteUrl(currentImage)}
                  alt={product?.name || 'product'}
                  width={1200}
                  height={800}
                  style={{ objectFit: 'contain' }}
                  className="max-h-[80vh] w-auto"
                />
              )}
              
              {/* ปุ่มเลื่อนรูปภาพในโหมด Lightbox */}
              <button
                className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('prev');
                }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-black bg-opacity-50 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('next');
                }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                className="absolute top-2 right-2 p-2 rounded-full bg-black bg-opacity-50 text-white"
                onClick={() => setLightboxOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}