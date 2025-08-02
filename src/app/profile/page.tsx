'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: string;
  created_at: string;
}

interface UserStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // สถิติผู้ใช้
  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (isAuthenticated && user) {
      fetchUserProfile();
      fetchUserStats();
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      }

      const data = await response.json();
      setProfile(data.user);
      setName(data.user.name);
      setPhone(data.user.phone || '');
      setAvatarPreview(data.user.avatar);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถโหลดข้อมูลส่วนตัวได้',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลสถิติได้');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 2MB)
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        title: 'ไฟล์มีขนาดใหญ่เกินไป',
        text: 'กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 2MB',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'ประเภทไฟล์ไม่ถูกต้อง',
        text: 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
      return;
    }

    setNewAvatar(file);

    // สร้าง URL preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // สร้าง FormData สำหรับส่งข้อมูลและไฟล์
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      
      if (newAvatar) {
        formData.append('avatar', newAvatar);
      }

      // ส่งข้อมูลไปยัง API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถอัปเดตข้อมูลได้');
      }

      const result = await response.json();

      // อัปเดตข้อมูลใน Context
      if (updateUserProfile) {
        updateUserProfile({
          name,
          
          avatar: result.user.avatar
        });
      }

      Swal.fire({
        title: 'สำเร็จ!',
        text: 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถอัปเดตข้อมูลส่วนตัวได้',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
    } finally {
      setIsSaving(false);
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ข้อมูลส่วนตัว</h1>
          <p className="mt-2 text-sm text-gray-500">จัดการข้อมูลส่วนตัวและบัญชีของคุณ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* เมนูด้านซ้าย */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6 flex flex-col items-center text-center border-b border-gray-200">
                <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 bg-gray-100">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-3xl font-medium">
                      {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{profile?.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{profile?.email}</p>
                <p className="text-xs text-gray-400 mt-1">สมาชิกตั้งแต่: {new Date(profile?.created_at || '').toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              
              <div className="p-4">
                <nav className="space-y-1">
                  <Link href="/profile" className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    ข้อมูลส่วนตัว
                  </Link>
                  
                  <Link href="/profile/orders" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    ประวัติการสั่งซื้อ
                  </Link>
                  
                  <Link href="/profile/address" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    ที่อยู่จัดส่ง
                  </Link>
                  
                  <Link href="/profile/settings" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    ตั้งค่าบัญชี
                  </Link>
                  
                  <Link href="/wishlist" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    สินค้าที่ชอบ
                  </Link>
                  
                  <Link href="/orders/tracking" className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    ติดตามพัสดุ
                  </Link>
                </nav>
              </div>
            </motion.div>
            
            {/* สถิติผู้ใช้ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden mt-6"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">สถิติของฉัน</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-600">{stats.totalOrders}</p>
                    <p className="text-sm text-gray-500">คำสั่งซื้อทั้งหมด</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalSpent.toLocaleString()} ฿
                    </p>
                    <p className="text-sm text-gray-500">ยอดซื้อทั้งหมด</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-500">{stats.pendingOrders}</p>
                    <p className="text-sm text-gray-500">รอดำเนินการ</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.completedOrders}</p>
                    <p className="text-sm text-gray-500">สำเร็จแล้ว</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* ข้อมูลส่วนตัว */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">ข้อมูลส่วนตัว</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 focus:outline-none"
                >
                  {isEditing ? 'ยกเลิก' : 'แก้ไข'}
                </button>
              </div>
              
              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-6 flex flex-col items-center">
                      <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 bg-gray-100 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}>
                        {avatarPreview ? (
                          <Image
                            src={avatarPreview}
                            alt="Profile"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-500 text-4xl font-medium">
                            {profile?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <p className="text-sm text-gray-500">คลิกที่รูปเพื่อเปลี่ยนรูปโปรไฟล์</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อ-นามสกุล
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          อีเมล
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={profile?.email || ''}
                          className="w-full px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                          disabled
                        />
                        <p className="mt-1 text-xs text-gray-500">ไม่สามารถเปลี่ยนอีเมลได้</p>
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                          เบอร์โทรศัพท์
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0xxxxxxxxx"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center disabled:bg-indigo-400 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <>
                            <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                            กำลังบันทึก...
                          </>
                        ) : 'บันทึกข้อมูล'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <dl>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">ชื่อ-นามสกุล</dt>
                          <dd className="mt-1 text-base text-gray-900">{profile?.name}</dd>
                        </div>
                        
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">อีเมล</dt>
                          <dd className="mt-1 text-base text-gray-900">{profile?.email}</dd>
                        </div>
                        
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">เบอร์โทรศัพท์</dt>
                          <dd className="mt-1 text-base text-gray-900">
                            {profile?.phone ? profile.phone : <span className="text-gray-400">ยังไม่ได้ระบุ</span>}
                          </dd>
                        </div>
                        
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">สมาชิกมาแล้ว</dt>
                          <dd className="mt-1 text-base text-gray-900">
                            {profile?.created_at ? 
                              Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) + ' วัน' : 
                              '0 วัน'
                            }
                          </dd>
                        </div>
                      </div>
                    </dl>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900">การรักษาความปลอดภัย</h3>
                      <div className="mt-4 space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">รหัสผ่าน</p>
                            <p className="text-sm text-gray-500">อัปเดตล่าสุด: 30 วันที่แล้ว</p>
                          </div>
                          <Link
                            href="/profile/settings"
                            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            เปลี่ยนรหัสผ่าน
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* คำสั่งซื้อล่าสุด */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden mt-6"
            >
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">คำสั่งซื้อล่าสุด</h2>
                <Link
                  href="/profile/orders"
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  ดูทั้งหมด
                </Link>
              </div>
              
              <div className="divide-y divide-gray-200">
                {stats.totalOrders > 0 ? (
                  <>
                    <div className="p-6 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">คำสั่งซื้อ #OR2304001234</p>
                        <p className="text-sm text-gray-500">18 เม.ย. 2023 - รอการจัดส่ง</p>
                      </div>
                      <p className="text-lg font-semibold text-indigo-600">฿1,590</p>
                    </div>
                    
                    <div className="p-6 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">คำสั่งซื้อ #OR2303000987</p>
                        <p className="text-sm text-gray-500">5 มี.ค. 2023 - จัดส่งแล้ว</p>
                      </div>
                      <p className="text-lg font-semibold text-indigo-600">฿2,890</p>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">คุณยังไม่มีประวัติการสั่งซื้อ</p>
                    <Link
                      href="/products"
                      className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-800"
                    >
                      <span>เลือกซื้อสินค้าเลย</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}