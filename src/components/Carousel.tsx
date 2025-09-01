'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface CarouselItem {
  id: number;
  title: string;
  subtitle: string;
  image: string;
   buttonText?: string;  // เพิ่มฟิลด์นี้
  buttonUrl?: string;   // เพิ่มฟิลด์นี้
}

interface HomepageSettings {
  carousel_1_title?: string;
  carousel_1_subtitle?: string;
  carousel_1_image?: string;
  carousel_1_button_text?: string;  // เพิ่มฟิลด์นี้
  carousel_1_button_url?: string;   // เพิ่มฟิลด์นี้
  carousel_2_title?: string;
  carousel_2_subtitle?: string;
  carousel_2_image?: string;
  carousel_2_button_text?: string;  // เพิ่มฟิลด์นี้
  carousel_2_button_url?: string;   // เพิ่มฟิลด์นี้
  carousel_3_title?: string;
  carousel_3_subtitle?: string;
  carousel_3_image?: string;
  carousel_3_button_text?: string;  // เพิ่มฟิลด์นี้
  carousel_3_button_url?: string;   // เพิ่มฟิลด์นี้
}

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    async function fetchCarouselData() {
      try {
        const response = await fetch('/api/homepage-setting');
        const data: HomepageSettings = await response.json();
        
        // สร้าง carousel items จากข้อมูลที่ดึงมา
        const items: CarouselItem[] = [];
        
        // เพิ่ม carousel items เฉพาะที่มีข้อมูล
        if (data.carousel_1_image && data.carousel_1_title) {
          items.push({
            id: 1,
            title: data.carousel_1_title,
            subtitle: data.carousel_1_subtitle || '',
            image: data.carousel_1_image,
            buttonText: data.carousel_1_button_text || 'เริ่มช็อปปิ้ง',
            buttonUrl: data.carousel_1_button_url || '/products'
          });
        }
        
        if (data.carousel_2_image && data.carousel_2_title) {
          items.push({
            id: 2,
            title: data.carousel_2_title,
            subtitle: data.carousel_2_subtitle || '',
            image: data.carousel_2_image,
            buttonText: data.carousel_2_button_text || 'เริ่มช็อปปิ้ง',
            buttonUrl: data.carousel_2_button_url || '/products'
          });
        }
        
        if (data.carousel_3_image && data.carousel_3_title) {
          items.push({
            id: 3,
            title: data.carousel_3_title,
            subtitle: data.carousel_3_subtitle || '',
            image: data.carousel_3_image,
            buttonText: data.carousel_3_button_text || 'เริ่มช็อปปิ้ง',
            buttonUrl: data.carousel_3_button_url || '/products'
          });
        }
        
        // ถ้าไม่มีข้อมูล carousel ให้ใช้ข้อมูลเริ่มต้น
        if (items.length === 0) {
          items.push(
            {
              id: 1,
              title: 'ยินดีต้อนรับสู่ AquaRoom',
              subtitle: 'ร้านค้าออนไลน์ที่มีสินค้าคุณภาพดี',
              image: '/images/carousel-1.jpg',
              buttonText: 'เริ่มช็อปปิ้ง',
              buttonUrl: '/products'
            },
            {
              id: 2,
              title: 'สินค้าคุณภาพเยี่ยม',
              subtitle: 'คัดสรรมาเป็นพิเศษเพื่อคุณ',
              image: '/images/carousel-2.jpg',
              buttonText: 'เริ่มช็อปปิ้ง',
              buttonUrl: '/products'
            },
            {
              id: 3,
              title: 'จัดส่งรวดเร็ว',
              subtitle: 'ถึงมือคุณภายใน 1-3 วันทำการ',
              image: '/images/carousel-3.jpg',
              buttonText: 'เริ่มช็อปปิ้ง',
              buttonUrl: '/products'
            }
          );
        }
        
        setCarouselItems(items);
      } catch (error) {
        console.error('Error fetching carousel data:', error);
        // ใช้ข้อมูลเริ่มต้น
        setCarouselItems([
          {
            id: 1,
            title: 'ยินดีต้อนรับสู่ AquaRoom',
            subtitle: 'ร้านค้าออนไลน์ที่มีสินค้าคุณภาพดี',
            image: '/images/carousel-1.jpg',
            buttonText: 'เริ่มช็อปปิ้ง',
            buttonUrl: '/products'
          },
          {
            id: 2,
            title: 'สินค้าคุณภาพเยี่ยม',
            subtitle: 'คัดสรรมาเป็นพิเศษเพื่อคุณ',
            image: '/images/carousel-2.jpg',
            buttonText: 'เริ่มช็อปปิ้ง',
            buttonUrl: '/products'
          },
          {
            id: 3,
            title: 'จัดส่งรวดเร็ว',
            subtitle: 'ถึงมือคุณภายใน 1-3 วันทำการ',
            image: '/images/carousel-3.jpg',
            buttonText: 'เริ่มช็อปปิ้ง',
            buttonUrl: '/products'
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchCarouselData();
  }, []);

  // Auto slide - เลื่อนอัตโนมัติทุก 5 วินาที
  useEffect(() => {
    if (carouselItems.length === 0 || isHovered) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [carouselItems.length, isHovered]);

  // ฟังก์ชันเปลี่ยน slide ด้วยตนเอง
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (loading) {
    return (
      <div className="relative h-screen w-full bg-gray-200 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  if (carouselItems.length === 0) {
    return null;
  }

  return (
    <div 
      className="relative h-screen w-full overflow-hidden bg-gray-900 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image
            src={carouselItems[currentSlide].image}
            alt={carouselItems[currentSlide].title}
            fill
            style={{ objectFit: 'cover' }}
            className="w-full h-full"
            priority={currentSlide === 0}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="max-w-4xl mx-auto text-white"
              >
               <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
                {carouselItems[currentSlide].title}
              </h1>
                <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl mb-10 opacity-90 font-light">
                {carouselItems[currentSlide].subtitle}
              </p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="flex flex-col sm:flex-row gap-6 justify-center"
                >
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-base font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl">
                    เริ่มช็อปปิ้ง
                  </button>
                
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator - สำหรับเปลี่ยน slide ด้วยตนเอง */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-3">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Slide counter */}
      <div className="absolute top-8 right-8 bg-black/40 text-white px-4 py-2 rounded-full text-lg backdrop-blur-sm">
        {currentSlide + 1} / {carouselItems.length}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white opacity-60">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">เลื่อนลง</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* เพิ่ม dark mode classes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-colors duration-300">
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">
            {/* ...existing content... */}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {/* ...existing content... */}
          </p>
        </div>
      </div>
    </div>
  );
}