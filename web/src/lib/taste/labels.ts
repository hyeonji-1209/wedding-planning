// 결과 화면에 노출되는 한국어 라벨. 값을 추가하면 여기도 같이 채운다 (빠지면 영문 키가 그대로 노출됨).

import type { Back, Fabric, Neckline, Silhouette, Sleeve, Tone } from "./types";

export const SILHOUETTE_KO: Record<Silhouette, string> = {
  "a-line": "A라인",
  ballgown: "벨라인",
  mermaid: "머메이드",
  sheath: "슬림 시스",
  empire: "엠파이어",
};

export const NECKLINE_KO: Record<Neckline, string> = {
  straight: "스트레이트 넥",
  v: "V넥",
  sweetheart: "스윗하트 넥",
  halter: "홀터넥",
  "off-shoulder": "오프숄더",
  high: "하이넥",
};

export const FABRIC_KO: Record<Fabric, string> = {
  "silk-satin": "실크 새틴",
  crepe: "크레이프",
  tulle: "튤",
  lace: "레이스",
  organza: "오간자",
  mikado: "미카도",
};

export const SLEEVE_KO: Record<Sleeve, string> = {
  none: "슬리브리스",
  cap: "캡 소매",
  "long-sheer": "시스루 긴소매",
  puff: "퍼프 소매",
  detachable: "탈부착 소매",
};

export const BACK_KO: Record<Back, string> = {
  open: "오픈백",
  "low-v": "로우 V백",
  illusion: "일루전 백",
  covered: "커버드 백",
};

export const TONE_KO: Record<Tone, string> = {
  "pure-white": "퓨어 화이트",
  ivory: "아이보리",
  champagne: "샴페인",
};

export const MOOD_KO = {
  modern: "모던",
  romantic: "로맨틱",
  classic: "클래식",
  bold: "볼드",
} as const;

/** 수치 축의 방향별 표현. high = 1 쪽, low = 0 쪽. */
export const NUMERIC_KO = {
  embellishment: { high: "화려한 비즈·자수 장식", low: "미니멀한 무장식" },
  volume: { high: "풍성한 볼륨 스커트", low: "몸선을 따르는 슬림 핏" },
  shine: { high: "글로시한 광택 소재", low: "매트한 질감" },
} as const;
