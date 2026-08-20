import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";

import { DressAttributesSchema, normalizeMood } from "./schema";
import type { DressAttributes } from "./types";

const VALID: DressAttributes = {
  silhouette: "sheath",
  neckline: "straight",
  fabric: "silk-satin",
  sleeve: "none",
  back: "low-v",
  tone: "ivory",
  embellishment: 0.1,
  volume: 0.2,
  shine: 0.6,
  mood: { modern: 0.7, romantic: 0.1, classic: 0.2, bold: 0 },
  rationale: "직선 네크라인의 실크 시스 드레스가 장식 없이 광택으로만 떨어진다.",
};

describe("DressAttributesSchema", () => {
  // 스키마와 타입이 갈라지면 여기서 컴파일이 깨진다 (tsc --noEmit가 잡는다)
  it("z.infer 결과가 DressAttributes와 정확히 일치한다", () => {
    expectTypeOf<z.infer<typeof DressAttributesSchema>>().toEqualTypeOf<DressAttributes>();
  });

  it("유효한 attrs를 통과시킨다", () => {
    expect(DressAttributesSchema.parse(VALID)).toEqual(VALID);
  });

  it("빈 rationale은 불량 데이터로 거부한다", () => {
    expect(() => DressAttributesSchema.parse({ ...VALID, rationale: "" })).toThrow();
  });

  it("범위 밖 수치 축을 거부한다", () => {
    expect(() => DressAttributesSchema.parse({ ...VALID, embellishment: 1.2 })).toThrow();
  });

  it("축 상수에 없는 카테고리 값을 거부한다", () => {
    expect(() => DressAttributesSchema.parse({ ...VALID, fabric: "velvet" })).toThrow();
  });
});

describe("normalizeMood", () => {
  it("mood 합을 1로 보정한다", () => {
    const skewed = { ...VALID, mood: { modern: 2, romantic: 1, classic: 1, bold: 0 } };
    const mood = normalizeMood(skewed).mood;
    expect(mood.modern + mood.romantic + mood.classic + mood.bold).toBeCloseTo(1, 10);
    expect(mood.modern).toBeCloseTo(0.5, 10);
  });

  it("전부 0이면 균등 분포로 대체한다", () => {
    const zero = { ...VALID, mood: { modern: 0, romantic: 0, classic: 0, bold: 0 } };
    expect(normalizeMood(zero).mood).toEqual({ modern: 0.25, romantic: 0.25, classic: 0.25, bold: 0.25 });
  });
});
