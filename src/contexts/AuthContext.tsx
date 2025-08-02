'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  googleLogin: (credential: string) => Promise<boolean>;
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
  const refreshToken = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          localStorage.setItem('auth_token', data.token);
          setUser(data.user);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

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
  }, []);

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
    }, 5 * 60 * 1000); // ตรวจสอบทุก 5 นาที

    return () => clearInterval(interval);
  }, [user]);

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
  
  // ฟังก์ชัน Google Login
  const googleLogin = async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Google login failed:', data.message);
        return false;
      }
      
      // บันทึกข้อมูลผู้ใช้และ token
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
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
      
      const response = await fetch('/api/auth/update-profile', {
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