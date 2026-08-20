// attrs → 매칭 벡터 파생은 이 파일에만 존재한다 (.claude/rules/taste-pipeline.md).
// 다른 곳에서 재구현하지 말 것 — 두 벌로 갈라지면 추천이 조용히 망가진다.

import {
  BACKS,
  FABRICS,
  NECKLINES,
  SILHOUETTES,
  SLEEVES,
  TONES,
  type DressAttributes,
} from "./types";

const MOOD_KEYS = ["modern", "romantic", "classic", "bold"] as const;

// one-hot 축 6그룹(29) + 수치 축 3 + mood 4 = 36차원 (kickoff Decision Log 2026-08-20 확정).
export const VECTOR_DIM =
  SILHOUETTES.length +
  NECKLINES.length +
  FABRICS.length +
  SLEEVES.length +
  BACKS.length +
  TONES.length +
  3 +
  MOOD_KEYS.length;

function oneHot<T extends readonly string[]>(values: T, value: T[number]): number[] {
  return values.map((v) => (v === value ? 1 : 0));
}

export function attrsToVec(attrs: DressAttributes): number[] {
  return [
    ...oneHot(SILHOUETTES, attrs.silhouette),
    ...oneHot(NECKLINES, attrs.neckline),
    ...oneHot(FABRICS, attrs.fabric),
    ...oneHot(SLEEVES, attrs.sleeve),
    ...oneHot(BACKS, attrs.back),
    ...oneHot(TONES, attrs.tone),
    attrs.embellishment,
    attrs.volume,
    attrs.shine,
    ...MOOD_KEYS.map((k) => attrs.mood[k]),
  ];
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function meanVec(vecs: number[][], weights?: number[]): number[] {
  const out = new Array<number>(vecs[0]?.length ?? 0).fill(0);
  let total = 0;
  vecs.forEach((v, i) => {
    const w = weights?.[i] ?? 1;
    total += w;
    for (let d = 0; d < v.length; d++) out[d] += v[d] * w;
  });
  if (total === 0) return out;
  return out.map((x) => x / total);
}
