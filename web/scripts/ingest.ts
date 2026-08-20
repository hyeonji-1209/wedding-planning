// 이미지 태깅 파이프라인 — 로컬 배치 (docs/architecture.md).
// data/seed-images/<handle>/* → Supabase Storage 업로드 → Claude Batch API 태깅 → web/src/data/tagged.json
//
// 실행: web/에서 `npm run ingest` (전체) 또는 `npm run ingest -- --limit 5` (스모크)
// 필요 env (.env.local): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
//
// 멱등성: 이미 tagged.json에 있는 id는 건너뛰고, Storage 업로드는 이미 있으면 스킵.
// 배치 제출 후 중단돼도 data/.ingest-state.json으로 다음 실행에서 폴링을 이어간다.

import { existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient } from "@supabase/supabase-js";

import { TAGGING_PROMPT } from "../src/lib/taste/prompt";
import { DressAttributesSchema, normalizeMood } from "../src/lib/taste/schema";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SEED_IMAGES_DIR = path.join(REPO_ROOT, "data/seed-images");
const SHOPS_JSON = path.join(REPO_ROOT, "data/seed-shops.json");
const TAGGED_PATH = path.join(REPO_ROOT, "web/src/data/tagged.json");
const STATE_PATH = path.join(REPO_ROOT, "data/.ingest-state.json");

const BUCKET = "seed-images";
const MODEL = "claude-opus-5"; // 모델 변경 시 docs/kickoff.md Q4에 골든셋 결과 기록
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024; // API 이미지 한도 5MB에 여유
const MEDIA_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

type ShopSeed = {
  name: string;
  handle: string;
  official_url: string | null;
  instagram: string | null;
  source: string;
};

export type TaggedRow = {
  /** `<handle>/<파일명(확장자 제외)>` — Storage 경로·골든셋과 공유하는 키 */
  id: string;
  shopHandle: string;
  /** Storage 내 경로. 서빙 시 서버에서 서명 URL로 변환한다 (원본 비공개 정책) */
  storagePath: string;
  /** 출처. 파일명(인스타 미디어 ID)만으론 게시물 URL을 복원할 수 없어 샵 프로필/사이트가 기본값 */
  sourceUrl: string;
  credit: string;
  taggedBy: string;
  attrs: ReturnType<typeof DressAttributesSchema.parse>;
};

type BatchState = {
  batchId: string;
  /** custom_id → 행 메타. 배치 결과를 원래 이미지와 다시 잇는 지도 */
  rows: Record<string, Omit<TaggedRow, "attrs" | "taggedBy">>;
};

function readJson<T>(file: string): T | null {
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : null;
}

function listImages(handle: string): string[] {
  const dir = path.join(SEED_IMAGES_DIR, handle);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => MEDIA_TYPES[path.extname(f).toLowerCase()])
    .sort();
}

