const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.analyze === 'true',
})

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ignore TypeScript errors during production builds
  typescript: {
    // !! WARN !!
    // Ignoring type checking for build, 
    // but this does NOT affect type checking during development
    ignoreBuildErrors: true,
  },
  
  // Increase the body size limit for Server Actions to handle large CSV imports (up to 50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    },
    // Optimize navigation reliability with optimistic navigation
    optimizeCss: false, // Disable optimizeCss until critters is fixed
    optimisticClientCache: true,
    scrollRestoration: true,
  },
  
  // ESLint configuration - disable accessibility warnings
  eslint: {
    // Your Next.js build will not fail due to ESLint errors
    ignoreDuringBuilds: true,
    dirs: ['pages', 'components', 'app', 'utils', 'lib']
  },

  // Configure server settings
  serverRuntimeConfig: {
    maxBodySize: '50mb',
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

// Add webpack alias for '@' to resolve to project root
nextConfig.webpack = (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname),
    '@/lib/supabase$': path.resolve(__dirname, 'lib/supabase.ts'),
  };
  return config;
};

module.exports = withBundleAnalyzer(nextConfig);
