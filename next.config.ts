import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.cdrcfc.com.cn",
      },
      {
        protocol: "https",
        hostname: "cdn.cdrcfc.com.cn",
      },
    ],
  },
};

export default nextConfig;
