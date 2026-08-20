// 태깅 파이프라인의 structured outputs 스키마.
// types.ts의 축 상수에서 파생된다 — 축 변경은 spec §2 → types.ts → 여기로 한 방향으로만 흐른다.
// z.infer 결과가 DressAttributes와 일치하는지는 schema.test.ts가 컴파일 타임에 고정한다.

import { z } from "zod";

import {
  BACKS,
  FABRICS,
  NECKLINES,
  SILHOUETTES,
  SLEEVES,
  TONES,
  type DressAttributes,
} from "./types";

const unit = z.number().min(0).max(1);

export const DressAttributesSchema = z.object({
  silhouette: z.enum(SILHOUETTES),
  neckline: z.enum(NECKLINES),
  fabric: z.enum(FABRICS),
  sleeve: z.enum(SLEEVES),
  back: z.enum(BACKS),
  tone: z.enum(TONES),
  embellishment: unit,
  volume: unit,
  shine: unit,
  mood: z.object({
    modern: unit,
    romantic: unit,
    classic: unit,
    bold: unit,
  }),
  // rationale은 옵션이 아니다 — 비어 있으면 불량 데이터 (.claude/rules/taste-pipeline.md)
  rationale: z.string().min(1),
});

// mood 합=1 제약은 structured outputs의 JSON 스키마로 표현할 수 없어서
// 파싱 직후 코드에서 결정적으로 보정한다.
export function normalizeMood(attrs: DressAttributes): DressAttributes {
  const { modern, romantic, classic, bold } = attrs.mood;
  const sum = modern + romantic + classic + bold;
  if (sum === 0) {
    return { ...attrs, mood: { modern: 0.25, romantic: 0.25, classic: 0.25, bold: 0.25 } };
  }
  return {
    ...attrs,
    mood: {
      modern: modern / sum,
      romantic: romantic / sum,
      classic: classic / sum,
      bold: bold / sum,
    },
  };
}
