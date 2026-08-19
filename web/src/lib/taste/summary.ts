// 취향 이름 + 설명문. LLM 없이도 결과 화면은 항상 동작해야 한다 (main은 항상 동작).
// Claude 요약은 summary-claude.ts (서버 전용) — 키가 없거나 실패하면 이 결정적 버전을 쓴다.

import { MOOD_KO } from "./labels";
import type { TasteProfile } from "./profile";

export type TasteSummary = {
  name: string;
  description: string;
  generatedBy: "deterministic" | "claude-opus-5";
};

const NAME_TABLE: Record<string, Record<string, string>> = {
  modern: {
    romantic: "모던 로맨티시스트",
    classic: "컨템포러리 클래식",
    bold: "미니멀 아방가르드",
    modern: "순도 높은 미니멀리스트",
  },
  romantic: {
    modern: "소프트 모더니스트",
    classic: "타임리스 로맨티시스트",
    bold: "드라마틱 로맨티시스트",
    romantic: "뼛속까지 로맨티시스트",
  },
  classic: {
    modern: "리파인드 클래시시스트",
    romantic: "로맨틱 클래시시스트",
    bold: "그랜드 클래시시스트",
    classic: "정통 클래시시스트",
  },
  bold: {
    modern: "컷팅엣지 글래머",
    romantic: "글램 로맨티시스트",
    classic: "스테이트먼트 클래식",
    bold: "타고난 씬스틸러",
  },
};

export function deterministicSummary(profile: TasteProfile): TasteSummary {
  const moods = (Object.keys(profile.moodPct) as (keyof typeof profile.moodPct)[]).sort(
    (a, b) => profile.moodPct[b] - profile.moodPct[a],
  );
  const [first, second] = moods;
  const name = NAME_TABLE[first][second] ?? `${MOOD_KO[first]} ${MOOD_KO[second]}`;

  const keeps = profile.preferred
    .slice(0, 3)
    .map((f) => f.label)
    .join(", ");
  const avoids = profile.avoided[0]?.label;
  const description = [
    `${MOOD_KO[first]} ${profile.moodPct[first]}%에 ${MOOD_KO[second]} ${profile.moodPct[second]}%가 섞인 취향이에요.`,
    keeps ? `${keeps}에 일관되게 마음이 기울었고,` : "",
    avoids ? `${avoids}는 확실히 아니었어요.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return { name, description, generatedBy: "deterministic" };
}
