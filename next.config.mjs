/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material'],
  experimental: {
    optimizePackageImports: ['@mui/icons-material', '@mui/material'],
  },
};

export default nextConfig;
