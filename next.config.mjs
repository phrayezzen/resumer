/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for large PDFs
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Handle Node.js modules for pdf-parse
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
