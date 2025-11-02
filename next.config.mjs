/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable static export for mobile app builds
  output: process.env.BUILD_MODE === 'mobile' ? 'export' : undefined,
  // Disable trailing slashes for better mobile compatibility
  trailingSlash: true,
}

export default nextConfig