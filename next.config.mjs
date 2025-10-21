/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // เปิดใช้ขนาดมาตรฐานที่มี 1080
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Backend ของคุณ
      { protocol: 'https', hostname: 'backend-aquaroom.vercel.app', pathname: '/**' },
      // รูปจาก Supabase (public bucket)
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
      // รูปบัญชี Google (ถ้ามี)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
  async headers() {
    return [
      {
        // ผ่อนทั้งไซต์ หรือเปลี่ยนเป็นเฉพาะ /login ถ้าต้องการ
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          // อย่าตั้ง COEP=require-corp ถ้าใช้ popup ของ Google
        ],
      },
    ];
  },
};

export default nextConfig;