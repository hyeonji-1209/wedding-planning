"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareLink() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "내 웨딩 드레스 취향", url });
        return;
      } catch {
        // 사용자가 시트를 닫은 경우 — 복사로 이어가지 않는다
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "링크가 복사됐어요" : "결과 링크 공유하기"}
      className="transition-colors hover:text-blush"
    >
      {copied ? (
        <Check className="size-4 text-blush" strokeWidth={1.4} />
      ) : (
        <Share2 className="size-4" strokeWidth={1.2} />
      )}
    </button>
  );
}
