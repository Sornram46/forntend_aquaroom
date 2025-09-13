/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'backend-aquaroom.vercel.app' },
      { protocol: 'https', hostname: 'ympuahmkqiwuvnrqbqqe.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // (ออปชั่น) proxy ฝั่ง client ให้ /api/* ไป backend
  async rewrites() {
    const base = process.env.BACKEND_URL || 'https://backend-aquaroom.vercel.app';
    return [{ source: '/api/:path*', destination: `${base}/api/:path*` }];
  },
};

export default nextConfig;