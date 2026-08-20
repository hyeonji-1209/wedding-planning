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

> **Cut 1에서는 이 스키마를 만들지 않는다** (Decision Log 2026-08-20). 태깅 결과는
> `web/src/data/tagged.json`으로 커밋되고, 시드 이미지는 Supabase Storage 비공개 버킷에서
> 서명 URL로 서빙된다. 아래 스키마는 600장·30곳이 되는 Cut 2의 목표 구조다.

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
  vec vector(36) not null,      -- attrs 평탄화: one-hot 29 + 수치 3 + mood 4 (lib/taste/vector.ts VECTOR_DIM)
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

## 이미지 소싱 — 공개 범위에 따라 규칙이 다르다

한국 드레스샵은 **인스타그램이 사실상 홈페이지다.** 시드 4곳 중 자체 사이트가 있는 건 헤스티아 한 곳뿐이고, 30곳으로 늘려도 비율은 비슷할 것이다. "공식 사이트만"이라는 규칙은 데이터를 굶긴다.

그래서 소스가 아니라 **우리가 그 이미지를 얼마나 공개하는지**로 규칙을 나눈다.

| 단계 | 공개 범위 | 이미지 취급 |
|---|---|---|
| **Cut 1** 비공개 프로토타입 | 팀 + 첫 사용자. 비공개 URL | 사람이 수동 수집 → 로컬 태깅. 재배포 없음 |
| **Cut 3** 공개 | 누구나 | 인스타 공식 임베드, 또는 샵 허락받은 이미지만 |
| 제휴 이후 | 정식 서비스 | 샵이 제공한 에셋 |

단계와 무관하게 항상:

- 이미지마다 **출처 URL과 계정을 저장한다.** 출처 없는 행은 불량 데이터다
- 이미지 파일은 **git에 넣지 않는다** (`.gitignore`)
- 우리 제품 데이터의 본체는 이미지가 아니라 **우리가 생성한 속성값**이다. 이미지는 언제든 버릴 수 있어야 한다
- 샵이 내려달라고 하면 즉시 내린다. `shops` 행 삭제 → cascade

### 우회로는 없다

공개 배포에서 남의 이미지를 우리 서버로 재배포하는 것을 합법으로 만드는 방법은 없다. 공개 단계의 선택지는 셋뿐이다:

1. **인스타 공식 임베드** — 합법이지만 카드마다 iframe이라 스와이프 UX가 죽는다
2. **샵 허락** — 가장 깨끗하고, 그 연락 자체가 첫 B2B 접촉이 된다 (`docs/product-vision.md` §16)
3. **사용자가 자기 사진을 올린다** — 우리가 배포하지 않으니 문제가 사라진다. 대신 진입 마찰이 크게 오른다

Cut 2 안에 셋 중 하나를 고른다 (`docs/kickoff.md` Q1). Cut 1에서 미리 정하지 않는다 — 그때 뭘 알게 될지 모른다.

## 안 하는 것 (그리고 언제 하는지)

| 안 함 | 할 때 |
|---|---|
| 로그인/계정 | 사용자가 결과를 다시 찾고 싶어할 때 |
| 실시간 태깅 API | 사용자가 자기 사진을 올리고 싶어할 때 |
| CLIP/하이브리드 임베딩 | 속성 축으로 못 잡는 취향이 인터뷰에서 반복될 때 |
| 캐싱/CDN 튜닝 | 실제로 느릴 때 |
| 가격·예약 | V0 성공 기준 통과 후 |
