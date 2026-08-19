---
paths:
  - "lib/taste/**"
  - "scripts/ingest*"
  - "evals/**"
---

# 취향 파이프라인 규칙

- **벡터 파생 로직은 `lib/taste/vector.ts` 한 곳에만 존재한다.** `attrs` → `vec` 변환을 다른 데서 다시 쓰면 추천이 조용히 갈라진다. 테스트 필수.
- 태깅 프롬프트(`lib/taste/prompt.ts`)를 고치면 **`pnpm eval:taste`가 통과해야 merge**한다. 이게 이 제품의 유일한 회귀 방어선이다.
- 태깅은 structured outputs(`output_config.format`)로 받는다. 자유 텍스트 파싱 금지.
- `rationale` 필드는 옵션이 아니다. 비어 있으면 그 행은 불량 데이터다.
- 대량 태깅은 Batch API. 실시간 루프로 600장 돌리지 말 것.
- 모델을 바꾸면 `docs/kickoff.md` Q4에 결과를 기록한다. 비용이 아니라 골든셋 정확도로 판단.
