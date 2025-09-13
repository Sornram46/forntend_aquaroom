import Image from 'next/image';
import { API_BASE_URL } from '@/lib/db';

// ดึงข้อมูล about_setting จาก API (ผ่าน proxy route)
async function getAboutSetting() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/about-setting`, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export default async function AboutPage() {
  const about = await getAboutSetting();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
              {about.hero_title || 'เกี่ยวกับเรา'}
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              {about.hero_subtitle || 'ทำความรู้จักกับ AquaRoom และเรื่องราวของเรา'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {about.story_title || 'ประวัติและเรื่องราวของเรา'}
              </h2>
              <div className="prose prose-lg text-gray-700 leading-relaxed">
                <p className="mb-6">
                  {about.story_content || 
                    'AquaRoom เป็นร้านค้าออนไลน์ที่มุ่งมั่นในการจำหน่ายสินค้าคุณภาพสูง พร้อมด้วยบริการที่เป็นเลิศ เราเริ่มต้นจากความต้องการที่จะให้ลูกค้าได้รับสินค้าที่ดีที่สุดในราคาที่เหมาะสม'
                  }
                </p>
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                {about.story_image_url ? (
                  <Image
                    src={about.story_image_url}
                    alt="เกี่ยวกับเรา"
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p>รูปภาพเกี่ยวกับเรา</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {about.mission_title || 'วิสัยทัศน์และพันธกิจ'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {about.mission_subtitle || 'เป้าหมายและค่านิยมที่เราประดับใจในการให้บริการ'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Mission 1 */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {about.mission_1_title || 'คุณภาพ'}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {about.mission_1_desc || 
                  'เราคัดสรรแต่สินค้าคุณภาพดีจากแบรนด์ที่เชื่อถือได้ พร้อมการรับประกันที่ครอบคลุม'
                }
              </p>
            </div>

            {/* Mission 2 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {about.mission_2_title || 'ราคาเป็นธรรม'}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {about.mission_2_desc || 
                  'เราเชื่อในการตั้งราคาที่เป็นธรรม ไม่มีค่าใช้จ่ายแฝงหรือค่าธรรมเนียมที่ไม่จำเป็น'
                }
              </p>
            </div>

            {/* Mission 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {about.mission_3_title || 'การบริการลูกค้า'}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {about.mission_3_desc || 
                  'เรามุ่งมั่นที่จะมอบประสบการณ์ลูกค้าที่ยอดเยี่ยมและให้บริการหลังการขายอย่างดีเยี่ยม'
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {about.values_title || 'ค่านิยมของเรา'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {about.values_subtitle || 'หลักการสำคัญที่เราใช้ในการดำเนินธุรกิจ'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Value 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {about.value_1_title || 'คุณภาพ'}
              </h3>
              <p className="text-gray-700">
                {about.value_1_desc || 'คัดสรรสินค้าคุณภาพดีที่สุดมาให้ลูกค้า'}
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {about.value_2_title || 'รวดเร็ว'}
              </h3>
              <p className="text-gray-700">
                {about.value_2_desc || 'จัดส่งสินค้าให้ถึงมือลูกค้าอย่างรวดเร็ว'}
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {about.value_3_title || 'ใส่ใจ'}
              </h3>
              <p className="text-gray-700">
                {about.value_3_desc || 'ให้บริการด้วยความใส่ใจและเอาใจใส่ลูกค้า'}
              </p>
            </div>

            {/* Value 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {about.value_4_title || 'นวัตกรรม'}
              </h3>
              <p className="text-gray-700">
                {about.value_4_desc || 'มุ่งพัฒนาและปรับปรุงบริการอย่างต่อเนื่อง'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {about.cta_title || 'พร้อมเป็นส่วนหนึ่งกับเราแล้วหรือยัง?'}
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            {about.cta_subtitle || 'เริ่มต้นประสบการณ์การช็อปปิ้งที่ดีที่สุดกับเราวันนี้'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={about.cta_button_1_link || '/products'}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors duration-300"
            >
              {about.cta_button_1_text || 'เริ่มช็อปปิ้ง'}
            </a>
            <a
              href={about.cta_button_2_link || '/contact'}
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-indigo-600 transition-colors duration-300"
            >
              {about.cta_button_2_text || 'ติดต่อเรา'}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}