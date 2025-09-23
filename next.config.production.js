/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production environment settings
  env: {
    BUILD_TIMESTAMP: Date.now().toString(),
    BUILD_ID: `production-build-${Date.now()}`,
  },
  
  // Ensure Prisma client is properly generated
  serverExternalPackages: ['@prisma/client'],
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Disable strict checks during build for production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Production output
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: ['localhost'],
    unoptimized: false,
  },
};

module.exports = nextConfig;
