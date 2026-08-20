// 태깅 품질 회귀 — 골든셋(사람이 교정한 태깅) 대비 파이프라인 출력 비교.
// 프롬프트(lib/taste/prompt.ts)·모델을 바꾸면 이게 통과해야 merge (.claude/rules/taste-pipeline.md).
//
// 실행: web/에서 `npm run eval:taste`
// 골든셋이 아직 없으면 항상 필요한 검증(스키마·rationale)만 하고 시드 방법을 안내한다.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DressAttributesSchema } from "../src/lib/taste/schema";
import type { DressAttributes } from "../src/lib/taste/types";
import type { TaggedRow } from "./ingest";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TAGGED_PATH = path.join(REPO_ROOT, "web/src/data/tagged.json");
const GOLDEN_PATH = path.join(REPO_ROOT, "web/evals/golden.json");

// 실패선 — Cut 1 골든셋(≈100장)에서 사람이 느끼기에 "명백히 틀림"이 드물어야 하는 수준.
// 낮추려면 이유를 PR에 쓴다.
const CATEGORICAL_MIN = 0.8; // 축별 일치율
const NUMERIC_MAE_MAX = 0.2; // 수치 축 평균절대오차
const MOOD_TOP1_MIN = 0.8; // 지배 mood 일치율

const CATEGORICAL_AXES = ["silhouette", "neckline", "fabric", "sleeve", "back", "tone"] as const;
const NUMERIC_AXES = ["embellishment", "volume", "shine"] as const;

function topMood(m: DressAttributes["mood"]): string {
  return Object.entries(m).sort((a, b) => b[1] - a[1])[0][0];
}

function main() {
  if (!existsSync(TAGGED_PATH)) {
    console.error(`tagged.json 없음 — 먼저 npm run ingest`);
    process.exit(1);
  }
  const tagged = JSON.parse(readFileSync(TAGGED_PATH, "utf8")) as TaggedRow[];

  // 1. 골든셋 유무와 무관한 검증: 전 행이 스키마에 맞고 rationale이 차 있는가
  let invalid = 0;
  for (const row of tagged) {
    const parsed = DressAttributesSchema.safeParse(row.attrs);
    if (!parsed.success || !row.sourceUrl) {
      invalid++;
      console.error(`✗ 불량 행 ${row.id}: ${!row.sourceUrl ? "출처 없음" : parsed.error?.issues[0]?.message}`);
    }
  }
  console.log(`행 검증: ${tagged.length}행 중 불량 ${invalid}`);
  if (invalid > 0) process.exit(1);

  // 2. 골든셋 비교
  if (!existsSync(GOLDEN_PATH)) {
    console.log(
      `\n골든셋 없음 — 태깅 결과를 눈으로 교정한 뒤 시드한다:\n` +
        `  cp src/data/tagged.json evals/golden.json\n` +
        `  (golden.json의 attrs를 손으로 교정 — 교정한 행의 taggedBy는 "human"으로)\n` +
        `골든셋이 생기기 전까지 이 스크립트는 행 검증만 한다.`,
    );
    return;
  }
  const golden = JSON.parse(readFileSync(GOLDEN_PATH, "utf8")) as TaggedRow[];
  const goldenById = new Map(golden.map((r) => [r.id, r]));
  const pairs = tagged.filter((r) => goldenById.has(r.id));
  if (pairs.length === 0) {
    console.error("골든셋과 겹치는 id가 없다 — id 체계가 갈라졌는지 확인");
    process.exit(1);
  }

  let fail = false;
  console.log(`\n골든셋 대비 (${pairs.length}장):`);

  for (const axis of CATEGORICAL_AXES) {
    const hit = pairs.filter((r) => r.attrs[axis] === goldenById.get(r.id)!.attrs[axis]).length;
    const acc = hit / pairs.length;
    const bad = acc < CATEGORICAL_MIN;
    if (bad) fail = true;
    console.log(`  ${bad ? "✗" : "✓"} ${axis.padEnd(13)} 일치 ${(acc * 100).toFixed(0)}% (기준 ${CATEGORICAL_MIN * 100}%)`);
  }
  for (const axis of NUMERIC_AXES) {
    const mae = pairs.reduce((s, r) => s + Math.abs(r.attrs[axis] - goldenById.get(r.id)!.attrs[axis]), 0) / pairs.length;
    const bad = mae > NUMERIC_MAE_MAX;
    if (bad) fail = true;
    console.log(`  ${bad ? "✗" : "✓"} ${axis.padEnd(13)} MAE ${mae.toFixed(3)} (기준 ≤${NUMERIC_MAE_MAX})`);
  }
  {
    const hit = pairs.filter((r) => topMood(r.attrs.mood) === topMood(goldenById.get(r.id)!.attrs.mood)).length;
    const acc = hit / pairs.length;
    const bad = acc < MOOD_TOP1_MIN;
    if (bad) fail = true;
    console.log(`  ${bad ? "✗" : "✓"} mood(top-1)    일치 ${(acc * 100).toFixed(0)}% (기준 ${MOOD_TOP1_MIN * 100}%)`);
  }

  if (fail) {
    console.error("\n회귀 발생 — 프롬프트/모델 변경을 되돌리거나, 기준 하향의 이유를 PR에 쓴다.");
    process.exit(1);
  }
  console.log("\n통과");
}

main();
