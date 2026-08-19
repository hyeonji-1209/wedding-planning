// 벡터 파생은 결정적이어야 한다 — 두 벌로 갈라지면 추천이 조용히 망가진다.

import { describe, expect, it } from "vitest";
import type { DressAttributes } from "./types";
import { VECTOR_DIM, attrsToVec, cosine, meanVec } from "./vector";

const base: DressAttributes = {
  silhouette: "mermaid",
  neckline: "sweetheart",
  fabric: "lace",
  sleeve: "none",
  back: "open",
  tone: "ivory",
  embellishment: 0.7,
  volume: 0.4,
  shine: 0.3,
  mood: { modern: 0.2, romantic: 0.4, classic: 0.3, bold: 0.1 },
  rationale: "테스트",
};

describe("attrsToVec", () => {
  it("항상 같은 입력 → 같은 벡터 (결정적)", () => {
    expect(attrsToVec(base)).toEqual(attrsToVec({ ...base }));
  });

  it("차원 수가 VECTOR_DIM과 일치한다", () => {
    expect(attrsToVec(base)).toHaveLength(VECTOR_DIM);
  });

  it("카테고리 축은 그룹당 정확히 1개만 켜진다", () => {
    const vec = attrsToVec(base);
    // 카테고리 6그룹(29차원)의 합 = 6
    const categorical = vec.slice(0, VECTOR_DIM - 7);
    expect(categorical.reduce((s, x) => s + x, 0)).toBe(6);
    expect(categorical.every((x) => x === 0 || x === 1)).toBe(true);
  });
});

describe("cosine", () => {
  it("자기 자신과는 1", () => {
    const v = attrsToVec(base);
    expect(cosine(v, v)).toBeCloseTo(1);
  });

  it("속성 벡터는 전 성분이 0 이상이므로 [0, 1] 범위다", () => {
    const other = attrsToVec({
      ...base,
      silhouette: "sheath",
      fabric: "crepe",
      embellishment: 0,
      volume: 0,
      shine: 0,
      mood: { modern: 0.9, romantic: 0, classic: 0.1, bold: 0 },
    });
    const sim = cosine(attrsToVec(base), other);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it("영벡터는 0을 반환한다 (NaN 아님)", () => {
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });
});

describe("meanVec", () => {
  it("가중치가 반영된다", () => {
    const out = meanVec(
      [
        [1, 0],
        [0, 1],
      ],
      [3, 1],
    );
    expect(out[0]).toBeCloseTo(0.75);
    expect(out[1]).toBeCloseTo(0.25);
  });
});
