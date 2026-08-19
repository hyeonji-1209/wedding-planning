// 반응 목록 → 취향 프로필 (spec §2: ♥ 평균 + 분산, 기피는 ✕에서 유의하게 높은 축).
// 모든 선호/기피 항목에 근거 이미지가 붙는다 — 근거 없는 항목은 만들지 않는다.

import {
  BACK_KO,
  FABRIC_KO,
  NECKLINE_KO,
  NUMERIC_KO,
  SILHOUETTE_KO,
  SLEEVE_KO,
  TONE_KO,
} from "./labels";
import type { DressImage, Mood, Reaction } from "./types";
import { attrsToVec, meanVec } from "./vector";

export type TasteFacet = {
  /** 결과 화면에 그대로 노출되는 라벨 (예: "머메이드", "화려한 비즈·자수 장식") */
  label: string;
  /** 정렬용 점수. 클수록 취향 신호가 강하다. */
  score: number;
  /** "네가 고른 이 사진 때문" — 근거 이미지 id. 항상 1개 이상. */
  evidenceIds: string[];
};

export type TasteProfile = {
  vec: number[];
  moodPct: { modern: number; romantic: number; classic: number; bold: number };
  preferred: TasteFacet[]; // 최대 5
  avoided: TasteFacet[]; // 최대 3
  likedIds: string[];
  savedIds: string[];
  passedIds: string[];
};

const SAVE_WEIGHT = 1.5; // 저장은 ♥보다 강한 신호

type CategoricalAxis = {
  key: "silhouette" | "neckline" | "fabric" | "sleeve" | "back" | "tone";
  labels: Record<string, string>;
};

const CATEGORICAL_AXES: CategoricalAxis[] = [
  { key: "silhouette", labels: SILHOUETTE_KO },
  { key: "neckline", labels: NECKLINE_KO },
  { key: "fabric", labels: FABRIC_KO },
  { key: "sleeve", labels: SLEEVE_KO },
  { key: "back", labels: BACK_KO },
  { key: "tone", labels: TONE_KO },
];

const NUMERIC_AXES = ["embellishment", "volume", "shine"] as const;

function valueFreq(images: DressImage[], axis: CategoricalAxis["key"]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const img of images) {
    const v = img.attrs[axis];
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  for (const [k, n] of freq) freq.set(k, n / Math.max(1, images.length));
  return freq;
}

function numericMean(images: DressImage[], axis: (typeof NUMERIC_AXES)[number]): number {
  if (images.length === 0) return 0;
  return images.reduce((s, img) => s + img.attrs[axis], 0) / images.length;
}

