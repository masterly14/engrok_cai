import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Desactiva el linter de ESLint
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
