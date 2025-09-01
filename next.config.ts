import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  eslint: {
    // ชั่วคราว: ข้ามการตรวจ lint ตอน build (ไม่แนะนำให้ใช้ถาวร)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
