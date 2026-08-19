import { describe, expect, it } from "vitest";
import { buildProfile } from "./profile";
import type { DressAttributes, DressImage, Reaction } from "./types";

function img(id: string, over: Partial<DressAttributes>): DressImage {
  return {
    id,
    shopId: "s1",
    src: `https://example.com/${id}.jpg`,
    sourceLabel: "test",
    sourceUrl: `https://example.com/${id}`,
    credit: "tester",
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

const deck: DressImage[] = [
  img("m1", { silhouette: "mermaid", volume: 0.1, mood: { modern: 0.6, romantic: 0.1, classic: 0.2, bold: 0.1 } }),
  img("m2", { silhouette: "mermaid", volume: 0.15, mood: { modern: 0.5, romantic: 0.1, classic: 0.3, bold: 0.1 } }),
  img("m3", { silhouette: "mermaid", volume: 0.2, mood: { modern: 0.55, romantic: 0.15, classic: 0.2, bold: 0.1 } }),
  img("b1", { silhouette: "ballgown", volume: 0.9, embellishment: 0.9, mood: { modern: 0.1, romantic: 0.6, classic: 0.2, bold: 0.1 } }),
  img("b2", { silhouette: "ballgown", volume: 0.95, embellishment: 0.85, mood: { modern: 0.1, romantic: 0.55, classic: 0.25, bold: 0.1 } }),
];

const reactions: Reaction[] = [
  { imageId: "m1", reaction: "like" },
  { imageId: "m2", reaction: "like" },
  { imageId: "m3", reaction: "save" },
  { imageId: "b1", reaction: "pass" },
  { imageId: "b2", reaction: "pass" },
];

describe("buildProfile", () => {
  const profile = buildProfile(reactions, deck)!;

  it("♥가 하나도 없으면 프로필을 지어내지 않는다", () => {
    expect(
      buildProfile(
        [
          { imageId: "m1", reaction: "pass" },
          { imageId: "b1", reaction: "pass" },
        ],
        deck,
      ),
    ).toBeNull();
  });

  it("mood %의 합은 100", () => {
    const { modern, romantic, classic, bold } = profile.moodPct;
    expect(modern + romantic + classic + bold).toBe(100);
  });

  it("전부 머메이드를 골랐으면 머메이드가 선호 속성에 있고, 근거 이미지가 붙는다", () => {
    const mermaid = profile.preferred.find((f) => f.label === "머메이드");
    expect(mermaid).toBeDefined();
    expect(mermaid!.evidenceIds).toEqual(expect.arrayContaining(["m1", "m2", "m3"]));
  });

  it("모든 선호/기피 항목에 근거 이미지가 1개 이상 있다 (근거 없는 항목 금지)", () => {
    for (const f of [...profile.preferred, ...profile.avoided]) {
      expect(f.evidenceIds.length).toBeGreaterThan(0);
    }
  });

  it("✕에서 유의하게 높은 축이 기피로 잡힌다 (벨라인/볼륨)", () => {
    expect(profile.avoided.length).toBeGreaterThan(0);
    const labels = profile.avoided.map((f) => f.label);
    expect(labels.some((l) => l.includes("벨라인") || l.includes("볼륨") || l.includes("비즈"))).toBe(
      true,
    );
  });

  it("선호는 최대 5개, 기피는 최대 3개", () => {
    expect(profile.preferred.length).toBeLessThanOrEqual(5);
    expect(profile.avoided.length).toBeLessThanOrEqual(3);
  });
});
