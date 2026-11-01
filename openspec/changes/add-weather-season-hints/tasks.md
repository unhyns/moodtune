## 0. 선행 조건

- [x] 0.1 `add-free-text-input`이 archive되어 `openspec/specs/ai-recommendation/spec.md`에 자유 텍스트 요구사항이 반영됐는지 확인한다. 반영 전이면 이 change를 적용하지 않는다. `openspec list`에 add-free-text-input이 진행 중으로 없으면 완료
- [x] 0.2 **변경 전 기준선 저장**(코드를 고치기 전에 수행, design.md Decision 5). 별도 git worktree(현재 커밋)에 OpenAI 스텁·세션·라이브러리 임시 스텁을 넣고, 고정 입력 (a) `{"mood":"Calm"}` (b) `{"situation":"🚙 Driving"}` (c) Calm+Driving+날씨(`icon "01d"`, 18°C) (d) Calm+Driving (e) (c)에 재시도 강제(`FORCE_MISMATCH=once`)로 시스템·사용자 프롬프트를 `before/{a..e}.json`에 저장한다. 같은 스텁으로 재시도(once)·폴백(always)의 칩·자유 텍스트 응답도 저장한다. 작업 트리에 변경이 없고 파일이 생기면 완료

## 1. 힌트 계산 모듈

- [x] 1.1 `moodtune/lib/contextHints.ts`에 `buildContextHints({ weather, mood, isFreeText, now })`를 만든다(Decision 1). 날씨 범주(01·02 맑음 / 03·04·50 흐림 / 09·10·11 비 / 13 눈), Asia/Seoul 기준 월·시, 계절 힌트, 가을 낮(06:00~17:59)/밤, 겨울 크리스마스 조건(눈, 또는 칩 경로의 Excited·Romantic), 경로별 Priority 문장을 반환한다. `pnpm build`가 통과하면 완료
- [x] 1.2 `moodtune/lib/contextHints.test.mjs`(`node --test`)에 경계값 테스트를 둔다: 날씨 icon 01d·02n·03d·04d·50d·09d·10n·11d·13d·99x·없음, 월 경계(2/28·3/1·5/31·6/1·8/31·9/1·11/30·12/1, 모두 KST), 가을 05:59·06:00·17:59·18:00, UTC 2026-11-30 15:30(= KST 12/1 00:30 → 겨울), 겨울 칩 Excited·Romantic·Calm × 눈/맑음, 자유 텍스트 겨울 눈/맑음, 날씨 없음일 때 날씨 힌트 null·계절 힌트 있음. 모두 통과하면 완료

## 2. 프롬프트 (`moodtune/lib/openai.ts`)

- [x] 2.1 `getRecommendation(request, now = new Date())`로 서버 내부 함수에 시각 인자를 더하고(`RecommendationRequest`는 바꾸지 않음), 시작할 때 이 시각으로 힌트를 한 번 계산한 뒤 첫 호출과 재시도에 같은 힌트를 넘긴다(Decision 2). 라우트는 바꾸지 않는다. `pnpm build`가 통과하면 완료
- [x] 2.2 `Context:`의 weather 줄을 `weather: ${weatherDayPhrase(weather)}`로 바꾸고, 시스템 프롬프트의 날씨 reason 규칙과 날씨 예시를 문구 기준(숫자·°C 금지, 문구를 쓰인 그대로)으로 고친다(Decision 3). 다른 규칙 줄은 건드리지 않는다. `pnpm build`가 통과하면 완료
- [x] 2.3 사용자 프롬프트의 `Context:`와 `Track list` 사이에 Hints 블록(날씨 힌트가 있으면 `weather feel`, 항상 `season feel`, 경로별 `Priority`)을 넣고, 시스템 프롬프트에 "힌트는 고를 때만 약하게 참고하고 reason에 쓰지 않는다" 규칙 한 줄을 더한다(Decision 4). `pnpm build`가 통과하면 완료
- [x] 2.4 **변경 후 프롬프트 diff(게이트)**. 0.2와 같은 스텁·입력·고정 시각으로 `after/{a..e}.json`을 만들고 before와 diff한다. 차이는 design.md Decision 5의 허용 목록(① weather 줄 ② 날씨 규칙·예시 줄 ③ 힌트 규칙 줄 ④ Hints 블록)에만 있어야 한다. 허용 목록 밖 차이가 하나라도 있으면 고친 뒤 다시 확인한다. 통과 후 임시 스텁을 지우고 worktree를 정리하면 완료
- [x] 2.5 재시도·폴백 불변 확인: 0.2와 같은 스텁으로 칩·자유 텍스트 요청의 재시도(once)·폴백(always) 응답을 저장해 before와 비교한다. 곡·`isFallback`·폴백 reason("지금 라이브러리에서 골라봤어요.")이 같고, 재시도 성공 시 칩 reason은 스텁 문장 + 출처 인용, 자유 텍스트 reason은 고정 문장이면 완료

