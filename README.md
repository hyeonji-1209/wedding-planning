# Wedding Taste Discovery

> 업체를 찾기 전에, 내가 원하는 결혼식부터 찾는 서비스
> *Don't search vendors. Find your taste.*

V0는 **드레스 한 카테고리**로 가설 하나만 검증한다 — 사람들은 자기 시각적 취향을 언어화하지 못하고, AI가 대신 해주면 인스타 검색 대신 이걸 쓴다.

| 문서 | 용도 |
|---|---|
| [docs/kickoff.md](docs/kickoff.md) | **지금 뭐 하는 중인지.** 여기부터 읽는다 (Cut 1: 3일 내 프로토타입) |
| [docs/spec-v0.md](docs/spec-v0.md) | V0 범위·스키마·성공 기준 |
| [docs/architecture.md](docs/architecture.md) | 구조·데이터 모델·저작권 정책 |
| [docs/working-agreement.md](docs/working-agreement.md) | 3인 협업 + 코딩 에이전트 규칙 |
| [docs/product-vision.md](docs/product-vision.md) | 장기 그림 (V0 범위 아님) |
| [docs/raw-conversation.md](docs/raw-conversation.md) | 아이디어 발단 원본 대화 (참고용) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 브랜치·PR·에이전트 리뷰 흐름 |
| [CLAUDE.md](CLAUDE.md) | 에이전트 세션에 매번 로드되는 규칙 |

## 라이선스

[AGPL-3.0](LICENSE). 코드는 열려 있고, 이 코드를 서비스로 올리는 사람은 자기 수정분도 공개해야 한다.
지적재산은 기여자들이 보유하므로 필요하면 별도의 상업 라이선스를 병행할 수 있다.

라이선스가 덮는 것은 **우리가 쓴 코드와 우리가 생성한 데이터**(속성 태깅, `data/dress-meta.json`)다.
드레스샵 포트폴리오 이미지는 각 업체의 저작물이고 이 레포에 포함되지 않는다 —
`data/seed-images/`는 gitignore이며 출처 기록만 남긴다. `docs/architecture.md`의 이미지 소싱 참고.
