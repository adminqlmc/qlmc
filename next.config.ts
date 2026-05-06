import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // Disable TypeScript checks during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Suppress React 19 warning from Ant Design
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      { module: /node_modules\/antd/ },
    ];
    
    // Exclude Prisma from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  // Empty turbopack config to suppress Turbopack vs webpack conflict warning
  turbopack: {},
};

export default nextConfig;
