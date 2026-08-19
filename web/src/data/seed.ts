// ⚠️ 시드 데이터 — Cut 1-2/1-3(실제 샵 4곳 × 25장 수동 수집 + Batch 태깅)이 끝나면 대체된다.
// 이미지는 Unsplash 무료 라이선스 8장, 원격 URL만 참조 (바이너리는 레포에 없다 — data.md 규칙).
// 이미지마다 출처 URL·계정을 기록한다. 출처 없는 행은 불량 데이터다.
// 샵은 가상이다 — data/seed-shops.json의 실제 샵에 무관한 Unsplash 사진을 붙이면
// 실존 업체의 포트폴리오를 지어내는 것이 되므로, 실제 포트폴리오가 수집되기 전엔 연결하지 않는다.
// 태깅: 사진을 직접 보고 작성 (tagged_by 참조). 실데이터는 lib/taste/prompt.ts + Batch API로.

import type { DressImage, Shop } from "@/lib/taste/types";

export const SHOPS: Shop[] = [
  { id: "maison-de-blanc", name: "메종 드 블랑", region: "청담", officialUrl: null },
  { id: "hautblanc", name: "오뜨블랑", region: "청담", officialUrl: null },
  { id: "lavieenrose", name: "라비앙로즈", region: "논현", officialUrl: null },
  { id: "vernette", name: "베르네트 브라이덜", region: "서초", officialUrl: null },
];

const TAGGED_BY = "claude-fable-5"; // 사진을 보고 수동 태깅. 회귀 추적용 (architecture.md)

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=1080&q=80&auto=format&fit=crop`;
}

export const DRESS_IMAGES: DressImage[] = [
  {
    id: "cascade",
    shopId: "maison-de-blanc",
    src: unsplash("photo-1549416878-b9ca95e26903"),
    sourceLabel: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/BruuboWUC_U",
    credit: "Maria Orlova",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "mermaid",
      neckline: "v",
      fabric: "lace",
      sleeve: "none",
      back: "open",
      tone: "pure-white",
      embellishment: 0.55,
      volume: 0.75,
      shine: 0.15,
      mood: { modern: 0.1, romantic: 0.45, classic: 0.25, bold: 0.2 },
      rationale: "레이스 보디스 아래로 튤 트레인이 계단처럼 쏟아지는 드라마틱 머메이드",
    },
  },
  {
    id: "dentelle",
    shopId: "maison-de-blanc",
    src: unsplash("photo-1529636273736-fc88b31ea9d9"),
    sourceLabel: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/JeEemtLSdjU",
    credit: "Samantha Gades",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "mermaid",
      neckline: "straight",
      fabric: "lace",
      sleeve: "none",
      back: "covered",
      tone: "pure-white",
      embellishment: 0.6,
      volume: 0.55,
      shine: 0.1,
      mood: { modern: 0.15, romantic: 0.4, classic: 0.35, bold: 0.1 },
      rationale: "전신 레이스 드롭 웨이스트 — 클래식과 러블리 사이의 정석",
    },
  },
  {
    id: "chateau",
    shopId: "hautblanc",
    src: unsplash("photo-1622277430358-f4d134452e2e"),
    sourceLabel: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/zGtGfqQqe6U",
    credit: "Asdrubal luna",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "ballgown",
      neckline: "high",
      fabric: "tulle",
      sleeve: "long-sheer",
      back: "illusion",
      tone: "ivory",
      embellishment: 0.5,
      volume: 0.9,
      shine: 0.1,
      mood: { modern: 0.1, romantic: 0.35, classic: 0.45, bold: 0.1 },
      rationale: "일루전 백 버튼과 시스루 소매, 레이스 헴 — 대성당이 어울리는 클래식 벨라인",
    },
  },
  {
    id: "foret",
    shopId: "hautblanc",
    src: unsplash("photo-1557363763-8381968f8353"),
    sourceLabel: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/cW6WOyXbIeU",
    credit: "Jonathan Borba",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "a-line",
      neckline: "straight",
      fabric: "organza",
      sleeve: "long-sheer",
      back: "illusion",
      tone: "ivory",
      embellishment: 0.6,
      volume: 0.6,
      shine: 0.2,
      mood: { modern: 0.15, romantic: 0.4, classic: 0.35, bold: 0.1 },
      rationale: "펄 비딩 시스루 소매와 일루전 백 — 숲속 채플에 어울리는 섬세함",
    },
  },
  {
    id: "brume",
    shopId: "lavieenrose",
    src: unsplash("photo-1492175742197-ed20dc5a6bed"),
    sourceLabel: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/qQ01rvKkE0w",
    credit: "Petr Ovralov",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "a-line",
      neckline: "straight",
      fabric: "tulle",
      sleeve: "cap",
      back: "covered",
      tone: "ivory",
      embellishment: 0.3,
      volume: 0.55,
      shine: 0.05,
      mood: { modern: 0.1, romantic: 0.55, classic: 0.25, bold: 0.1 },
      rationale: "빛을 머금는 소프트 튤과 텍스처드 보디스 — 안개처럼 가벼운 무드",
    },
  },
  {
    id: "prairie",
    shopId: "lavieenrose",
    src: unsplash("photo-1502955422409-06e43fd3eff3"),
    sourceLabel: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/KRM-2sIbgMI",
    credit: "Anna Vi",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "a-line",
      neckline: "v",
      fabric: "crepe",
      sleeve: "cap",
      back: "covered",
      tone: "ivory",
      embellishment: 0.25,
      volume: 0.5,
      shine: 0.05,
      mood: { modern: 0.2, romantic: 0.5, classic: 0.2, bold: 0.1 },
      rationale: "바람이 지나가는 소프트 크레이프 — 야외 스몰웨딩의 자연스러운 결",
    },
  },
  {
    id: "riviera",
    shopId: "vernette",
    src: unsplash("photo-1549417229-7686ac5595fd"),
    sourceLabel: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/2aQ8f-_0JvY",
    credit: "Maria Orlova",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "mermaid",
      neckline: "sweetheart",
      fabric: "lace",
      sleeve: "none",
      back: "open",
      tone: "pure-white",
      embellishment: 0.8,
      volume: 0.6,
      shine: 0.35,
      mood: { modern: 0.15, romantic: 0.3, classic: 0.2, bold: 0.35 },
      rationale: "비즈 레이스가 힙까지 감싸다 러플 튤로 터지는 글램 머메이드",
    },
  },
  {
    id: "voile",
    shopId: "vernette",
    src: unsplash("photo-1549488497-94b52bddac5d"),
    sourceLabel: "Unsplash",
    sourceUrl: "https://unsplash.com/photos/13naxFTumNA",
    credit: "Maria Orlova",
    taggedBy: TAGGED_BY,
    attrs: {
      silhouette: "ballgown",
      neckline: "sweetheart",
      fabric: "tulle",
      sleeve: "none",
      back: "covered",
      tone: "ivory",
      embellishment: 0.5,
      volume: 0.7,
      shine: 0.15,
      mood: { modern: 0.1, romantic: 0.5, classic: 0.2, bold: 0.2 },
      rationale: "레이스 아플리케 스트랩이 흘러내리듯 걸리고, 튤이 물결처럼 쏟아지는 드레스",
    },
  },
];

export function getImage(id: string): DressImage | undefined {
  return DRESS_IMAGES.find((img) => img.id === id);
}

/** 스와이프 덱. spec은 25장 — 시드가 8장뿐이라 전부 보여준다. 실데이터가 오면 25장 샘플링. */
export const DECK: DressImage[] = DRESS_IMAGES;
