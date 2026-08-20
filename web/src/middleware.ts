// Cut 1 배포는 비공개다 (docs/kickoff.md) — 이미지 소싱 정책상 산출물이 팀 밖으로 나가면 안 된다.
// Vercel 무료 플랜엔 deployment protection이 없어서 Basic Auth로 잠근다.
// SITE_PASSWORD가 없는 환경(로컬 dev)은 통과 — 배포 env에만 설정한다.

import { NextResponse, type NextRequest } from "next/server";

const ROBOTS = "noindex, nofollow";

export function middleware(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const supplied = decoded.slice(decoded.indexOf(":") + 1);
      if (supplied === password) {
        const response = NextResponse.next();
        response.headers.set("X-Robots-Tag", ROBOTS);
        return response;
      }
    } catch {
      // 잘못된 base64 — 아래 401로
    }
  }

  return new NextResponse("비공개 프로토타입입니다.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="wedding-taste"',
      "X-Robots-Tag": ROBOTS,
    },
  });
}

// 전 경로 보호. _next 정적 리소스도 예외로 두지 않는다 —
// 브라우저는 인증 후 같은 오리진 요청에 자격증명을 자동으로 실어 보낸다.
export const config = {
  matcher: "/(.*)",
};
