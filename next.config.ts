import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "supabase.ervia.tech",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
