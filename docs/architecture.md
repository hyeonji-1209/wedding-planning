# Architecture — V0

원칙: **3명이 2주 안에 만들고, 틀렸을 때 버릴 수 있는 구조.** 서비스 분리·큐·마이크로서비스 없음.

```
[Next.js 15 App Router @ Vercel]
   route handlers = 유일한 백엔드
        |
        +-- Supabase Postgres (+ pgvector)   ← 샵/이미지/속성/세션
        +-- Supabase Storage                 ← OG 공유 카드만
        +-- Anthropic API (claude-opus-5)    ← 취향 요약 (요청당 1회)

[scripts/ingest.ts]  ← 로컬 배치. 웹앱과 별개로 돈다.
   공식 소스 수집 → Claude Batch API 태깅 → Postgres
```

**결정: 별도 백엔드 서버 없음.** 트래픽이 route handler로 안 되는 순간이 오면 그건 좋은 문제고, 그때 분리한다.

---

## 데이터 모델

```sql
create extension if not exists vector;

create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,                  -- '청담' | '강남' | ...
  official_url text not null,
  instagram text,
  created_at timestamptz default now()
);

create table dress_images (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  source_url text not null,     -- 공식 출처. 원본 재호스팅 금지 (아래 §저작권)
  thumb_path text,              -- 파생 썸네일. nullable — 정책 확정 전엔 null
  attrs jsonb not null,         -- DressAttributes
  vec vector(24) not null,      -- attrs를 평탄화한 매칭 벡터
  tagged_by text not null,      -- 'claude-opus-5' | 'human' — 회귀 추적용
  created_at timestamptz default now()
);
create index on dress_images using ivfflat (vec vector_cosine_ops);

create table taste_sessions (
  id uuid primary key default gen_random_uuid(),
  share_token text unique not null,   -- 로그인 대신 이걸로 결과 URL
  reactions jsonb not null,           -- [{image_id, reaction:'like'|'pass'|'save'}]
  profile jsonb,                      -- 취향 벡터 + 이름 + rationale
  created_at timestamptz default now()
);
```

`vec`은 `attrs`에서 **결정적으로** 파생된다(one-hot + 수치축). 파생 함수는 한 곳(`lib/taste/vector.ts`)에만 존재하고 테스트가 붙는다. 두 벌로 갈라지는 순간 추천이 조용히 망가진다.

---

## AI 사용처 — 딱 두 군데

| 용도 | 모델 | 방식 |
|---|---|---|
| 이미지 → `DressAttributes` | `claude-opus-5` | **Batch API** (50% 비용), structured outputs (`output_config.format`), 오프라인 1회 |
| 취향 프로필 요약(이름 + 설명문) | `claude-opus-5` | 요청당 1회, `thinking: {type:"adaptive"}`, `effort: "medium"` |

**매칭 자체에는 LLM을 쓰지 않는다.** 코사인 유사도 = 즉시·무료·결정적·테스트 가능. LLM은 태깅과 문장화만 담당한다.
Anthropic에는 임베딩 엔드포인트가 없다. CLIP류 이미지 임베딩은 V0에서 **쓰지 않는다** — 속성 벡터는 설명 가능하고("왜 매치인지"가 공짜로 나온다), 임베딩은 그렇지 않다. 속성 축으로 못 잡는 취향이 인터뷰에서 반복 관찰되면 그때 하이브리드로 간다.

태깅 프롬프트와 골든셋은 `lib/taste/prompt.ts` / `evals/golden.json`에 산다. **프롬프트 수정 = `pnpm eval:taste` 통과 필수.** 이게 이 제품의 유일한 회귀 방어선이다.

---

## 저작권 (§리스크 1순위)

- 업체 포트폴리오 **원본을 우리 스토리지에 복제·재배포하지 않는다.**
- 저장하는 것: 공식 출처 URL, 우리가 생성한 속성값, 출처 표기.
- 표시: 공식 소스 링크 + 출처 명시. 썸네일 캐싱은 각 업체 이용약관 확인 후 개별 판단, 기본값은 캐싱 안 함.
- 인스타그램 이미지 스크랩 → **금지.** 공식 홈페이지/공개 컬렉션만.
- 업체가 내려달라고 하면 즉시 내린다. `shops` 삭제 → cascade로 이미지까지 정리된다.

> 이건 기술 결정이 아니라 사업 리스크 결정이다. 우회 아이디어가 떠오르면 코드로 옮기지 말고 Open Question으로 올린다.

---

## 안 하는 것 (그리고 언제 하는지)

| 안 함 | 할 때 |
|---|---|
| 로그인/계정 | 사용자가 결과를 다시 찾고 싶어할 때 |
| 실시간 태깅 API | 사용자가 자기 사진을 올리고 싶어할 때 |
| CLIP/하이브리드 임베딩 | 속성 축으로 못 잡는 취향이 인터뷰에서 반복될 때 |
| 캐싱/CDN 튜닝 | 실제로 느릴 때 |
| 가격·예약 | V0 성공 기준 통과 후 |
