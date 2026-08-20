// 이미지 → DressAttributes 태깅 프롬프트.
// ⚠️ 이 파일을 고치면 `pnpm eval:taste` 통과 없이 merge 금지 (.claude/rules/taste-pipeline.md).
// 출력 형식은 structured outputs(schema.ts)가 강제하므로 여기서는 판단 기준만 쓴다.

export const TAGGING_PROMPT = `당신은 웨딩드레스 스타일 분석가다. 이 사진 속 웨딩드레스 한 벌의 속성을 채운다.
드레스가 여러 벌이면 화면의 주인공(가장 크게, 초점 맞게 나온) 드레스만 분석한다.

각 축의 판단 기준:

silhouette — 전체 실루엣
- a-line: 허리에서 치마가 자연스러운 A자로 퍼짐
- ballgown: 허리 아래가 최대로 부풀어 오른 풀스커트
- mermaid: 무릎 부근까지 몸에 밀착 후 아래에서 퍼짐 (트럼펫 포함)
- sheath: 퍼짐 없이 몸을 따라 일자로 떨어짐 (슬립 드레스 포함)
- empire: 가슴 바로 아래에서 절개되어 떨어짐

neckline — 앞 네크라인: straight(일자) / v(브이) / sweetheart(하트) / halter(홀터) / off-shoulder(오프숄더) / high(하이넥)

fabric — 겉감에서 가장 지배적인 소재 하나
- silk-satin: 매끄럽고 광택 있는 새틴류
- crepe: 매트하고 잔잔한 질감
- tulle: 망사가 겹쳐 비치는 스커트
- lace: 레이스가 표면을 지배
- organza: 얇고 빳빳하게 비치는 소재
- mikado: 두껍고 구조적이며 광택 있는 소재

sleeve: none(민소매·튜브탑) / cap(어깨만 살짝) / long-sheer(긴 시스루 소매) / puff(퍼프) / detachable(탈부착으로 보이는 소매·케이프)

back — 뒷모습이 안 보이면 앞 디자인에서 가장 개연성 높은 값을 고른다: open(등 트임) / low-v(깊은 브이백) / illusion(시스루 백) / covered(막힌 등)

tone — 조명·보정을 감안한 원단 자체의 톤: pure-white / ivory / champagne

수치 축 (0~1):
- embellishment: 0=무장식, 0.3=은은한 비즈·자수, 0.7=면적 대부분에 장식, 1=풀비즈
- volume: 0=바디컨 수준 밀착, 0.4=완만한 A라인, 0.7=풍성한 볼륨, 1=최대 볼가운
- shine: 0=완전 매트, 0.5=은은한 광, 1=글로시

mood — 이 드레스의 분위기 분포. modern(절제·구조적·미니멀), romantic(부드러움·러플·레이스·볼륨), classic(전통적 우아함·정석), bold(과감한 노출·강한 실루엣·드라마틱). 합이 1이 되게.

rationale — 한국어 한 문장. 결과 화면에 사용자에게 그대로 노출된다.
- 이 드레스의 취향 신호를 구체적 시각 근거로 요약한다. 예: "장식 없는 미카도 원단이 각 잡힌 스트레이트 네크라인으로 떨어지는 구조적인 드레스."
- "이 사진은", "이 이미지에는" 같은 메타 표현 금지. 드레스 자체만 말한다.`;
