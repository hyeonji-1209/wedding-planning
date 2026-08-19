// 샵 매칭 (spec §2): 코사인 유사도, 샵 점수 = 포트폴리오 상위 5장 유사도의 평균.
// 최고 1장만 쓰면 아웃라이어 한 장으로 순위가 뒤집힌다 — 바꾸려면 spec부터.
// LLM은 여기 없다. 매칭은 결정적이고 테스트 가능해야 한다 (docs/architecture.md).

import {
  BACK_KO,
  FABRIC_KO,
  NECKLINE_KO,
  NUMERIC_KO,
  SILHOUETTE_KO,
  SLEEVE_KO,
  TONE_KO,
} from "./labels";
import type { TasteProfile } from "./profile";
import type { DressImage, Shop } from "./types";
import { attrsToVec, cosine } from "./vector";

const TOP_N_FOR_SCORE = 5;

export type MatchReason = {
  /** 사용자의 선호 facet 라벨 — 화면에는 키워드로 압축 노출된다 */
  label: string;
  /** 이 이유를 뒷받침하는 샵 포트폴리오 이미지 */
  shopImageId: string;
  /** 사용자가 ♥한 이미지 중 같은 취향 신호를 가진 근거 */
  userEvidenceId: string | null;
};

export type ShopMatch = {
  shop: Shop;
  matchPct: number;
  reasons: MatchReason[]; // 항상 1개 이상 — 근거 없는 추천은 만들지 않는다
  portfolio: { image: DressImage; similarity: number }[]; // 유사도 상위 3장
};

export function matchShops(
  profile: TasteProfile,
  images: DressImage[],
  shops: Shop[],
  limit = 5,
): ShopMatch[] {
  const results: ShopMatch[] = [];

  for (const shop of shops) {
    const portfolio = images.filter((img) => img.shopId === shop.id);
    if (portfolio.length === 0) continue;

    const scored = portfolio
      .map((image) => ({ image, similarity: cosine(profile.vec, attrsToVec(image.attrs)) }))
      .sort((a, b) => b.similarity - a.similarity);

    const top = scored.slice(0, TOP_N_FOR_SCORE);
    const score = top.reduce((s, x) => s + x.similarity, 0) / top.length;

    const reasons = buildReasons(profile, top.map((t) => t.image));
    if (reasons.length === 0) continue; // 근거를 못 만들면 추천하지 않는다

    results.push({
      shop,
      matchPct: Math.round(score * 100),
      reasons: reasons.slice(0, 3),
      portfolio: scored.slice(0, 3),
    });
  }

  return results.sort((a, b) => b.matchPct - a.matchPct).slice(0, limit);
}

function buildReasons(profile: TasteProfile, shopTop: DressImage[]): MatchReason[] {
  const reasons: MatchReason[] = [];

  // 사용자의 선호 facet마다, 샵 상위 포트폴리오에서 같은 신호를 가진 이미지를 찾는다.
  for (const facet of profile.preferred) {
    const evidenceAttr = facet.evidenceIds[0] ?? null;
    const shopImage = shopTop.find((img) =>
      facetAppliesToImage(facet.label, img),
    );
    if (!shopImage) continue;
    reasons.push({
      label: facet.label,
      shopImageId: shopImage.id,
      userEvidenceId: evidenceAttr,
    });
    if (reasons.length >= 3) break;
  }

  // facet 매칭이 하나도 안 되면, 유사도 1위 이미지 자체가 근거다.
  if (reasons.length === 0 && shopTop[0]) {
    reasons.push({
      label: "전체 분위기",
      shopImageId: shopTop[0].id,
      userEvidenceId: profile.likedIds[0] ?? profile.savedIds[0] ?? null,
    });
  }
  return reasons;
}

// facet 라벨은 labels.ts에서 파생되므로, 라벨 → 속성 판정도 같은 라벨 테이블로 한다.
function facetAppliesToImage(label: string, img: DressImage): boolean {
  const a = img.attrs;
  const categorical: [Record<string, string>, string][] = [
    [SILHOUETTE_KO, a.silhouette],
    [NECKLINE_KO, a.neckline],
    [FABRIC_KO, a.fabric],
    [SLEEVE_KO, a.sleeve],
    [BACK_KO, a.back],
    [TONE_KO, a.tone],
  ];
  for (const [table, value] of categorical) {
    if (table[value] === label) return true;
  }
  const numeric: [string, number][] = [
    ["embellishment", a.embellishment],
    ["volume", a.volume],
    ["shine", a.shine],
  ];
  for (const [key, value] of numeric) {
    const entry = NUMERIC_KO[key as keyof typeof NUMERIC_KO];
    if (label === entry.high && value >= 0.6) return true;
    if (label === entry.low && value <= 0.35) return true;
  }
  return false;
}