async function main() {
  // ANTHROPIC_API_KEY는 강제하지 않는다 — SDK가 `ant auth login` 프로필로도 인증한다
  for (const key of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[key]) throw new Error(`${key} 없음 — web/.env.local 확인 (.env.example 참고)`);
  }
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

  const anthropic = new Anthropic();
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const shops = readJson<{ shops: ShopSeed[] }>(SHOPS_JSON)?.shops;
  if (!shops) throw new Error(`${SHOPS_JSON} 없음`);
  const tagged: TaggedRow[] = readJson<TaggedRow[]>(TAGGED_PATH) ?? [];
  const taggedIds = new Set(tagged.map((r) => r.id));

  // 이전 실행이 배치 제출 후 중단됐으면 폴링부터 재개
  let state = readJson<BatchState>(STATE_PATH);

  if (!state) {
    const pending: { handle: string; file: string; shop: ShopSeed }[] = [];
    for (const shop of shops) {
      const files = listImages(shop.handle);
      if (files.length === 0) {
        console.warn(`⚠ ${shop.handle}: data/seed-images/에 이미지 없음 — 건너뜀`);
        continue;
      }
      for (const file of files) {
        const id = `${shop.handle}/${path.parse(file).name}`;
        if (!taggedIds.has(id)) pending.push({ handle: shop.handle, file, shop });
      }
    }
    const batchItems = pending.slice(0, limit);
    console.log(`대상 ${pending.length}장 중 이번 실행 ${batchItems.length}장 (기태깅 ${taggedIds.size}장 스킵)`);
    if (batchItems.length === 0) return;

    const rows: BatchState["rows"] = {};
    const requests: Anthropic.Messages.BatchCreateParams.Request[] = [];

    for (const [i, { handle, file, shop }] of batchItems.entries()) {
      const filePath = path.join(SEED_IMAGES_DIR, handle, file);
      if (statSync(filePath).size > MAX_IMAGE_BYTES) {
        console.warn(`⚠ ${handle}/${file}: 4.5MB 초과 — 건너뜀 (normalize-seed.sh로 축소)`);
        continue;
      }
      const storagePath = `${handle}/${file}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, readFileSync(filePath), { contentType: MEDIA_TYPES[path.extname(file).toLowerCase()], upsert: false });
      if (error && !`${error.message}`.includes("already exists")) {
        throw new Error(`Storage 업로드 실패 ${storagePath}: ${error.message}`);
      }

      const customId = `img-${i}`;
      rows[customId] = {
        id: `${handle}/${path.parse(file).name}`,
        shopHandle: handle,
        storagePath,
        sourceUrl: shop.instagram ?? shop.official_url ?? "",
        credit: handle,
      };
      requests.push({
        custom_id: customId,
        params: {
          model: MODEL,
          max_tokens: 8000,
          output_config: { format: zodOutputFormat(DressAttributesSchema) },
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: MEDIA_TYPES[path.extname(file).toLowerCase()],
                    data: readFileSync(filePath).toString("base64"),
                  },
                },
                { type: "text", text: TAGGING_PROMPT },
              ],
            },
          ],
        },
      });
    }
    if (requests.length === 0) return;

    const batch = await anthropic.messages.batches.create({ requests });
    state = { batchId: batch.id, rows };
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
    console.log(`배치 제출: ${batch.id} (${requests.length}건). 중단해도 재실행하면 이어서 폴링한다.`);
  } else {
    console.log(`미완료 배치 재개: ${state.batchId}`);
  }

  // 폴링 — 대부분 1시간 내, 최대 24시간 (Batch API)
  for (;;) {
    const batch = await anthropic.messages.batches.retrieve(state.batchId);
    if (batch.processing_status === "ended") break;
    console.log(`폴링: ${batch.processing_status}, 남은 ${batch.request_counts.processing}건`);
    await new Promise((r) => setTimeout(r, 30_000));
  }

  let ok = 0;
  let failed = 0;
  for await (const result of await anthropic.messages.batches.results(state.batchId)) {
    const meta = state.rows[result.custom_id];
    if (!meta) continue;
    if (result.result.type !== "succeeded") {
      failed++;
      console.warn(`✗ ${meta.id}: ${result.result.type}`);
      continue;
    }
    const text = result.result.message.content.find((b) => b.type === "text");
    try {
      const attrs = normalizeMood(DressAttributesSchema.parse(JSON.parse(text ? text.text : "")));
      tagged.push({ ...meta, taggedBy: MODEL, attrs });
      ok++;
    } catch (e) {
      failed++;
      console.warn(`✗ ${meta.id}: 스키마 불일치 — ${e instanceof Error ? e.message.slice(0, 120) : e}`);
    }
  }

  tagged.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(TAGGED_PATH, JSON.stringify(tagged, null, 2) + "\n");
  unlinkSync(STATE_PATH);
  console.log(`완료: 성공 ${ok} / 실패 ${failed} → ${path.relative(REPO_ROOT, TAGGED_PATH)} (총 ${tagged.length}행)`);
  console.log(`다음: 결과를 눈으로 훑어 교정 → web/evals/golden.json 시드 (docs/kickoff.md 품질 방어선)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
