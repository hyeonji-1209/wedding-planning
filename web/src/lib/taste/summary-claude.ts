// AI 사용처 #2 (docs/architecture.md): 취향 프로필 요약 — claude-opus-5, 요청당 1회,
// thinking adaptive + effort medium. 매칭에는 LLM을 쓰지 않는다.
// 서버 전용 — 클라이언트 번들에 들어가면 안 된다.

import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import type { TasteProfile } from "./profile";
import { deterministicSummary, type TasteSummary } from "./summary";

const SummarySchema = z.object({
  name: z.string(),
  description: z.string(),
});

export async function generateSummary(profile: TasteProfile): Promise<TasteSummary> {
  if (!process.env.ANTHROPIC_API_KEY) return deterministicSummary(profile);

  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: zodOutputFormat(SummarySchema),
      },
      system:
        "너는 웨딩 드레스 취향 프로필에 이름을 붙이는 카피라이터다. " +
        "과장 없이, 데이터에 있는 속성만 언급한다. " +
        "이름은 한국어 2~4어절, 설명은 두 문장 이내. " +
        "'AI 웨딩플래너'라는 표현은 절대 쓰지 않는다.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            moodPct: profile.moodPct,
            preferred: profile.preferred.map((f) => f.label),
            avoided: profile.avoided.map((f) => f.label),
          }),
        },
      ],
    });
    const parsed = response.parsed_output;
    if (!parsed) return deterministicSummary(profile);
    return { name: parsed.name, description: parsed.description, generatedBy: "claude-opus-5" };
  } catch {
    // 요약 실패가 결과 화면을 죽이면 안 된다 — 결정적 요약으로 대체
    return deterministicSummary(profile);
  }
}
