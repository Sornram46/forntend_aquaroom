'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import Swal from 'sweetalert2';

// นิยามรูปแบบข้อมูลผู้ใช้
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// นิยามข้อมูลสำหรับ context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  googleLogin: () => void;
  logout: () => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
  refreshToken: () => Promise<boolean>; // เพิ่มฟังก์ชันนี้
}

// สร้าง context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook สำหรับเข้าถึง context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth ต้องใช้ภายใน AuthProvider');
  }
  return context;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // ตรวจสอบและรีเฟรช token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      // include stored token in Authorization header
      const storedToken = localStorage.getItem('auth_token') || getCookie('ar_session') || getCookie('ar_token') || '';
      const headers: Record<string, string> = {};
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      const res = await fetch('/api/auth/refresh', { method: 'POST', headers, credentials: 'include' });
      if (res.status === 404) return false; // ไม่มี endpoint -> ให้ logout
      if (!res.ok) return false;
      const j = await res.json();
      const newToken = j?.token || j?.accessToken || '';
      const returnedUser = j?.user || j?.data?.user || null;
      if (newToken) {
        localStorage.setItem('auth_token', newToken);
        if (returnedUser) {
          try { localStorage.setItem('ar_user', JSON.stringify(returnedUser)); } catch {}
          setUser(returnedUser);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('refreshToken failed', e);
      return false;
    }
  }, []);

  // โหลดข้อมูลผู้ใช้จาก token
  useEffect(() => {
    const loadUserFromToken = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('auth_token');
          }
        } else if (response.status === 401) {
          // Token หมดอายุ - ลองรีเฟรช
          console.log('Token expired, trying to refresh...');
          const refreshSuccess = await refreshToken();
          
          if (!refreshSuccess) {
            // รีเฟรชไม่สำเร็จ - ลบ token และแจ้งเตือน
            localStorage.removeItem('auth_token');
            
            // แจ้งเตือนผู้ใช้ (ถ้าไม่ใช่หน้า login)
            if (!window.location.pathname.includes('/login') && 
                !window.location.pathname.includes('/register')) {
              Swal.fire({
                title: 'เซสชันหมดอายุ',
                text: 'กรุณาเข้าสู่ระบบใหม่',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                allowOutsideClick: false
              }).then(() => {
                // นำทางไปหน้า login
                window.location.href = '/login';
              });
            }
          }
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromToken();
  }, [refreshToken]);

  // ตั้งค่า interval เพื่อตรวจสอบ token แบบ auto
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // ตรวจสอบว่า token ยังใช้ได้อยู่หรือไม่
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.status === 401) {
            // ลองรีเฟรช token
            const refreshSuccess = await refreshToken();
            if (!refreshSuccess) {
              // รีเฟรชไม่สำเร็จ - logout
              await logout();
              Swal.fire({
                title: 'เซสชันหมดอายุ',
                text: 'กรุณาเข้าสู่ระบบใหม่',
                icon: 'warning',
                confirmButtonText: 'ตกลง'
              });
            }
          }
        } catch (error) {
          console.error('Token check failed:', error);
        }
      }
    }, 30 * 60 * 1000); // เปลี่ยนเป็นตรวจสอบทุก 30 นาที

    return () => clearInterval(interval);
  }, [user, refreshToken]);

  // ฟังก์ชันล็อกอิน
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Login failed:', data.message);
        return false;
      }
      
      // บันทึกข้อมูลผู้ใช้และ token
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // ฟังก์ชันสมัครสมาชิก
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Registration failed:', data.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // ฟังก์ชัน Google Login: แนบ next ให้กลับมาหน้าเดิม/ตะกร้า
  const googleLogin = () => {
    const next = encodeURIComponent('/cart');
    window.location.assign(`/api/auth/google?next=${next}`);
  };

  // ฟังก์ชันล็อกเอาท์
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('ar_token');
      localStorage.removeItem('user');
      localStorage.removeItem('ar_user');
      document.cookie = 'ar_session=; Max-Age=0; path=/';
      document.cookie = 'ar_token=; Max-Age=0; path=/';
      document.cookie = 'ar_user=; Max-Age=0; path=/';
      setUser(null);
    }
  };

  // ฟังก์ชันอัปเดตข้อมูลผู้ใช้
  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        return false;
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return false;
      }
      
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // helper อ่าน cookie
  function getCookie(name: string) {
    if (typeof document === 'undefined') return '';
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  // บูตจาก cookie/localStorage หลังโหลดครั้งแรก (แก้ setIsAuthenticated ที่ไม่มี)
  useEffect(() => {
    try {
      const token =
        getCookie('ar_session') ||
        getCookie('ar_token') ||
        localStorage.getItem('auth_token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        '';
      const userJson =
        getCookie('ar_user') ||
        localStorage.getItem('ar_user') ||
        localStorage.getItem('user') ||
        '';
      const u = userJson ? JSON.parse(userJson) : null;

      if (token) {
        // sync ให้ flow verify ด้านบนใช้ได้
        localStorage.setItem('auth_token', token);
        setUser(u);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      googleLogin,
      logout,
      updateUserProfile,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}