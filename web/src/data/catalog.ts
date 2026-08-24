// 카탈로그 — 앱이 보는 샵·이미지의 단일 진입점.
// 실데이터: web/src/data/tagged.json(태깅 파이프라인 출력, scripts/ingest.ts) + data/seed-shops.json.
// 이미지는 Supabase Storage 비공개 버킷이라 서버에서 서명 URL로 바꿔 내려준다 (docs/kickoff.md Decision Log).
// tagged.json이 비어 있거나 Storage env가 없으면 Unsplash 시드(seed.ts)로 대체한다 — 로컬/테스트용.

import "server-only";

import { createClient } from "@supabase/supabase-js";

import seedShops from "../../../data/seed-shops.json";
import type { DressImage, Shop } from "@/lib/taste/types";
import { DRESS_IMAGES, SHOPS } from "./seed";
import tagged from "./tagged.json";
import { pickDeck, shopsFromSeed, toDressImage, type ShopSeed, type TaggedRow } from "./catalog-core";

export { DECK_SIZE } from "./catalog-core";

export type Catalog = { shops: Shop[]; images: DressImage[] };

const BUCKET = "seed-images"; // scripts/ingest.ts와 같은 버킷
const SIGN_TTL_SEC = 60 * 60;
const CACHE_TTL_MS = 45 * 60 * 1000; // 서명 만료(60분) 전에 갱신

let cached: { at: number; catalog: Catalog } | null = null;
let warned = false;

const rows = tagged as TaggedRow[];
const shopSeeds = (seedShops as { shops: ShopSeed[] }).shops;

function fallback(reason: string): Catalog {
  if (!warned && process.env.NODE_ENV !== "test") {
    warned = true;
    console.warn(`[catalog] ${reason} — Unsplash 시드로 대체`);
  }
  return { shops: SHOPS, images: DRESS_IMAGES };
}

async function signAll(paths: string[]): Promise<Map<string, string>> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 없음");
  const supabase = createClient(url, key);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGN_TTL_SEC);
  if (error) throw error;
  const signed = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
  }
  return signed;
}

export async function getCatalog(): Promise<Catalog> {
  if (rows.length === 0) return fallback("tagged.json이 비어 있음");
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.catalog;

  const shops = shopsFromSeed(shopSeeds);
  const byHandle = new Map(shops.map((s) => [s.id, s]));

  let signed: Map<string, string>;
  try {
    signed = await signAll(rows.map((r) => r.storagePath));
  } catch (e) {
    return fallback(`Storage 서명 실패: ${e instanceof Error ? e.message : String(e)}`);
  }

  const images: DressImage[] = [];
  for (const row of rows) {
    const shop = byHandle.get(row.shopHandle);
    const src = signed.get(row.storagePath);
    if (!shop || !src) continue; // 샵 정보나 파일이 없는 행은 화면에 올리지 않는다
    images.push(toDressImage(row, shop, src));
  }
  const usedShops = shops.filter((s) => images.some((img) => img.shopId === s.id));

  cached = { at: Date.now(), catalog: { shops: usedShops, images } };
  return cached.catalog;
}

/** 스와이프 덱 — 샵 골고루, 기본 25장. 요청마다 새로 뽑는다. */
export function sampleDeck(images: DressImage[], size?: number): DressImage[] {
  return pickDeck(images, Math.random, size);
}
