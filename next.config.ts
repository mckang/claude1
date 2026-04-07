import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/claude1",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
