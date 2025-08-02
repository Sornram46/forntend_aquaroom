// 'use client'
// import { useState, useEffect } from 'react'

// // SVG Icons components
// const SunIcon = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path 
//       strokeLinecap="round" 
//       strokeLinejoin="round" 
//       strokeWidth={2} 
//       d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
//     />
//   </svg>
// )

// const MoonIcon = ({ className }: { className?: string }) => (
//   <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path 
//       strokeLinecap="round" 
//       strokeLinejoin="round" 
//       strokeWidth={2} 
//       d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
//     />
//   </svg>
// )

// interface ThemeToggleProps {
//   className?: string;
//   showLabel?: boolean;
//   size?: 'sm' | 'md' | 'lg';
// }

// export default function ThemeToggle({ 
//   className = "", 
//   showLabel = false, 
//   size = 'md' 
// }: ThemeToggleProps) {
//   const [isDark, setIsDark] = useState(false)

//   useEffect(() => {
//     // ตรวจสอบธีมที่บันทึกไว้ใน localStorage
//     const savedTheme = localStorage.getItem('theme')
//     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
//     if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
//       setIsDark(true)
//       document.documentElement.classList.add('dark')
//     } else {
//       setIsDark(false)
//       document.documentElement.classList.remove('dark')
//     }
//   }, [])

//   const toggleTheme = () => {
//     const newTheme = !isDark
//     setIsDark(newTheme)
    
//     if (newTheme) {
//       document.documentElement.classList.add('dark')
//       localStorage.setItem('theme', 'dark')
//     } else {
//       document.documentElement.classList.remove('dark')
//       localStorage.setItem('theme', 'light')
//     }
//   }

//   // กำหนดขนาดตาม size prop
//   const sizeClasses = {
//     sm: 'p-1.5 w-4 h-4',
//     md: 'p-2 w-5 h-5', 
//     lg: 'p-3 w-6 h-6'
//   }

//   const iconSize = {
//     sm: 'w-4 h-4',
//     md: 'w-5 h-5',
//     lg: 'w-6 h-6'
//   }

//   return (
//     <button
//       onClick={toggleTheme}
//       className={`
//         inline-flex items-center gap-2 rounded-lg 
//         bg-gray-100 dark:bg-gray-700 
//         hover:bg-gray-200 dark:hover:bg-gray-600 
//         border border-gray-200 dark:border-gray-600
//         transition-all duration-300 
//         ${sizeClasses[size]} 
//         ${className}
//       `}
//       aria-label="เปลี่ยนธีม"
//       title={isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
//     >
//       <div className={`relative ${iconSize[size]}`}>
//         <SunIcon 
//           className={`absolute inset-0 text-yellow-500 transform transition-all duration-300 ${
//             isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
//           } ${iconSize[size]}`}
//         />
//         <MoonIcon 
//           className={`absolute inset-0 text-blue-400 transform transition-all duration-300 ${
//             isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
//           } ${iconSize[size]}`}
//         />
//       </div>
      
//       {showLabel && (
//         <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
//           {isDark ? 'สว่าง' : 'มืด'}
//         </span>
//       )}
//     </button>
//   )
// }