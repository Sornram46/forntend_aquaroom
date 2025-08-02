'use client';

import { useEffect } from 'react';

export default function ScrollAnimation() {
  useEffect(() => {
    // ตรวจสอบว่าอยู่ในฝั่ง client หรือไม่
    if (typeof window === 'undefined') return;

    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Add staggered animation for child elements
          const staggeredElements = entry.target.querySelectorAll('[class*="scroll-stagger"]');
          staggeredElements.forEach((el, index) => {
            setTimeout(() => {
              (el as HTMLElement).classList.add('visible');
            }, index * 100);
          });
        }
      });
    }, observerOptions);

    // Observe all elements with scroll animation classes
    const animatedElements = document.querySelectorAll(
      '.scroll-animate, .scroll-fade, .scroll-slide-up, .scroll-slide-left, .scroll-slide-right, .scroll-scale'
    );
    
    animatedElements.forEach(el => {
      observer.observe(el);
    });

    // Cleanup
    return () => {
      if (observer) {
        animatedElements.forEach(el => {
          observer.unobserve(el);
        });
        observer.disconnect();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
