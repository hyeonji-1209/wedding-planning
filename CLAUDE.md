# Wedding Taste Discovery

**업체를 찾기 전에, 내가 원하는 결혼식부터 찾는 서비스.**
V0 범위는 **드레스 한 카테고리**뿐. 스튜디오/메이크업/가격/예약은 아직 만들지 않는다.

## Commands

```bash
pnpm dev                      # localhost:3000
pnpm check                    # typecheck + lint + test (커밋 전 이거 하나만)
pnpm test --reporter=dot      # 조용한 테스트 출력
pnpm ingest -- --limit 20     # 이미지 태깅 파이프라인 (Batch API)
pnpm eval:taste               # 골든셋 대비 추천 품질 회귀
```

출력이 긴 명령은 항상 quiet 플래그로. 로그를 대화창에 쏟지 말 것.

## Stack

Next.js 15 (App Router, TS) · Supabase (Postgres + pgvector + Storage) · Vercel ·
Anthropic SDK `claude-opus-5` (`thinking: {type:"adaptive"}`, 이미지 태깅은 Batch API)

## Rules

- **한 세션 = 한 Outcome.** 끝나면 `/clear`. 세션 시작 시 `/model`·`/effort` 먼저 고정 (중간 변경은 캐시 파기).
- 기존 구조 먼저 조사 → **최소 변경**으로 구현. 추상화는 두 번째 사용처가 생기면 그때.
- 추천 결과에는 **항상 근거**가 붙는다. 점수만 뱉는 코드는 리뷰에서 반려.
- 이미지 **원본을 우리 스토리지에 재배포하지 않는다.** 공식 출처 URL + 메타데이터 + 우리가 생성한 속성값만.
- 포지셔닝: **"AI 웨딩플래너"라는 표현을 카피·UI·문서 어디에도 쓰지 않는다.** (웨딩북이 선점)
- main은 항상 동작. 작은 PR을 자주. force push 금지 (3명이 공유하는 브랜치다).
- 막히면 물어보기 전에 만들어서 보여준다. 하루짜리 프로토타입이 일주일짜리 논의보다 싸다.
- 모르는 제품 결정은 지어내지 말고 `docs/kickoff.md`의 Open Questions에 추가.

## 문서 — 필요할 때 읽는다 (자동 로드 아님)

| 언제 | 읽을 것 |
|---|---|
| 지금 뭘 하는 중인지 / 우선순위 | `docs/kickoff.md` |
| 범위·스키마·성공 기준을 확인할 때 | `docs/spec-v0.md` |
| 데이터 모델·저작권·AI 사용처 | `docs/architecture.md` |
| 협업 방식·에이전트 운영 규칙 | `docs/working-agreement.md` |
| 장기 그림 (V0 범위 밖) | `docs/product-vision.md` |

영역별 규칙은 `.claude/rules/`에 있고 **해당 파일을 건드릴 때만 자동 로드**된다.
