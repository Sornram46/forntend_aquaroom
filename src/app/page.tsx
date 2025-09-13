import Carousel from '@/components/Carousel';
import PopularProducts from '@/components/PopularProducts';
import ScrollAnimation from '@/components/ScrollAnimation';
import CategoriesSection from '@/components/CategoriesSection';
import Link from 'next/link';
import { fetchHomepageSettings } from '@/lib/db';

export const dynamic = 'force-dynamic';          // บังคับ SSR
export const fetchCache = 'force-no-store';      // ถ้าต้อง no-store

// ดึงข้อมูล homepage_setting จาก backend โดยตรง (เลี่ยง relative URL)
async function getHomepageSetting() {
  return await fetchHomepageSettings();
}

// Categories แสดงผ่านคอมโพเนนต์ที่ไปดึงเอง ไม่ต้องดึงซ้ำที่นี่

export default async function Home() {
  const homepage: any = await getHomepageSetting();

  // Debug: homepage loaded
  console.log('Homepage settings loaded');

  return (
    <div className="min-h-screen">
      {/* Full Screen Carousel */}
      <Carousel />
      
      {/* Hero Section */}
      <section className="bg-indigo-600 text-white py-12 sm:py-16 lg:py-20 animate-fade-in scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 animate-slide-up-delay-200 scroll-slide-up scroll-stagger-1">
            {homepage.hero_title || 'ยินดีต้อนรับสู่ AquaRoom'}
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed animate-slide-up-delay-400 scroll-slide-up scroll-stagger-2">
            {homepage.hero_subtitle || 'ร้านค้าออนไลน์ที่มีสินค้าคุณภาพดี พร้อมจัดส่งรวดเร็วทั่วประเทศ'}
          </p>
        </div>
      </section>

    {/* Categories Section */}
    <CategoriesSection />

      {/* Why Choose Us Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-blue-50 scroll-fade">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-16 lg:mb-20 animate-fade-in-up scroll-animate">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 scroll-slide-up scroll-stagger-1">
              {homepage.why_choose_title ? (
                <span dangerouslySetInnerHTML={{ 
                  __html: homepage.why_choose_title.replace('AquaRoom', '<span class="text-indigo-600">AquaRoom</span>') 
                }} />
              ) : (
                <>ทำไมต้องซื้อกับ <span className="text-indigo-600">AquaRoom</span></>
              )}
            </h2>
            <div className="w-24 h-1 bg-indigo-600 mx-auto mb-6 animate-scale-in-delay-200 scroll-scale scroll-stagger-2"></div>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-fade-in-delay-400 scroll-fade scroll-stagger-3">
              {homepage.why_choose_subtitle || 'เรามุ่งมั่นให้บริการที่ดีที่สุด เพื่อความพึงพอใจของลูกค้าทุกท่าน'}
            </p>
          </div>

          {/* Main Benefits Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Left Side - Main Feature */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-in-left scroll-slide-left">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-full mr-4 animate-bounce-in-delay-200 scroll-scale scroll-stagger-1">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold animate-fade-in-delay-300 scroll-fade scroll-stagger-2">
                    {homepage.quality_title || 'รับประกันคุณภาพ 100%'}
                  </h3>
                </div>
                <p className="text-lg opacity-90 leading-relaxed animate-fade-in-delay-500 scroll-fade scroll-stagger-3">
                  {homepage.quality_subtitle || 'สินค้าทุกชิ้นผ่านการตรวจสอบคุณภาพอย่างเข้มงวด พร้อมการรับประกันและบริการหลังการขาย'}
                </p>
              </div>
              <div className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center animate-slide-in-right-delay-600 scroll-slide-right scroll-stagger-1">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                    <span className="text-gray-700">{homepage.quality_feature_1 || 'ตรวจสอบคุณภาพก่อนส่ง'}</span>
                  </div>
                  <div className="flex items-center animate-slide-in-right-delay-700 scroll-slide-right scroll-stagger-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                    <span className="text-gray-700">{homepage.quality_feature_2 || 'รับประกันสินค้า 1 ปีเต็ม'}</span>
                  </div>
                  <div className="flex items-center animate-slide-in-right-delay-800 scroll-slide-right scroll-stagger-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3"></div>
                    <span className="text-gray-700">{homepage.quality_feature_3 || 'บริการหลังการขายตลอด 24/7'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Statistics */}
            <div className="space-y-6 animate-slide-in-right scroll-slide-right">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-lg text-center animate-zoom-in-delay-200 hover:scale-105 transition-transform duration-300 scroll-scale scroll-stagger-1">
                  <div className="text-3xl font-bold text-indigo-600 mb-2 animate-count-up">{homepage.stat_1_number || '10,000+'}</div>
                  <div className="text-gray-600">{homepage.stat_1_label || 'ลูกค้าที่ไว้วางใจ'}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg text-center animate-zoom-in-delay-300 hover:scale-105 transition-transform duration-300 scroll-scale scroll-stagger-2">
                  <div className="text-3xl font-bold text-green-600 mb-2 animate-count-up-delay-100">{homepage.stat_2_number || '99.8%'}</div>
                  <div className="text-gray-600">{homepage.stat_2_label || 'ความพึงพอใจ'}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg text-center animate-zoom-in-delay-400 hover:scale-105 transition-transform duration-300 scroll-scale scroll-stagger-3">
                  <div className="text-3xl font-bold text-purple-600 mb-2 animate-fade-in-delay-200">{homepage.stat_3_number || '1-3 วัน'}</div>
                  <div className="text-gray-600">{homepage.stat_3_label || 'จัดส่งเร็ว'}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg text-center animate-zoom-in-delay-500 hover:scale-105 transition-transform duration-300 scroll-scale scroll-stagger-4">
                  <div className="text-3xl font-bold text-orange-600 mb-2 animate-bounce-in-delay-300">{homepage.stat_4_number || '5★'}</div>
                  <div className="text-gray-600">{homepage.stat_4_label || 'เรตติ้งเฉลี่ย'}</div>
                </div>
              </div>

              {/* Customer Review */}
              <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in-delay-600 scroll-fade scroll-stagger-5">
                <div className="flex items-center mb-4 animate-slide-in-left-delay-700">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current animate-star-twinkle" style={{animationDelay: `${i * 0.1}s`}} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600 text-sm animate-fade-in-delay-800">รีวิวจากลูกค้าจริง</span>
                </div>
                <p className="text-gray-700 italic animate-typewriter">
                  "{homepage.review_text || 'สินค้าคุณภาพดี จัดส่งเร็ว บรรจุภัณฑ์ดี บริการประทับใจมาก จะกลับมาซื้ออีกแน่นอน'}"
                </p>
                <div className="mt-4 flex items-center animate-slide-in-up-delay-900">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium animate-pulse-gentle">
                    {(homepage.review_name || 'คุณสมชาย ใจดี').charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{homepage.review_name || 'คุณสมชาย ใจดี'}</div>
                    <div className="text-sm text-gray-500">{homepage.review_title || 'ลูกค้า VIP'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 scroll-animate">
            {/* Feature 1 */}
            <div className="group bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up-delay-200 scroll-slide-up scroll-stagger-1">
              <div className="mb-4 sm:mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-bounce-in-delay-300">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 animate-fade-in-delay-400">{homepage.feature_1_title || 'จัดส่งรวดเร็ว'}</h3>
                <p className="text-gray-600 leading-relaxed animate-fade-in-delay-500">{homepage.feature_1_desc || 'สินค้าถึงมือคุณภายใน 1-3 วันทำการ พร้อมบริการติดตามสถานะตลอด 24 ชั่วโมง'}</p>
              </div>
              <div className="border-t pt-4 animate-slide-in-up-delay-600">
                <span className="text-sm font-medium text-blue-600">{homepage.feature_1_note || '✓ จัดส่งฟรีเมื่อซื้อครบ 1,000 บาท'}</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up-delay-300 scroll-slide-up scroll-stagger-2">
              <div className="mb-4 sm:mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-bounce-in-delay-400">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 animate-fade-in-delay-500">{homepage.feature_2_title || 'สินค้าคุณภาพ'}</h3>
                <p className="text-gray-600 leading-relaxed animate-fade-in-delay-600">{homepage.feature_2_desc || 'คัดสรรสินค้าคุณภาพเยี่ยมจากแบรนด์ชั้นนำ ผ่านการตรวจสอบมาตรฐานสากล'}</p>
              </div>
              <div className="border-t pt-4 animate-slide-in-up-delay-700">
                <span className="text-sm font-medium text-green-600">{homepage.feature_2_note || '✓ รับประกันคุณภาพ 100%'}</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up-delay-400 scroll-slide-up scroll-stagger-3">
              <div className="mb-4 sm:mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-bounce-in-delay-500">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 animate-fade-in-delay-600">{homepage.feature_3_title || 'คืนสินค้าง่าย'}</h3>
                <p className="text-gray-600 leading-relaxed animate-fade-in-delay-700">{homepage.feature_3_desc || 'ไม่พอใจยินดีคืนเงิน 100% ภายใน 30 วัน ด้วยขั้นตอนง่ายๆ ไม่ซับซ้อน'}</p>
              </div>
              <div className="border-t pt-4 animate-slide-in-up-delay-800">
                <span className="text-sm font-medium text-purple-600">{homepage.feature_3_note || '✓ ขั้นตอนคืนสินค้าง่ายดาย'}</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up-delay-500 scroll-slide-up scroll-stagger-4">
              <div className="mb-4 sm:mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-bounce-in-delay-600">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 animate-fade-in-delay-700">{homepage.feature_4_title || 'ปลอดภัย 100%'}</h3>
                <p className="text-gray-600 leading-relaxed animate-fade-in-delay-800">{homepage.feature_4_desc || 'ระบบชำระเงินปลอดภัย การันตีข้อมูลส่วนตัว พร้อมการป้องกันระดับธนาคาร'}</p>
              </div>
              <div className="border-t pt-4 animate-slide-in-up-delay-900">
                <span className="text-sm font-medium text-orange-600">{homepage.feature_4_note || '✓ ระบบเข้ารหัส SSL 256-bit'}</span>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 sm:mt-20 text-center animate-fade-in-up-delay-1000 scroll-animate">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 sm:p-12 text-white animate-scale-in-delay-200 scroll-scale">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 animate-slide-down-delay-400 scroll-slide-up scroll-stagger-1">
                {homepage.cta_title || 'พร้อมสัมผัสประสบการณ์การช็อปปิ้งที่ดีที่สุด?'}
              </h3>
              <p className="text-lg sm:text-xl opacity-90 mb-8 max-w-3xl mx-auto animate-fade-in-delay-600 scroll-fade scroll-stagger-2">
                {homepage.cta_subtitle || 'เข้าร่วมกับลูกค้ามากกว่า 10,000 ท่านที่เลือกซื้อกับเรา'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-in-delay-800 scroll-slide-up scroll-stagger-3">
                <Link 
                  href={homepage.cta_button_1_link || '/products'}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg animate-pulse-gentle"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {homepage.cta_button_1_text || 'เริ่มช็อปปิ้งเลย'}
                </Link>
                <Link 
                  href={homepage.cta_button_2_link || '/about'}
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-indigo-600 transition-all duration-300"
                >
                  {homepage.cta_button_2_text || 'เรียนรู้เพิ่มเติม'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Popular Products */}
      <div className="animate-fade-in-delay-1200 scroll-fade">
        <PopularProducts />
      </div>

    
      
      {/* Features Section - ปรับให้เล็กลงเล็กน้อย */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 animate-fade-in-delay-1400 scroll-fade">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 animate-slide-down-delay-200 scroll-slide-up">บริการเสริมที่คุณจะได้รับ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-6 sm:p-8 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 animate-zoom-in-delay-300 scroll-scale scroll-stagger-1">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-spin-in-delay-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 sm:h-7 sm:w-7">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 animate-fade-in-delay-500">จัดส่งรวดเร็ว</h3>
              <p className="text-gray-600 text-base sm:text-lg animate-fade-in-delay-600">สินค้าถึงมือคุณภายใน 1-3 วันทำการ</p>
            </div>
            <div className="text-center p-6 sm:p-8 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 animate-zoom-in-delay-400 scroll-scale scroll-stagger-2">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-spin-in-delay-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 sm:h-7 sm:w-7">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 animate-fade-in-delay-600">สินค้าคุณภาพ</h3>
              <p className="text-gray-600 text-base sm:text-lg animate-fade-in-delay-700">เราคัดสรรสินค้าคุณภาพเยี่ยมเท่านั้น</p>
            </div>
            <div className="text-center p-6 sm:p-8 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-300 md:col-span-2 lg:col-span-1 animate-zoom-in-delay-500 scroll-scale scroll-stagger-3">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-spin-in-delay-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6 sm:h-7 sm:w-7">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 animate-fade-in-delay-700">คืนสินค้าฟรี</h3>
              <p className="text-gray-600 text-base sm:text-lg animate-fade-in-delay-800">ไม่พอใจยินดีคืนเงิน 100% ภายใน 30 วัน</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll Animation Component */}
      <ScrollAnimation />
    </div>
  );
}
