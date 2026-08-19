// 결과 영구 URL — 로그인 대신 반응 자체를 토큰에 담는다 (docs/kickoff.md Decision Log).
// 파이프라인이 결정적이므로 토큰만 있으면 결과는 언제 열어도 같다.
// 클라이언트(수집 완료 시)와 서버(결과 렌더) 양쪽에서 돌아야 해서 Buffer를 쓰지 않는다.

import type { Reaction, ReactionKind } from "./types";

const CODE: Record<ReactionKind, string> = { like: "l", pass: "p", save: "s" };
const KIND: Record<string, ReactionKind> = { l: "like", p: "pass", s: "save" };

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = (typeof btoa === "function" ? btoa(binary) : "") || "";
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): string | null {
  try {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function encodeReactions(reactions: Reaction[]): string {
  const compact = reactions.map((r) => [CODE[r.reaction], r.imageId].join(":")).join(",");
  return toBase64Url(compact);
}

export function decodeReactions(token: string): Reaction[] | null {
  const compact = fromBase64Url(token);
  if (!compact) return null;
  const reactions: Reaction[] = [];
  for (const part of compact.split(",")) {
    const idx = part.indexOf(":");
    if (idx < 1) return null;
    const reaction = KIND[part.slice(0, idx)];
    const imageId = part.slice(idx + 1);
    if (!reaction || !imageId) return null;
    reactions.push({ imageId, reaction });
  }
  return reactions;
}
