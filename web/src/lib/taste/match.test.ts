import { describe, expect, it } from "vitest";
import { matchShops } from "./match";
import { buildProfile } from "./profile";
import type { DressAttributes, DressImage, Reaction, Shop } from "./types";

function img(id: string, shopId: string, over: Partial<DressAttributes>): DressImage {
  return {
    id,
    shopId,
    src: `/x/${id}.jpg`,
    sourceLabel: "test",
    taggedBy: "human",
    attrs: {
      silhouette: "a-line",
      neckline: "straight",
      fabric: "tulle",
      sleeve: "none",
      back: "covered",
      tone: "ivory",
      embellishment: 0.5,
      volume: 0.5,
      shine: 0.5,
      mood: { modern: 0.25, romantic: 0.25, classic: 0.25, bold: 0.25 },
      rationale: `근거-${id}`,
      ...over,
    },
  };
}

const mermaid: Partial<DressAttributes> = {
  silhouette: "mermaid",
  fabric: "lace",
  volume: 0.15,
  mood: { modern: 0.5, romantic: 0.2, classic: 0.2, bold: 0.1 },
};
const ballgown: Partial<DressAttributes> = {
  silhouette: "ballgown",
  fabric: "mikado",
  volume: 0.95,
  shine: 0.8,
  mood: { modern: 0.1, romantic: 0.2, classic: 0.5, bold: 0.2 },
};

const shops: Shop[] = [
  { id: "slim", name: "슬림샵", region: "청담", officialUrl: null },
  { id: "ball", name: "볼륨샵", region: "서초", officialUrl: null },
  { id: "outlier", name: "아웃라이어샵", region: "논현", officialUrl: null },
];

// slim: 머메이드 6장. ball: 벨라인 6장.
// outlier: 완벽한 머메이드 1장 + 정반대 벨라인 5장 → 상위 5장 평균이면 slim을 못 이겨야 한다.
const images: DressImage[] = [
  ...Array.from({ length: 6 }, (_, i) => img(`s${i}`, "slim", mermaid)),
  ...Array.from({ length: 6 }, (_, i) => img(`b${i}`, "ball", ballgown)),
  img("o0", "outlier", mermaid),
  ...Array.from({ length: 5 }, (_, i) => img(`o${i + 1}`, "outlier", ballgown)),
];

const deckIds = ["s0", "s1", "b0", "o0"];
const reactions: Reaction[] = [
  { imageId: "s0", reaction: "like" },
  { imageId: "s1", reaction: "like" },
  { imageId: "o0", reaction: "like" },
  { imageId: "b0", reaction: "pass" },
];

describe("matchShops", () => {
  const deck = images.filter((i) => deckIds.includes(i.id));
  const profile = buildProfile(reactions, deck)!;
  const results = matchShops(profile, images, shops);

  it("취향과 같은 계열 샵이 1위다", () => {
    expect(results[0].shop.id).toBe("slim");
  });

  it("아웃라이어 1장으로는 일관된 샵을 이길 수 없다 (상위 5장 평균)", () => {
    const slim = results.find((r) => r.shop.id === "slim")!;
    const outlier = results.find((r) => r.shop.id === "outlier")!;
    expect(slim.matchPct).toBeGreaterThan(outlier.matchPct);
  });

  it("모든 추천에 이유가 1개 이상 붙는다 — 점수만 뱉는 추천 금지", () => {
    for (const r of results) {
      expect(r.reasons.length).toBeGreaterThan(0);
      for (const reason of r.reasons) {
        expect(reason.label.length).toBeGreaterThan(0);
        expect(reason.shopImageId).toBeTruthy();
      }
    }
  });

  it("포트폴리오는 유사도 상위 최대 3장", () => {
    for (const r of results) {
      expect(r.portfolio.length).toBeGreaterThan(0);
      expect(r.portfolio.length).toBeLessThanOrEqual(3);
      const sims = r.portfolio.map((p) => p.similarity);
      expect([...sims].sort((a, b) => b - a)).toEqual(sims);
    }
  });

  it("매치율 내림차순 정렬", () => {
    const pcts = results.map((r) => r.matchPct);
    expect([...pcts].sort((a, b) => b - a)).toEqual(pcts);
  });
});
