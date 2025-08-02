'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  category: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  
  // เพิ่มคูปอง
  appliedCoupon: string | null;
  discount: number;
  applyCoupon: (code: string, discountAmount: number) => void;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // เพิ่ม state สำหรับคูปอง
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  // โหลดข้อมูลจาก localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedCoupon = localStorage.getItem('appliedCoupon');
    const savedDiscount = localStorage.getItem('discount');
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing saved cart:', error);
      }
    }
    
    if (savedCoupon) {
      setAppliedCoupon(savedCoupon);
    }
    
    if (savedDiscount) {
      setDiscount(Number(savedDiscount));
    }
  }, []);

  // บันทึกข้อมูลลง localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', appliedCoupon);
    } else {
      localStorage.removeItem('appliedCoupon');
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (discount > 0) {
      localStorage.setItem('discount', discount.toString());
    } else {
      localStorage.removeItem('discount');
    }
  }, [discount]);

  // ⭐ เพิ่มฟังก์ชันที่ขาดหายไป
  
  // เพิ่มสินค้าเข้าตะกร้า
  const addToCart = (product: CartItem) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // ถ้ามีสินค้าอยู่แล้ว ให้เพิ่มจำนวน
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      } else {
        // ถ้าไม่มี ให้เพิ่มสินค้าใหม่
        return [...prevItems, product];
      }
    });
  };

  // ลบสินค้าออกจากตะกร้า
  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // อัปเดตจำนวนสินค้า
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // ฟังก์ชันจัดการคูปอง
  const applyCoupon = (code: string, discountAmount: number) => {
    setAppliedCoupon(code);
    setDiscount(discountAmount);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
  };

  // แก้ไขฟังก์ชัน clearCart
  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setDiscount(0);
  };
  
  // คำนวณราคารวม
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  // นับจำนวนรายการในตะกร้า
  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };
  
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    appliedCoupon,
    discount,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ฟังก์ชัน hook สำหรับใช้ CartContext
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};