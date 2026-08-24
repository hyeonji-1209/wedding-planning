import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // data/seed-shops.json(레포 루트)을 앱에서 import하기 위해 루트를 한 단계 올린다
  turbopack: { root: path.join(__dirname, "..") },
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    // 이미지 바이너리는 레포에 두지 않는다 — 원격 로더만 (.claude/rules/data.md)
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }, // 시드 폴백
      // Supabase Storage 비공개 버킷 — 서명 URL만 (src/data/catalog.ts)
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/sign/**" },
    ],
  },
};

export default nextConfig;
