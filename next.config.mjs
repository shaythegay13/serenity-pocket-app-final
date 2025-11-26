/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // External packages for server components (prevents bundling issues)
  serverExternalPackages: [
    '@modelcontextprotocol/sdk',
    '@vercel/mcp-adapter',
  ],
  // Experimental features
  experimental: {
    // Allow server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig