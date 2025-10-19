/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qetuivlvofhxkwwatemu.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // สำรอง: รองรับโปรเจ็กต์ Supabase อื่นๆ ด้วย (ถ้าไม่ต้องการ ลบได้)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
       { protocol: 'https', hostname: 'backend-aquaroom.vercel.app', pathname: '/**' },
      { protocol: 'https', hostname: 'qetuivlvofhxkwwatemu.supabase.co', pathname: '/**' },
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