import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Desactiva el linter de ESLint
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
