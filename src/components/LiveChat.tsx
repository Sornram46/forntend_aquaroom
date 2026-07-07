'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // ปิดเมนูเมื่อคลิกนอก component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ⚙️ ตั้งค่า URL และเบอร์โทร
  const LINE_OA_URL = process.env.NEXT_PUBLIC_LINE_OA_URL ;
  const FACEBOOK_PAGE_ID = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID || '';
  const PHONE_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '0812345678';

  const handleLineChat = () => {
    window.open(LINE_OA_URL, '_blank');
  };

  const handleFacebookChat = () => {
    if (FACEBOOK_PAGE_ID) {
      window.open(`https://m.me/${FACEBOOK_PAGE_ID}`, '_blank');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50" ref={chatRef}>
      <div className="relative">
        {/* Chat Menu */}
        {isOpen && (
          <div className="absolute bottom-14 md:bottom-16 right-0 mb-3 flex flex-col items-end gap-3 md:gap-4 animate-slide-up">
            <button
              onClick={handleLineChat}
              className="group/line flex items-center gap-2 text-[#06C755] transition-all duration-300 hover:-translate-y-0.5"
              aria-label="Open Line chat"
            >
              <div className="text-right leading-tight">
                <p className="text-xs md:text-sm font-semibold text-gray-700">Line Official</p>
                <p className="text-[11px] md:text-xs text-gray-500">แชทผ่าน Line ตอบไว</p>
              </div>
              <span className="relative h-9 w-9 md:h-10 md:w-10 drop-shadow-[0_8px_16px_rgba(6,199,85,0.22)] transition-transform duration-300 group-hover/line:scale-110">
                <Image
                  src="/image/line.png"
                  alt="Line Official"
                  fill
                  className="object-contain"
                />
              </span>
            </button>

            <a
              href={`tel:${PHONE_NUMBER}`}
              className="group/phone flex items-center gap-2 text-indigo-600 transition-all duration-300 hover:-translate-y-0.5"
              aria-label="Call support"
            >
              <div className="text-right leading-tight">
                <p className="text-xs md:text-sm font-semibold text-gray-700">โทรหาเรา</p>
                <p className="text-[11px] md:text-xs text-gray-500">{PHONE_NUMBER}</p>
              </div>
              <span className="text-3xl md:text-4xl drop-shadow-[0_8px_16px_rgba(79,70,229,0.22)] transition-transform duration-300 group-hover/phone:scale-110">
                📞
              </span>
            </a>

            {FACEBOOK_PAGE_ID && (
              <button
                onClick={handleFacebookChat}
                className="group/facebook flex items-center gap-2 text-sky-600 transition-all duration-300 hover:-translate-y-0.5"
                aria-label="Open Facebook chat"
              >
                <div className="text-right leading-tight">
                  <p className="text-xs md:text-sm font-semibold text-gray-700">Facebook</p>
                  <p className="text-[11px] md:text-xs text-gray-500">ทักผ่าน Messenger</p>
                </div>
                <span className="text-3xl md:text-4xl drop-shadow-[0_8px_16px_rgba(14,165,233,0.22)] transition-transform duration-300 group-hover/facebook:scale-110">
                  💬
                </span>
              </button>
            )}
          </div>
        )}

        {/* Main Chat Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${
            isOpen 
              ? 'bg-transparent text-gray-700' 
              : 'bg-transparent text-indigo-600'
          } rounded-full p-1 md:p-2 transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none relative group`}
          aria-label="Open live chat"
        >
          <span className="text-3xl md:text-4xl relative z-10 drop-shadow-[0_10px_20px_rgba(79,70,229,0.18)]">
            {isOpen ? '✕' : '💬'}
          </span>
          
          {/* Online Badge */}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 flex h-4 w-4 md:h-5 md:w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 md:h-5 md:w-5 bg-green-500 border-2 border-white shadow-md"></span>
            </span>
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="hidden md:block absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform group-hover:translate-y-[-4px]">
            <div className="bg-gray-900 text-white text-sm py-2.5 px-5 rounded-xl whitespace-nowrap shadow-2xl">
              💬 มีคำถาม? แชทกับเรา!
              <div className="absolute bottom-0 right-8 transform translate-y-1/2 rotate-45 w-2.5 h-2.5 bg-gray-900"></div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}