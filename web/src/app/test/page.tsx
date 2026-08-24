// spec 화면 2 — 스와이프. 덱은 서버에서 카탈로그를 샘플링해 내려준다 (서명 URL이 서버 전용이라서).
// 토큰은 imageId만 담으므로 덱이 매번 달라도 결과 URL은 결정적이다.

import { getCatalog, sampleDeck } from "@/data/catalog";
import { SwipeDeck } from "./swipe-deck";

// 서명 URL은 만료되고 덱은 요청마다 새로 뽑는다 — 정적 프리렌더 금지
export const dynamic = "force-dynamic";

export default async function TestPage() {
  const { images } = await getCatalog();
  return <SwipeDeck deck={sampleDeck(images)} />;
}
