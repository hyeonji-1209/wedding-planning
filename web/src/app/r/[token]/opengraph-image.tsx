// spec 화면 5 — MY WEDDING DNA 공유 카드.
// 결과가 토큰에서 결정적으로 나오므로 저장소 없이 요청 시 생성한다 (LLM 미사용 — 빠르고 무료).

import { ImageResponse } from "next/og";
import { getCatalog } from "@/data/catalog";
import { MOOD_KO } from "@/lib/taste/labels";
import { buildProfile } from "@/lib/taste/profile";
import { deterministicSummary } from "@/lib/taste/summary";
import { decodeReactions } from "@/lib/taste/token";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "내 웨딩 드레스 취향 카드";

const INK = "#37312e";
const BLUSH = "#c99a9e";
const GOLD = "#a8874f";
const MUTED = "#948a84";
const BORDER = "#e9e2dc";
const PAPER = "#fffdfb";

export default async function OgImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reactions = decodeReactions(token);
  const { images } = await getCatalog();
  const profile = reactions && buildProfile(reactions, images);

  const summary = profile ? deterministicSummary(profile) : null;
  const moods = profile
    ? (Object.keys(profile.moodPct) as (keyof typeof profile.moodPct)[]).sort(
        (a, b) => profile.moodPct[b] - profile.moodPct[a],
      )
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: PAPER,
          color: INK,
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* 헤더 — 워드마크 + 헤어라인 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: 26,
              letterSpacing: 10,
              fontWeight: 600,
            }}
          >
            WEDDING TASTE
          </div>
          <div
            style={{
              height: 1,
              marginTop: 20,
              background: `linear-gradient(90deg, ${PAPER}, ${GOLD}, ${INK}, ${GOLD}, ${PAPER})`,
            }}
          />
        </div>

        {profile && summary ? (
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 80 }}>
            {/* 왼쪽 — 취향 이름 */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ fontSize: 22, letterSpacing: 8, color: GOLD }}>MY WEDDING DNA</div>
              <div
                style={{
                  fontSize: 66,
                  fontStyle: "italic",
                  color: BLUSH,
                  marginTop: 18,
                  lineHeight: 1.15,
                  wordBreak: "keep-all",
                }}
              >
                {summary.name}
              </div>
              <div style={{ fontSize: 24, color: MUTED, marginTop: 22, lineHeight: 1.5 }}>
                {profile.preferred
                  .slice(0, 3)
                  .map((f) => f.label)
                  .join(" · ")}
              </div>
            </div>

            {/* 오른쪽 — 무드 % */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 380 }}>
              {moods.map((m) => (
                <div key={m} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 20,
                      letterSpacing: 4,
                      color: MUTED,
                    }}
                  >
                    <span>{MOOD_KO[m].toUpperCase()}</span>
                    <span style={{ fontStyle: "italic", color: GOLD }}>
                      {profile.moodPct[m]}%
                    </span>
                  </div>
                  <div style={{ display: "flex", height: 6, background: BORDER }}>
                    <div
                      style={{
                        width: `${Math.max(2, profile.moodPct[m])}%`,
                        background: BLUSH,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              fontStyle: "italic",
              color: BLUSH,
            }}
          >
            웨딩 드레스 취향 테스트
          </div>
        )}

        {/* 푸터 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 19,
            color: MUTED,
          }}
        >
          <span style={{ fontStyle: "italic" }}>업체를 찾기 전에, 취향부터.</span>
          <span style={{ letterSpacing: 4 }}>WEDDING TASTE DISCOVERY</span>
        </div>
      </div>
    ),
    size,
  );
}
