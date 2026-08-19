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
export type DressImage = {
  id: string;
  shopId: string;
  /** 로컬 시드는 /dresses/*.jpg. 실데이터는 공식 출처 URL (원본 재호스팅 금지). */
  src: string;
  sourceLabel: string; // 출처 표기
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
