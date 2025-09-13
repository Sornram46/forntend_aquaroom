/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }, // ชั่วคราว
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'backend-aquaroom.vercel.app' },
      { protocol: 'https', hostname: 'ympuahmkqiwuvnrqbqqe.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;