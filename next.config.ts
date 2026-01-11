import type { NextConfig } from "next";

const imageHost = process.env.IMAGE_REMOTE_HOST || "localhost";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: imageHost,
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: imageHost,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
