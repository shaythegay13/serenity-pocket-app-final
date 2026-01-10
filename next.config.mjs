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
  trailingSlash: false,
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
  // Fix cross-origin request warning in development
  allowedDevOrigins: ['127.0.0.1:3000', 'localhost:3000'],
};

export default nextConfig;
