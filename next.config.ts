import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isGithubPages = process.env.GITHUB_ACTIONS === "true";
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  ...(isGithubPages && {
    output: "export",
    basePath: "/claude1",
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  // GitHub Pages (정적 export) 빌드와 dev 모드에서는 SW 비활성화
  disable: isGithubPages || isDev,
  cacheOnFrontEndNav: true,
  workboxOptions: {
    // SW 등록 시 즉시 새 버전 활성화
    skipWaiting: true,
    clientsClaim: true,
  },
});

export default withPWA(nextConfig);
