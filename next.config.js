/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/manga-images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/manga-covers/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Minimal config to prevent stack overflow
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Exclude native binaries from client-side bundle
    // These are only used in API routes (server-side)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Ignore native binary files (.node files) from webpack bundling
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });

    // Exclude sharp and onnxruntime-node native binaries
    config.externals = config.externals || [];
    config.externals.push({
      'sharp': 'commonjs sharp',
      'onnxruntime-node': 'commonjs onnxruntime-node',
    });

    // Ignore specific problematic modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@xenova/transformers/node_modules/sharp': false,
      'onnxruntime-node': false,
    };

    return config;
  },
}

module.exports = nextConfig