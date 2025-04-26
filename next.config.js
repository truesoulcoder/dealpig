const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.analyze === 'true',
})

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
  
  // Increase the body size limit for Server Actions to handle large CSV imports (up to 5000 records)
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb'
    },
    // Optimize navigation reliability with optimistic navigation
    optimizeCss: true,
    optimisticClientCache: true,
    scrollRestoration: true,
  },
  
  // ESLint configuration - disable accessibility warnings
  eslint: {
    // Your Next.js build will not fail due to ESLint errors
    ignoreDuringBuilds: true,
    dirs: ['pages', 'components', 'app', 'utils', 'lib']
  },
  
  // Enhance client-side navigation
  swcMinify: true,
};

module.exports = withBundleAnalyzer(nextConfig);
