'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  
  const breadcrumbItems = useMemo(() => {
    // ตัดหลัง query string ออก
    const cleanPath = pathname.split('?')[0];
    const pathSegments = cleanPath.split('/').filter(Boolean);
    
    // สร้าง items สำหรับ breadcrumb
    const items: BreadcrumbItem[] = [
      { label: 'หน้าหลัก', path: '/', isActive: cleanPath === '/' }
    ];
    
    // ตัวแผที่ใช้สำหรับแปลง path segment เป็นชื่อที่แสดงใน breadcrumb
    const pathLabels: Record<string, string> = {
      'products': 'สินค้า',
      'product': 'สินค้า',
      'cart': 'ตะกร้าสินค้า',
      'checkout': 'ชำระเงิน',
      'profile': 'โปรไฟล์',
      'orders': 'ประวัติการสั่งซื้อ',
      'wishlist': 'สินค้าที่ชอบ',
      'address': 'ที่อยู่จัดส่ง',
      'settings': 'ตั้งค่าบัญชี',
      'tracking': 'ติดตามพัสดุ',
      'support': 'ช่วยเหลือ',
      'about': 'เกี่ยวกับเรา',
      'contact': 'ติดต่อเรา',
    };
    
    // สร้าง breadcrumb items จาก path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      // สร้าง path จากส่วนย่อยทั้งหมดจนถึงปัจจุบัน
      currentPath += `/${segment}`;
      
      // ตรวจสอบว่าเป็น dynamic route หรือไม่ (เช่น [id])
      if (segment.startsWith('[') && segment.endsWith(']')) {
        // สำหรับ dynamic routes เช่น [id] จะใช้ค่าจริงแทน
        // ในตัวอย่างนี้ สมมติว่ามี dynamic route เฉพาะสำหรับสินค้า
        if (segment === '[id]' && index > 0 && pathSegments[index - 1] === 'product') {
          items.push({
            label: 'รายละเอียดสินค้า',
            path: currentPath,
            isActive: index === pathSegments.length - 1
          });
        } else {
          // dynamic routes อื่นๆ
          items.push({
            label: segment.replace('[', '').replace(']', ''),
            path: currentPath,
            isActive: index === pathSegments.length - 1
          });
        }
      } else {
        // สำหรับ static routes
        items.push({
          label: pathLabels[segment] || segment,
          path: currentPath,
          isActive: index === pathSegments.length - 1
        });
      }
    });
    
    return items;
  }, [pathname]);
  
  if (breadcrumbItems.length <= 1) {
    return null; // ไม่แสดง breadcrumb ในหน้าหลัก
  }
  
  return (
    <nav className="bg-gray-50 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {breadcrumbItems.map((item, index) => (
            <li key={item.path} className="flex items-center">
              {index > 0 && (
                <svg className="h-4 w-4 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              
              {item.isActive ? (
                <span className="text-indigo-600 font-medium">{item.label}</span>
              ) : (
                <Link href={item.path} className="text-gray-500 hover:text-gray-700">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}