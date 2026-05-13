import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
