import { describe, expect, it } from "vitest";

import type { DressImage } from "@/lib/taste/types";
import { DRESS_IMAGES } from "./seed";
import { DECK_SIZE, pickDeck, shopsFromSeed, toDressImage } from "./catalog-core";

// 결정적 PRNG — 테스트가 흔들리지 않게
function lcg(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

function fakeImages(perShop: Record<string, number>): DressImage[] {
  const base = DRESS_IMAGES[0];
  return Object.entries(perShop).flatMap(([shopId, n]) =>
    Array.from({ length: n }, (_, i) => ({ ...base, id: `${shopId}/${i}`, shopId })),
  );
}

describe("pickDeck", () => {
  it("25장을 중복 없이 뽑는다", () => {
    const deck = pickDeck(fakeImages({ a: 30, b: 30, c: 30 }), lcg(1));
    expect(deck).toHaveLength(DECK_SIZE);
    expect(new Set(deck.map((d) => d.id)).size).toBe(DECK_SIZE);
  });

  it("샵을 골고루 섞는다 — 한 샵이 덱을 독식하지 않는다", () => {
    const deck = pickDeck(fakeImages({ a: 100, b: 10, c: 10 }), lcg(2));
    const count = (shop: string) => deck.filter((d) => d.shopId === shop).length;
    expect(count("b")).toBeGreaterThanOrEqual(8);
    expect(count("c")).toBeGreaterThanOrEqual(8);
    expect(count("a")).toBeLessThanOrEqual(9);
  });

  it("전체가 25장 미만이면 전부 보여준다", () => {
    const deck = pickDeck(fakeImages({ a: 3, b: 2 }), lcg(3));
    expect(deck).toHaveLength(5);
  });
});

describe("shopsFromSeed", () => {
  it("handle 없는 후보 샵은 제외, 공식 사이트가 없으면 인스타를 링크로", () => {
    const shops = shopsFromSeed([
      { name: "A", handle: "a", official_url: "https://a.com", instagram: null, region: "청담", status: "collected" },
      { name: "B", handle: "b", official_url: null, instagram: "https://www.instagram.com/b/", status: "collected" },
      { name: "C", handle: null, official_url: "https://c.com", instagram: null, status: "candidate" },
    ]);
    expect(shops.map((s) => s.id)).toEqual(["a", "b"]);
    expect(shops[0]).toMatchObject({ region: "청담", officialUrl: "https://a.com" });
    expect(shops[1]).toMatchObject({ region: "서울", officialUrl: "https://www.instagram.com/b/" });
  });
});

describe("toDressImage", () => {
  it("출처 URL·계정을 그대로 싣고, 인스타 출처는 라벨을 Instagram으로", () => {
    const shop = { id: "b", name: "비", region: "서울", officialUrl: null };
    const row = {
      id: "b/1",
      shopHandle: "b",
      storagePath: "b/1.jpg",
      sourceUrl: "https://www.instagram.com/b/",
      credit: "@b",
      taggedBy: "claude-opus-5",
      attrs: DRESS_IMAGES[0].attrs,
    };
    const img = toDressImage(row, shop, "https://x.supabase.co/signed");
    expect(img).toMatchObject({ src: "https://x.supabase.co/signed", sourceLabel: "Instagram", credit: "@b" });
    expect(toDressImage({ ...row, sourceUrl: "https://b.com" }, shop, "u").sourceLabel).toBe("비");
  });
});
