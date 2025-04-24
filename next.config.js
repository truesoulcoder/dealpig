const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
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
};

module.exports = withBundleAnalyzer(nextConfig);
