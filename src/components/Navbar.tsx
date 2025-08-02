'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';
import { usePathname } from 'next/navigation';

type LogoSettings = {
  logo_url: string;
  logo_alt_text?: string;
  logo_width?: number;
  logo_height?: number;
  dark_logo_url?: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const { cartItems } = useCart();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [prevCartCount, setPrevCartCount] = useState(0);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoSettings, setLogoSettings] = useState<LogoSettings | null>(null);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const cartCount = cartItems.length;
    if (cartCount > prevCartCount) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 400);
    }
    setPrevCartCount(cartCount);
  }, [cartItems, prevCartCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    // ใช้ API homepage-setting (รวม logo)
    fetch('/api/homepage-setting')
      .then(res => res.json())
      .then(data => {
        setLogoSettings(data);
      })
      .catch(err => console.error('Error loading logo:', err));
    
    // หรือใช้ API เฉพาะ logo
    // fetch('/api/logo')
    //   .then(res => res.json())
    //   .then(data => {
    //     setLogoSettings(data);
    //   })
    //   .catch(err => console.error('Error loading logo:', err));
  }, []);

  const cartItemCount = cartItems.length;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 ${
          scrolled ? 'bg-white/60 backdrop-blur-lg shadow-md' : 'bg-white/20 backdrop-blur-sm'
        } transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                {logoSettings?.logo_url ? (
                  <>
                    {/* Light Mode Logo */}
                    <Image
                      src={logoSettings.logo_url}
                      alt={logoSettings.logo_alt_text || "AquaRoom Logo"}
                      width={logoSettings.logo_width || 120}
                      height={logoSettings.logo_height || 40}
                      className="h-auto w-auto max-h-10 dark:hidden"
                      priority
                    />
                    
                    {/* Dark Mode Logo */}
                    {logoSettings.dark_logo_url ? (
                      <Image
                        src={logoSettings.dark_logo_url}
                        alt={logoSettings.logo_alt_text || "AquaRoom Logo"}
                        width={logoSettings.logo_width || 120}
                        height={logoSettings.logo_height || 40}
                        className="h-auto w-auto max-h-10 hidden dark:block"
                        priority
                      />
                    ) : (
                      <Image
                        src={logoSettings.logo_url}
                        alt={logoSettings.logo_alt_text || "AquaRoom Logo"}
                        width={logoSettings.logo_width || 120}
                        height={logoSettings.logo_height || 40}
                        className="h-auto w-auto max-h-10 hidden dark:block brightness-200"
                        priority
                      />
                    )}
                  </>
                ) : (
                  // Fallback text logo
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    AquaRoom
                  </span>
                )}
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium relative ${
                  isActive('/')
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                หน้าแรก
                {isActive('/') && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>
                )}
              </Link>
              <Link
                href="/products"
                className={`px-3 py-2 rounded-md text-sm font-medium relative ${
                  isActive('/products')
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                สินค้า
                {isActive('/products') && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>
                )}
              </Link>
              <Link
                href="/about"
                className={`px-3 py-2 rounded-md text-sm font-medium relative ${
                  isActive('/about')
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                เกี่ยวกับเรา
                {isActive('/about') && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>
                )}
              </Link>
              <Link
                href="/contact"
                className={`px-3 py-2 rounded-md text-sm font-medium relative ${
                  isActive('/contact')
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
              >
                ติดต่อเรา
                {isActive('/contact') && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600"></span>
                )}
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/cart" className="relative p-1">
                <motion.div
                  animate={cartBounce ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-600 hover:text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>

                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </motion.div>
              </Link>

              {isLoading ? (
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
              ) : isAuthenticated ? (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center focus:outline-none"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-indigo-500">
                      {user?.avatar ? (
                        <Image
                          src={user.avatar}
                          alt="User profile"
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-medium">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`ml-1 h-4 w-4 text-gray-500 transition-transform ${
                        userMenuOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>

                        <div className="py-1">
                          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            บัญชีของฉัน
                          </h3>
                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-3 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            ข้อมูลส่วนตัว
                          </Link>
                          <Link
                            href="/profile/address"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-3 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            ที่อยู่จัดส่ง
                          </Link>
                        </div>

                        <div className="py-1 border-t border-gray-100">
                          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            การสั่งซื้อ
                          </h3>
                          <Link
                            href="/profile/orders"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-3 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              />
                            </svg>
                            ประวัติการสั่งซื้อ
                          </Link>
                          <Link
                            href="/orders/tracking"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-3 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            ติดตามพัสดุ
                          </Link>
                          <Link
                            href="/wishlist"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-3 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            สินค้าที่ชอบ
                          </Link>
                        </div>

                        <div className="py-1 border-t border-gray-100">
                          <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            การตั้งค่า
                          </h3>
                          <Link
                            href="/profile/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-3 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            ตั้งค่าบัญชี
                          </Link>
                          <Link
                            href="/support"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-3 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            ช่วยเหลือ
                          </Link>
                        </div>

                        <div className="py-1 border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-3 text-red-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            ออกจากระบบ
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  เข้าสู่ระบบ
                </button>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-1"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg">
                <Link
                  href="/"
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    isActive('/')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  หน้าแรก
                </Link>
                <Link
                  href="/products"
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    isActive('/products')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  สินค้า
                </Link>
                <Link
                  href="/about"
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    isActive('/about')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  เกี่ยวกับเรา
                </Link>
                <Link
                  href="/contact"
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    isActive('/contact')
                      ? 'text-indigo-600 bg-indigo-50 border-l-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ติดต่อเรา
                </Link>

                {!isAuthenticated && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsLoginModalOpen(true);
                    }}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-indigo-600 hover:bg-gray-50 rounded-md"
                  >
                    เข้าสู่ระบบ
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="h-16"></div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}