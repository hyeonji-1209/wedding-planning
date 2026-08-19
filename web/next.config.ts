import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 이미지 바이너리는 레포·스토리지에 두지 않는다 — 원격 로더만 (.claude/rules/data.md)
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
