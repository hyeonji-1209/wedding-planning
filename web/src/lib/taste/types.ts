// docs/spec-v0.md §2 Taste Profile 스키마. 축을 바꾸면 spec 먼저 고친다.

export const SILHOUETTES = ["a-line", "ballgown", "mermaid", "sheath", "empire"] as const;
export const NECKLINES = ["straight", "v", "sweetheart", "halter", "off-shoulder", "high"] as const;
export const FABRICS = ["silk-satin", "crepe", "tulle", "lace", "organza", "mikado"] as const;
export const SLEEVES = ["none", "cap", "long-sheer", "puff", "detachable"] as const;
export const BACKS = ["open", "low-v", "illusion", "covered"] as const;
export const TONES = ["pure-white", "ivory", "champagne"] as const;

export type Silhouette = (typeof SILHOUETTES)[number];
export type Neckline = (typeof NECKLINES)[number];
export type Fabric = (typeof FABRICS)[number];
export type Sleeve = (typeof SLEEVES)[number];
export type Back = (typeof BACKS)[number];
export type Tone = (typeof TONES)[number];

export type Mood = { modern: number; romantic: number; classic: number; bold: number };

export type DressAttributes = {
  silhouette: Silhouette;
  neckline: Neckline;
  fabric: Fabric;
  sleeve: Sleeve;
  back: Back;
  tone: Tone;
  embellishment: number; // 0=무장식 … 1=풀비즈
  volume: number; // 0=바디컨 … 1=최대볼륨
  shine: number; // 0=매트 … 1=글로시
  mood: Mood; // 합=1
  rationale: string; // 한 문장. 결과 화면 근거로 그대로 노출된다.
};

// dress_images 행에 대응 (docs/architecture.md). Supabase 연결 전까지는 시드 파일이 대신한다.
// 이미지 바이너리는 레포에 없다 — 원격 URL만 (.claude/rules/data.md).
export type DressImage = {
  id: string;
  shopId: string;
  /** 원격 이미지 URL. next/image remotePatterns에 호스트가 등록돼 있어야 한다. */
  src: string;
  sourceLabel: string; // 출처 표기 (화면 노출)
  /** 출처 페이지 URL — 없는 행은 불량 데이터다 (.claude/rules/data.md) */
  sourceUrl: string;
  /** 출처 계정(작가/샵 핸들) */
  credit: string;
  attrs: DressAttributes;
  taggedBy: string;
};

export type Shop = {
  id: string;
  name: string;
  region: string;
  /** 시드 단계에서는 null — 실제 샵 데이터가 들어오면 필수 (spec 화면 4: 공식 링크). */
  officialUrl: string | null;
};

export type ReactionKind = "like" | "pass" | "save";
export type Reaction = { imageId: string; reaction: ReactionKind };
