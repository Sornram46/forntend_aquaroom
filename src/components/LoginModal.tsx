'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectAfterLogin?: string;
}

export default function LoginModal({ isOpen, onClose, redirectAfterLogin }: LoginModalProps) {
  const { login, register, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const allowedOriginsEnv = process.env.NEXT_PUBLIC_GOOGLE_ALLOWED_ORIGINS || '';
  const isGoogleAllowedHere = useMemo(() => {
    try {
      if (typeof window === 'undefined') return false;
      const origin = window.location.origin;
      const allowed = allowedOriginsEnv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (allowed.length === 0) {
        // Default allow localhost dev if not configured
        return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      }
      return allowed.includes(origin);
    } catch {
      return false;
    }
  }, [allowedOriginsEnv]);
  const gisRenderedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const redirectRef = useRef(redirectAfterLogin);
  const successHandledRef = useRef(false);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { redirectRef.current = redirectAfterLogin; }, [redirectAfterLogin]);
  
  // ฟอร์มล็อกอิน
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // ฟอร์มสมัครสมาชิก
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  
  // รีเซ็ตฟอร์มเมื่อปิด Modal
  useEffect(() => {
    if (!isOpen) {
      // รีเซ็ตฟอร์มล็อกอิน
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');
      
      // รีเซ็ตฟอร์มสมัครสมาชิก
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setRegisterError('');
    }
  }, [isOpen]);
  
  // จัดการการกด Escape เพื่อปิด modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // ป้องกันการเลื่อน body เมื่อ modal เปิด
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Google Identity Services button
  useEffect(() => {
    // If no client ID, not allowed, or modal closed: clear and skip init
    if (!googleClientId || !isGoogleAllowedHere || !isOpen) {
      if (buttonContainerRef.current) {
        try { if (buttonContainerRef.current.isConnected) buttonContainerRef.current.innerHTML = ''; } catch {}
      }
      gisRenderedRef.current = false;
      successHandledRef.current = false;
      return;
    }

    const google = (window as any).google;

    const renderButton = () => {
      if (gisRenderedRef.current) return; // already rendered this session
      if (!buttonContainerRef.current) return;
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          try {
            if (successHandledRef.current) return; // prevent double handling
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                credential: response.credential,
                id_token: response.credential,
                token: response.credential,
                provider: 'google',
                next: redirectRef.current || '/cart',
              }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
              localStorage.setItem('auth_token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              successHandledRef.current = true;
              onCloseRef.current?.();
              window.location.href = redirectRef.current || '/cart';
            } else {
              alert(data.message || 'Google login failed');
            }
          } catch (err) {
            console.error('Google login error', err);
            alert('Google login failed');
          }
        },
      });
      if (buttonContainerRef.current) {
        try { if (buttonContainerRef.current.isConnected) buttonContainerRef.current.innerHTML = ''; } catch {}
        google.accounts.id.renderButton(buttonContainerRef.current, { theme: 'outline', size: 'large' });
        gisRenderedRef.current = true;
      }
    };

    if (!google) {
      const scriptId = 'google-identity-services';
      const existing = document.getElementById(scriptId);
      if (!existing) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderButton;
        document.head.appendChild(script);
      } else {
        existing.addEventListener('load', renderButton, { once: true });
      }
    } else {
      renderButton();
    }

    return () => {
      // Cleanup: clear container safely and allow re-render next time
      if (buttonContainerRef.current) {
        try { if (buttonContainerRef.current.isConnected) buttonContainerRef.current.innerHTML = ''; } catch {}
      }
      gisRenderedRef.current = false;
      successHandledRef.current = false;
    };
  }, [isOpen, googleClientId, isGoogleAllowedHere]);
  
  // จัดการการล็อกอิน
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginEmail || !loginPassword) {
      setLoginError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    
    const success = await login(loginEmail, loginPassword);
    if (success) {
      onClose();
      if (redirectAfterLogin) {
        window.location.href = redirectAfterLogin;
      }
    } else {
      setLoginError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };
  
  // จัดการการสมัครสมาชิก
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    
    if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword) {
      setRegisterError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    
    if (registerPassword.length < 6) {
      setRegisterError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      setRegisterError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    
    const success = await register(registerName, registerEmail, registerPassword);
    if (success) {
      onClose();
      if (redirectAfterLogin) {
        window.location.href = redirectAfterLogin;
      }
    } else {
      setRegisterError('ไม่สามารถสมัครสมาชิกได้ โปรดลองอีกครั้ง');
    }
  };
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white rounded-lg shadow-xl z-10 w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ส่วนหัว Modal */}
            <div className="flex border-b">
              <button
                className={`flex-1 py-3 font-medium ${
                  activeTab === 'login' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('login')}
              >
                เข้าสู่ระบบ
              </button>
              <button
                className={`flex-1 py-3 font-medium ${
                  activeTab === 'register' 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('register')}
              >
                สมัครสมาชิก
              </button>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
                aria-label="Close"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* ฟอร์มล็อกอิน */}
            {activeTab === 'login' && (
              <div className="p-6">
                <form onSubmit={handleLogin}>
                  {loginError && (
                    <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
                      {loginError}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      อีเมล
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสผ่าน
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <div className="mt-1 text-right">
                      <a href="#" className="text-xs text-indigo-600 hover:text-indigo-500">
                        ลืมรหัสผ่าน?
                      </a>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                  </button>
                  
                  {googleClientId && isGoogleAllowedHere && (
                    <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      {/* <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">หรือเข้าสู่ระบบด้วย</span>
                      </div> */}
                    </div>
                    
                    {/* <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="col-span-2 mb-2">
                        
                        <div ref={buttonContainerRef} className="flex justify-center"></div>
                      </div>
                    </div> */}
                    
                  </div>
                  )}
                </form>
              </div>
            )}
            
            {/* ฟอร์มสมัครสมาชิก */}
            {activeTab === 'register' && (
              <div className="p-6">
                <form onSubmit={handleRegister}>
                  {registerError && (
                    <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
                      {registerError}
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อผู้ใช้
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="ชื่อผู้ใช้"
                      autoComplete="name"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      อีเมล
                    </label>
                    <input
                      id="registerEmail"
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      รหัสผ่าน
                    </label>
                    <input
                      id="registerPassword"
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
                      autoComplete="new-password"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="registerConfirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      ยืนยันรหัสผ่าน
                    </label>
                    <input
                      id="registerConfirmPassword"
                      type="password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="ยืนยันรหัสผ่าน"
                      autoComplete="new-password"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                  </button>
                  
                  <p className="mt-4 text-xs text-gray-500 text-center">
                    การสมัครสมาชิกถือว่าคุณยอมรับ{' '}
                    <a href="/terms" className="text-indigo-600 hover:text-indigo-500">
                      เงื่อนไขการใช้งาน
                    </a>{' '}
                    และ{' '}
                    <a href="/privacy" className="text-indigo-600 hover:text-indigo-500">
                      นโยบายความเป็นส่วนตัว
                    </a>
                  </p>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}