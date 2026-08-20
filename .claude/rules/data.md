---
paths:
  - "web/src/data/**"
  - "supabase/**"
  - "web/src/lib/db/**"
---

# 데이터 규칙

- 아직 DB가 없다. 데이터는 `web/src/data/seed.ts`에 있고 Supabase는 Cut 2에 붙인다. 아래 규칙은 그때부터 적용된다.
- **스키마를 바꾸면 슬랙에 먼저 알린다.** 3명이 같은 DB를 쓴다. 마이그레이션 충돌은 이 팀의 1순위 사고 유형이다.
- 마이그레이션은 앞으로만 간다. 이미 push된 마이그레이션 파일을 수정하지 말고 새로 추가한다.
- `dress_images.vec`은 `attrs`에서 결정적으로 파생된다. 손으로 채워 넣지 않는다.
- 업체가 내려달라고 하면 `shops` 행 삭제 → cascade로 정리된다. 이 경로를 깨뜨리지 말 것.
- 이미지 바이너리를 레포에 커밋하지 않는다. `data/seed-shops.json`과 `web/src/data/seed.ts`에는 출처 URL만 둔다.
- 시드/더미 데이터는 `supabase/seed.sql`. 테스트가 프로덕션 데이터에 의존하지 않게 한다.
