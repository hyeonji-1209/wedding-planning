// catalog.ts의 순수 부분 — 네트워크·env 없이 테스트한다.

import type { DressAttributes, DressImage, Shop } from "@/lib/taste/types";

/** spec 화면 2: 스와이프 25장 */
export const DECK_SIZE = 25;

/** scripts/ingest.ts의 TaggedRow와 같은 모양 (그쪽이 원본) */
export type TaggedRow = {
  id: string;
  shopHandle: string;
  storagePath: string;
  sourceUrl: string;
  credit: string;
  taggedBy: string;
  attrs: DressAttributes;
};

/** data/seed-shops.json의 shops[] 한 행 */
export type ShopSeed = {
  name: string;
  handle: string | null;
  official_url: string | null;
  instagram: string | null;
  region?: string | null;
  status?: string;
};

/** 수집이 끝난(handle 있는) 샵만 앱의 Shop으로. 공식 사이트가 없으면 인스타가 곧 홈페이지다 (docs/kickoff.md). */
export function shopsFromSeed(seeds: ShopSeed[]): Shop[] {
  return seeds
    .filter((s): s is ShopSeed & { handle: string } => Boolean(s.handle) && s.status === "collected")
    .map((s) => ({
      id: s.handle,
      name: s.name,
      region: s.region ?? "서울",
      officialUrl: s.official_url ?? s.instagram ?? null,
    }));
}

export function toDressImage(row: TaggedRow, shop: Shop, src: string): DressImage {
  const isInstagram = /instagram\.com/.test(row.sourceUrl);
  return {
    id: row.id,
    shopId: shop.id,
    src,
    sourceLabel: isInstagram ? "Instagram" : shop.name,
    sourceUrl: row.sourceUrl,
    credit: row.credit,
    attrs: row.attrs,
    taggedBy: row.taggedBy,
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 덱 샘플링 — 샵별로 섞은 뒤 라운드로빈으로 뽑아 한 샵이 덱을 독식하지 않게 한다.
 * 전체가 size보다 적으면 전부 (섞어서) 보여준다.
 */
export function pickDeck(images: DressImage[], random: () => number, size = DECK_SIZE): DressImage[] {
  const byShop = new Map<string, DressImage[]>();
  for (const img of images) {
    byShop.set(img.shopId, [...(byShop.get(img.shopId) ?? []), img]);
  }
  const queues = shuffle([...byShop.values()].map((q) => shuffle(q, random)), random);

  const picked: DressImage[] = [];
  const target = Math.min(size, images.length);
  while (picked.length < target) {
    for (const q of queues) {
      const next = q.shift();
      if (next) picked.push(next);
      if (picked.length >= target) break;
    }
  }
  return shuffle(picked, random);
}
