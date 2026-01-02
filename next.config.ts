import type { NextConfig } from "next";

const imageHost = process.env.IMAGE_REMOTE_HOST || "gc.lumejs.com";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: imageHost,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
