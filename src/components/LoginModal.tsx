'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectAfterLogin?: string;
}

export default function LoginModal({ isOpen, onClose, redirectAfterLogin }: LoginModalProps) {
  const { login, register, googleLogin, isLoading } = useAuth(); // เพิ่ม googleLogin
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
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
                  
                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">หรือเข้าสู่ระบบด้วย</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="col-span-2 mb-2">
                        <GoogleLogin
                          onSuccess={(credentialResponse) => {
                            if (credentialResponse.credential) {
                              googleLogin(credentialResponse.credential).then((success) => {
                                if (success) {
                                  onClose();
                                  if (redirectAfterLogin) {
                                    window.location.href = redirectAfterLogin;
                                  }
                                }
                              });
                            }
                          }}
                          onError={() => {
                            console.log('เข้าสู่ระบบด้วย Google ล้มเหลว');
                          }}
                          useOneTap
                          size="large"
                          width="100%"
                          text="continue_with"
                          locale="th"
                        />
                      </div>
                      <button
                        type="button"
                        className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.545,10.239v3.818h5.556c-0.451,2.562-2.832,4.552-5.556,4.552c-3.032,0-5.5-2.466-5.5-5.5s2.468-5.5,5.5-5.5c1.745,0,3.332,0.81,4.5,2.18l2.9-2.282C18.177,5.276,15.247,3.5,12.545,3.5c-4.418,0-8,3.582-8,8s3.582,8,8,8c4.837,0,8.068-3.356,8.068-8.076c0-0.553-0.053-1.093-0.166-1.613H12.545z" />
                        </svg>
                        Google
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.675 0H1.325C0.593 0 0 0.593 0 1.325v21.351C0 23.407 0.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463 0.099 2.795 0.143v3.24l-1.918 0.001c-1.504 0-1.795 0.715-1.795 1.763v2.313h3.587l-0.467 3.622h-3.12V24h6.116c0.73 0 1.323-0.593 1.323-1.325V1.325C24 0.593 23.407 0 22.675 0z" />
                        </svg>
                        Facebook
                      </button>
                    </div>
                  </div>
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