import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">เกี่ยวกับเรา</h3>
            <p className="text-gray-300">
              AquaRoom ร้านค้าออนไลน์ที่มอบประสบการณ์การช้อปปิ้งที่ดีที่สุดให้กับลูกค้าของเรา
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">หมวดหมู่สินค้า</h3>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-gray-300 hover:text-white">ปลากัด</Link></li>
              <li><Link href="/products" className="text-gray-300 hover:text-white">อุปกรณ์เลี้ยงปลา</Link></li>
              <li><Link href="/products" className="text-gray-300 hover:text-white">เครื่องกรองน้ำ</Link></li>
              <li><Link href="/products" className="text-gray-300 hover:text-white">อาหารปลา</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">ลูกค้า</h3>
            <ul className="space-y-2">
              <li><Link href="/account" className="text-gray-300 hover:text-white">บัญชีของฉัน</Link></li>
              <li><Link href="/cart" className="text-gray-300 hover:text-white">การสั่งซื้อ</Link></li>
              <li><Link href="/profile/orders" className="text-gray-300 hover:text-white">การจัดส่ง</Link></li>
              <li><Link href="/orders/tracking" className="text-gray-300 hover:text-white">ติดตามคำสั่งซื้อ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">ติดต่อเรา</h3>
            <div className="space-y-2 text-gray-300">
              <p>อีเมล: sonrammuenpet32@gmail.com</p>
              <p>โทร: 095-160-4051</p>
              <div className="flex space-x-4 mt-4">
                <a href="https://www.facebook.com/aquaroomth/" className="text-gray-300 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://www.tiktok.com/@aquaroom_betta?is_from_webapp=1&sender_device=pc" className="text-gray-300 hover:text-white">
                  <span className="sr-only">TikTok</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-white">
                  <span className="sr-only">Line</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <hr className="my-8 border-gray-700" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300">&copy; {new Date().getFullYear()} AquaRoom. สงวนลิขสิทธิ์ทั้งหมด</p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-6">
              <li><Link href="/privacy" className="text-gray-300 hover:text-white">นโยบายความเป็นส่วนตัว</Link></li>
              <li><Link href="/terms" className="text-gray-300 hover:text-white">เงื่อนไขการใช้งาน</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}