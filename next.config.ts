import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iehcoikvflnhwtehfrhw.supabase.co',
      },
    ],
  },
};

export default nextConfig;