export function buildProfile(reactions: Reaction[], images: DressImage[]): TasteProfile | null {
  const byId = new Map(images.map((img) => [img.id, img]));
  const likedIds: string[] = [];
  const savedIds: string[] = [];
  const passedIds: string[] = [];
  for (const r of reactions) {
    if (!byId.has(r.imageId)) continue;
    if (r.reaction === "like") likedIds.push(r.imageId);
    else if (r.reaction === "save") savedIds.push(r.imageId);
    else passedIds.push(r.imageId);
  }

  const positives = [...likedIds, ...savedIds].map((id) => byId.get(id)!);
  if (positives.length === 0) return null; // 전부 ✕ — 프로필을 지어내지 않는다

  const weights = [...likedIds.map(() => 1), ...savedIds.map(() => SAVE_WEIGHT)];
  const vec = meanVec(
    positives.map((img) => attrsToVec(img.attrs)),
    weights,
  );

  // mood % — 가중 평균 후 합 100으로 정규화
  const moodSum: Mood = { modern: 0, romantic: 0, classic: 0, bold: 0 };
  positives.forEach((img, i) => {
    const w = weights[i];
    moodSum.modern += img.attrs.mood.modern * w;
    moodSum.romantic += img.attrs.mood.romantic * w;
    moodSum.classic += img.attrs.mood.classic * w;
    moodSum.bold += img.attrs.mood.bold * w;
  });
  const moodTotal = moodSum.modern + moodSum.romantic + moodSum.classic + moodSum.bold || 1;
  const moodPct = {
    modern: Math.round((moodSum.modern / moodTotal) * 100),
    romantic: Math.round((moodSum.romantic / moodTotal) * 100),
    classic: Math.round((moodSum.classic / moodTotal) * 100),
    bold: Math.round((moodSum.bold / moodTotal) * 100),
  };
  // 반올림 오차는 최대 축에 흡수시켜 합 100 유지
  const drift = 100 - (moodPct.modern + moodPct.romantic + moodPct.classic + moodPct.bold);
  const top = (Object.keys(moodPct) as (keyof typeof moodPct)[]).sort(
    (a, b) => moodPct[b] - moodPct[a],
  )[0];
  moodPct[top] += drift;

  const passed = passedIds.map((id) => byId.get(id)!);
  const deckShown = [...positives, ...passed];

  // 선호: 본 덱 대비 ♥에서 두드러진 값
  const preferred: TasteFacet[] = [];
  for (const axis of CATEGORICAL_AXES) {
    const likedFreq = valueFreq(positives, axis.key);
    const deckFreq = valueFreq(deckShown, axis.key);
    for (const [value, f] of likedFreq) {
      const lift = f - (deckFreq.get(value) ?? 0);
      const score = f + Math.max(0, lift); // 자주 골랐고, 덱 평균보다 더 골랐을수록
      if (f < 0.34) continue; // 한두 장짜리 우연은 근거로 약하다
      preferred.push({
        label: axis.labels[value] ?? value,
        score,
        evidenceIds: positives.filter((img) => img.attrs[axis.key] === value).map((img) => img.id),
      });
    }
  }
  for (const axis of NUMERIC_AXES) {
    const likedMean = numericMean(positives, axis);
    const deckMean = numericMean(deckShown, axis);
    const delta = likedMean - deckMean;
    const direction = likedMean >= 0.6 ? "high" : likedMean <= 0.35 ? "low" : null;
    if (!direction) continue;
    const sorted = [...positives].sort((a, b) =>
      direction === "high" ? b.attrs[axis] - a.attrs[axis] : a.attrs[axis] - b.attrs[axis],
    );
    preferred.push({
      label: NUMERIC_KO[axis][direction],
      score: Math.abs(likedMean - 0.5) + Math.max(0, direction === "high" ? delta : -delta),
      evidenceIds: sorted.slice(0, 3).map((img) => img.id),
    });
  }
  preferred.sort((a, b) => b.score - a.score);

  // 기피: ✕에서 유의하게 높은 축 (♥ 대비)
  const avoided: TasteFacet[] = [];
  if (passed.length > 0) {
    for (const axis of CATEGORICAL_AXES) {
      const passFreq = valueFreq(passed, axis.key);
      const likedFreq = valueFreq(positives, axis.key);
      for (const [value, f] of passFreq) {
        const gap = f - (likedFreq.get(value) ?? 0);
        if (gap < 0.3) continue;
        avoided.push({
          label: CATEGORICAL_AXES.find((a) => a.key === axis.key)!.labels[value] ?? value,
          score: gap,
          evidenceIds: passed.filter((img) => img.attrs[axis.key] === value).map((img) => img.id),
        });
      }
    }
    for (const axis of NUMERIC_AXES) {
      const passMean = numericMean(passed, axis);
      const likedMean = numericMean(positives, axis);
      const gap = passMean - likedMean;
      if (Math.abs(gap) < 0.25) continue;
      const direction = gap > 0 ? "high" : "low";
      const sorted = [...passed].sort((a, b) =>
        direction === "high" ? b.attrs[axis] - a.attrs[axis] : a.attrs[axis] - b.attrs[axis],
      );
      avoided.push({
        label: NUMERIC_KO[axis][direction],
        score: Math.abs(gap),
        evidenceIds: sorted.slice(0, 3).map((img) => img.id),
      });
    }
    avoided.sort((a, b) => b.score - a.score);
  }

  return {
    vec,
    moodPct,
    preferred: preferred.slice(0, 5),
    avoided: avoided.slice(0, 3),
    likedIds,
    savedIds,
    passedIds,
  };
}