## 3. 스텁 검증 (OpenAI 호출 없음)

- [x] 3.1 OpenAI 스텁으로 프롬프트 내용을 확인한다: 같은 입력에서 시각만 바꾼 요청(10/15 14:00, 10/15 19:30, 7/15, 1/15, 4/15 KST)의 Hints 블록이 spec 시나리오의 힌트와 일치하고, 트랙 목록 JSON은 모든 요청에서 같다(후보를 거르지 않음). 날씨 없음 요청에는 `weather feel` 줄이 없고 `season feel`은 있다. 자유 텍스트 요청은 Priority가 note 기준이다. 결과를 기록하면 완료
  - 결과(2026-11-01, OpenAI 호출 없음): 시각·날씨·경로 조합 10건의 Hints 블록이 spec과 일치, 시각만 바꾼 5건 포함 트랙 목록 동일, 날씨 없음은 `weather feel` 없이 `season feel`만 있음, 자유 텍스트는 Priority가 note 기준. 요청 본문의 `now`는 무시되고, 재시도는 첫 호출과 같은 사용자 프롬프트를 쓴다. 2.4 달라진 줄은 허용 목록 안에만 있고, 2.5 응답 15건은 변경 전과 같다

## 4. 실제 OpenAI 확인 (사용자 승인 후)

- [ ] 4.1 호출 횟수와 입력을 사용자에게 제안해 승인받는다(제안: 칩 6회 — 맑음·흐림·비·눈 각 1회 + 날씨 없음 1회 + 겨울 Excited 1회, 자유 텍스트 2회). 승인 전에는 호출하지 않는다
- [ ] 4.2 승인된 횟수만 호출해 객관 기준으로 판정한다(Decision 6): JSON이 올바르고 곡이 목록 안 / 칩 reason에 숫자 기온·"°C" 없음 / 날씨를 언급하면 Context 문구가 그대로 포함 / 계절 이름·힌트 문구("~한 느낌")·곡 특징 설명 없음 / 자유 텍스트 reason은 고정 문장. 결과를 기록하고, 기준을 어긴 경우 원인과 조정안을 기록하면 완료

## 5. 마무리

- [ ] 5.1 `pnpm lint`, `pnpm build`, `node --test lib/*.test.mjs`가 모두 통과한다
- [ ] 5.2 문서 갱신: `planning/md-design/04_TECHNICAL_DESIGN.md`의 프롬프트 구성 설명(날씨 문구, Hints 블록, 우선순위)과 필요 시 `02_REQUIREMENTS_SPEC.md` FR-7 설명. Decisions Log의 2026-10-29 항목과 서로 맞으면 완료
- [ ] 5.3 임시 스텁·로그·스냅샷이 남지 않았는지 grep(`MOODTUNE_`, `PROMPT-SNAPSHOT`, `TEST_TOKEN`)과 `git status`로 확인하고, 변경 파일 목록을 정리하면 완료
