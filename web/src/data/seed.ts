// ⚠️ 시드 데이터 — Cut 1-2/1-3(실제 샵 5곳 × 100장, Batch 태깅)이 끝나면 Supabase로 대체된다.
// 이미지는 Unsplash 무료 라이선스 사진 8장 (public/dresses). 실제 업체 포트폴리오가 아니므로
// 샵은 가상이고 officialUrl이 없다 — 화면에는 "시드 데이터"로 표기된다.
// 실데이터 규칙: 원본 재호스팅 금지, 공식 출처 URL + 출처 표기 (docs/architecture.md §저작권).
// 태깅: 사진을 직접 보고 작성 (tagged_by 참조). 실데이터는 lib/taste/prompt.ts + Batch API로.

import type { DressImage, Shop } from "@/lib/taste/types";

export const SHOPS: Shop[] = [
  { id: "maison-de-blanc", name: "메종 드 블랑", region: "청담", officialUrl: null },
  { id: "hautblanc", name: "오뜨블랑", region: "청담", officialUrl: null },
  { id: "lavieenrose", name: "라비앙로즈", region: "논현", officialUrl: null },
  { id: "vernette", name: "베르네트 브라이덜", region: "서초", officialUrl: null },
];

const TAGGED_BY = "claude-fable-5"; // 사진을 보고 수동 태깅. 회귀 추적용 (architecture.md)

export const DRESS_IMAGES: DressImage[] = [
  {
    id: "stella",
    shopId: "maison-de-blanc",
    src: "/dresses/stella.jpg",
    sourceLabel: "Unsplash",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "mermaid",
      neckline: "v",
      fabric: "lace",
      sleeve: "none",
      back: "open",
      tone: "ivory",
      embellishment: 0.55,
      volume: 0.75,
      shine: 0.2,
      mood: { modern: 0.1, romantic: 0.45, classic: 0.3, bold: 0.15 },
      rationale: "레이스 보디스가 몸선을 따르다 튤 스커트로 터지는, 우아하면서 드라마틱한 실루엣",
    },
  },
  {
    id: "blanche",
    shopId: "lavieenrose",
    src: "/dresses/blanche.jpg",
    sourceLabel: "Unsplash",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "ballgown",
      neckline: "off-shoulder",
      fabric: "tulle",
      sleeve: "puff",
      back: "covered",
      tone: "ivory",
      embellishment: 0.15,
      volume: 0.8,
      shine: 0.1,
      mood: { modern: 0.1, romantic: 0.6, classic: 0.2, bold: 0.1 },
      rationale: "오프숄더 퍼프 소매와 겹겹의 튤이 만드는 몽환적인 소프트 무드",
    },
  },
  {
    id: "etoile",
    shopId: "vernette",
    src: "/dresses/etoile.jpg",
    sourceLabel: "Unsplash",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "mermaid",
      neckline: "sweetheart",
      fabric: "lace",
      sleeve: "none",
      back: "open",
      tone: "pure-white",
      embellishment: 0.8,
      volume: 0.55,
      shine: 0.35,
      mood: { modern: 0.15, romantic: 0.3, classic: 0.2, bold: 0.35 },
      rationale: "비즈 레이스가 상체를 촘촘히 감싸다 힙에서 튤로 풀리는 글램 머메이드",
    },
  },
  {
    id: "lumiere",
    shopId: "hautblanc",
    src: "/dresses/lumiere.jpg",
    sourceLabel: "Unsplash",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "ballgown",
      neckline: "sweetheart",
      fabric: "mikado",
      sleeve: "detachable",
      back: "covered",
      tone: "pure-white",
      embellishment: 0.25,
      volume: 0.85,
      shine: 0.7,
      mood: { modern: 0.2, romantic: 0.1, classic: 0.45, bold: 0.25 },
      rationale: "광택 미카도가 만드는 조형적인 볼륨과 탈부착 퍼프 — 로열 클래식 무드",
    },
  },
  {
    id: "serene",
    shopId: "lavieenrose",
    src: "/dresses/serene.jpg",
    sourceLabel: "Unsplash",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "a-line",
      neckline: "high",
      fabric: "tulle",
      sleeve: "long-sheer",
      back: "illusion",
      tone: "pure-white",
      embellishment: 0.35,
      volume: 0.8,
      shine: 0.15,
      mood: { modern: 0.1, romantic: 0.4, classic: 0.4, bold: 0.1 },
      rationale: "하이넥 시스루 레이스 소매와 풍성한 튤 스커트 — 단정한데 풍성한 균형",
    },
  },
  {
    id: "flora",
    shopId: "maison-de-blanc",
    src: "/dresses/flora.jpg",
    sourceLabel: "Unsplash",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "mermaid",
      neckline: "high",
      fabric: "lace",
      sleeve: "none",
      back: "illusion",
      tone: "ivory",
      embellishment: 0.5,
      volume: 0.6,
      shine: 0.1,
      mood: { modern: 0.1, romantic: 0.5, classic: 0.3, bold: 0.1 },
      rationale: "드롭 웨이스트에서 부드럽게 퍼지는 튤과 허리의 입체 플라워 디테일",
    },
  },
  {
    id: "rosier",
    shopId: "vernette",
    src: "/dresses/rosier.jpg",
    sourceLabel: "Unsplash",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "sheath",
      neckline: "sweetheart",
      fabric: "lace",
      sleeve: "cap",
      back: "illusion",
      tone: "ivory",
      embellishment: 0.65,
      volume: 0.15,
      shine: 0.4,
      mood: { modern: 0.35, romantic: 0.15, classic: 0.3, bold: 0.2 },
      rationale: "비즈가 촘촘한 슬림 시스에 일루전 캡 소매 — 군더더기 없는 세련미",
    },
  },
  {
    id: "montblanc",
    shopId: "hautblanc",
    src: "/dresses/montblanc.jpg",
    sourceLabel: "Unsplash",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "ballgown",
      neckline: "sweetheart",
      fabric: "mikado",
      sleeve: "detachable",
      back: "covered",
      tone: "pure-white",
      embellishment: 0.2,
      volume: 0.9,
      shine: 0.75,
      mood: { modern: 0.2, romantic: 0.1, classic: 0.5, bold: 0.2 },
      rationale: "미카도 새틴 볼륨 스커트의 정석 — 대형 홀에서 존재감이 사는 클래식",
    },
  },
];

export function getImage(id: string): DressImage | undefined {
  return DRESS_IMAGES.find((img) => img.id === id);
}

/** 스와이프 덱. spec은 25장 — 시드가 8장뿐이라 전부 보여준다. 실데이터가 오면 25장 샘플링. */
export const DECK: DressImage[] = DRESS_IMAGES;
