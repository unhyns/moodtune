## 0. 기준선

- [x] 0.1 **변경 전 기준선 저장**(코드를 고치기 전에 수행, design.md Decision 4). 별도 git worktree(`9b9e4ce`)에 세션·라이브러리·OpenAI 임시 스텁을 넣고, 고정 시각과 고정 입력 (a) `{"mood":"Calm"}` (b) `{"situation":"🚙 Driving"}` (c) Calm+Driving+날씨(`icon "01d"`, 18°C) (d) Calm+Driving (e) (c)에 재시도 강제로 시스템·사용자 프롬프트를 `before/{a..e}.json`에, 재시도·폴백의 칩·자유 텍스트 응답을 `responses.json`에 저장한다. OpenAI를 호출하지 않고, 작업 트리에 변경이 없으면 완료

## 1. 섞기 함수

- [x] 1.1 `moodtune/lib/shuffle.ts`에 Fisher-Yates `shuffled(items, random)`을 만든다(Decision 1). `pnpm build`가 통과하면 완료
- [x] 1.2 `moodtune/lib/shuffle.test.mjs`(`node --test`)에 테스트를 둔다: 결과의 원소 집합·개수가 입력과 같음(중복·누락 없음), 입력 배열이 바뀌지 않음, 고정 난수에서 같은 결과, 1에 가까운 난수에서 원래 순서 유지, 다른 고정 난수에서 순서가 달라짐, 빈 배열·1개 배열. 모두 통과하면 완료

## 2. 프롬프트와 폴백 (`moodtune/lib/openai.ts`)

- [x] 2.1 `getRecommendation(request, now = new Date(), random = Math.random)`로 난수 인자를 더하고(`RecommendationRequest`와 라우트는 바꾸지 않음), 시작할 때 한 번 섞어 첫 호출과 재시도에 같은 순서를 넘긴다. 곡 대조와 폴백은 원래 `librarySample`을 그대로 쓴다(Decision 2). `pnpm build`가 통과하면 완료
- [x] 2.2 시스템 프롬프트에 순서 안내 한 줄을 넣는다(Decision 3). 다른 줄은 건드리지 않는다. `pnpm build`가 통과하면 완료
- [x] 2.3 **프롬프트 diff 게이트**(Decision 4). 0.1과 같은 스텁·입력·시각으로 (1) 원래 순서를 유지하는 고정 난수: 차이가 안내 한 줄뿐, (2) 실제로 섞는 고정 난수: 트랙 목록의 원소 집합이 같고 순서만 다르며 나머지 차이는 안내 한 줄뿐임을 확인한다. 허용 밖 차이가 하나라도 있으면 고친 뒤 다시 확인하고, 통과하면 완료

## 3. 스텁 검증 (OpenAI 호출 없음)

- [x] 3.1 스텁 서버로 확인한다: 칩·자유 텍스트 모두 후보 집합이 라이브러리 샘플과 같고 안내 한 줄이 있다, 서로 다른 고정 난수에서 순서가 다르다, 기본값(`Math.random`)에서 두 요청의 순서가 달라질 수 있다, 재시도의 사용자 프롬프트가 첫 호출과 같다, 본문에 `random`·`seed`·`order`를 보내도 무시된다. 결과를 기록하면 완료
- [x] 3.2 폴백·재시도 불변 확인: 섞는 고정 난수를 쓴 상태에서 폴백이 **원래 순서의 첫 곡**이고 reason·`isFallback`이 0.1 응답과 같으며, 재시도 성공 응답도 0.1과 같으면 완료
  - 결과(2026-11-01, OpenAI 호출 없음): 2.3 게이트 1·2 통과. 칩·자유 텍스트 모두 후보 집합 동일에 안내 한 줄 있음, 고정 난수는 재현되고 난수가 다르면 순서가 다름, 기본 `Math.random`에서도 순서가 달라짐, 재시도는 첫 호출과 같은 순서, 본문의 `random`·`seed`·`order`·`candidates`는 영향 없음. 폴백은 원래 순서 첫 곡이고 응답 15건은 변경 전과 같다

## 4. 실제 OpenAI 확인 (사용자 승인 후)

- [ ] 4.1 입력과 횟수를 사용자에게 제안해 승인받는다(최대 6회, 재시도 포함). 승인 전에는 호출하지 않는다
- [ ] 4.2 승인된 횟수만 호출한다(Decision 5). 재시도가 필요해지거나 429·오류가 나면 멈추고, 로그는 사용자 확인 전까지 지우지 않는다. 호출마다 고른 곡, 원래 목록 위치, 섞인 위치, reason을 표로 기록하고 기존 판정 기준을 대조하면 완료

## 5. 마무리

- [ ] 5.1 `pnpm lint`, `pnpm build`, `node --test lib/*.test.mjs`가 모두 통과한다
- [ ] 5.2 문서 갱신: `04_TECHNICAL_DESIGN.md` §4.1(폴백은 원래 순서 첫 곡)·§4.2(후보 순서 무작위, 안내 한 줄, 난수 인자), `02_REQUIREMENTS_SPEC.md` Decisions Log 한 줄. 서로 맞으면 완료
- [ ] 5.3 임시 스텁·스냅샷이 남지 않았는지 grep(`MOODTUNE_`, `PROMPT-SNAPSHOT`, `TEST_TOKEN`)과 `git status`로 확인하고, 변경 파일 목록을 정리하면 완료
