## Context

동기는 proposal.md의 Why, 요구사항은 `specs/ai-recommendation/spec.md`를 참고한다. 설계에 영향을 주는 현재 상태는 다음과 같다.

- `moodtune/app/api/recommend/route.ts`가 `library.tracks.slice(0, 50)`으로 `librarySample`을 만든다. `fetchLibrary()`가 좋아요 곡을 먼저 담아, 후보는 최근 좋아요 우선 최대 50곡이다.
- `callOpenAI()`가 `librarySample` 순서 그대로 트랙 목록 JSON을 만든다. `getRecommendation()`의 `findTrack`과 폴백(`librarySample[0]`)도 같은 배열을 쓴다.
- `getRecommendation(request, now = new Date())`는 이미 시각을 서버 내부 인자로 받는다(add-weather-season-hints Decision 2). 난수도 같은 방식을 따른다.
- 모델 호출은 `temperature: 0.7`이다.
- **관찰**: add-weather-season-hints의 실제 호출(가짜 40곡, 고정 순서)에서는 같은 입력에 같은 곡이 반복됐지만, 그 곡들은 목록 맨 앞이 아니었다(Gymnopedie No. 1 6번째, Happy 12번째, Can't Stop the Feeling! 32번째). 입력이 달라지면 곡도 달라졌다. 사용자의 실제 라이브러리에서 보고된 "맨 앞 쏠림"과는 조건이 달라, 위치가 원인인지는 아직 확인되지 않았다. 4번 tasks에서 확인한다.

## Goals / Non-Goals

**Goals:**
- 고정된 목록 순서가 곡 선택에 줄 수 있는 영향을 없앤다.
- 섞기를 순수 함수로 분리하고 난수를 주입해 결정적으로 테스트한다.
- 폴백과 곡 대조는 원래 배열을 그대로 써서 FR-12 동작을 바꾸지 않는다.

**Non-Goals:**
- 같은 곡이 반복되지 않도록 보장하는 것. 섞기는 위치 영향만 없앤다. 모델이 제목·아티스트만 보고 같은 곡을 고르면 반복될 수 있다.
- 50곡 밖의 곡을 후보에 넣는 것. 최근 좋아요 우선 샘플링은 그대로다.

## Decisions

### Decision 1: `moodtune/lib/shuffle.ts`에 Fisher-Yates 순수 함수를 둔다
```ts
shuffled<T>(items: readonly T[], random: () => number): T[]
```
- 입력 배열을 바꾸지 않고 새 배열을 돌려준다. `librarySample`이 그대로 남아 폴백이 원래 첫 곡을 쓴다.
- `sort(() => Math.random() - 0.5)`는 분포가 치우쳐 쓰지 않는다.
- 뒤에서부터 `j = floor(random() * (i + 1))`로 교환한다. `random`이 항상 1에 가까운 값을 주면 원래 순서가 유지되므로, 게이트에서 후보 순서 차이를 없앨 때 쓴다.

**대안**: 라우트에서 섞어서 `librarySample`으로 넘기기. 폴백이 섞인 첫 곡이 되어 결정론이 깨지므로 쓰지 않는다.

### Decision 2: 난수는 `getRecommendation`의 세 번째 인자이고, 요청마다 한 번만 섞는다
- 시그니처는 `getRecommendation(request, now = new Date(), random = Math.random)`이다. `RecommendationRequest`와 라우트는 바꾸지 않으므로 요청 본문으로 난수나 순서를 바꿀 경로가 없다.
- `getRecommendation()`이 시작할 때 한 번 섞어 `callOpenAI()`에 넘기고, 첫 호출과 재시도는 같은 순서를 쓴다. 재시도 차이를 강제 문구 하나로 유지하고, 힌트와 같은 원칙을 따른다.
- 섞은 순서는 로그에 남기지 않는다.

### Decision 3: 안내 문구는 시스템 프롬프트에 고정 한 줄로 넣는다
- uri 규칙 줄 바로 다음에 넣는다: `"The order of the track list has no meaning; never favor a track because of its position."`
- 칩·자유 텍스트 경로 모두 같은 문자열이라 분기가 없다.

### Decision 4: 프롬프트 diff 게이트의 기준선과 허용 줄
- 기준선은 이 change 적용 직전 커밋(`9b9e4ce`)이다. add-weather-season-hints 2.4와 같은 고정 입력 (a)~(e)와 고정 시각을 쓴다.
- 허용 차이는 **순서 안내 한 줄**과 **사용자 프롬프트의 트랙 목록 줄의 순서**뿐이다. 판정을 두 번으로 나눈다.
  1. 원래 순서를 유지하는 고정 난수: 차이가 안내 한 줄뿐이어야 한다.
  2. 실제로 섞는 고정 난수: 트랙 목록을 파싱해 원소 집합이 같고 순서만 다르며, 나머지 차이는 안내 한 줄뿐이어야 한다.

### Decision 5: 실제 OpenAI 확인은 승인 후 최대 6회
- 재시도도 호출 수에 포함한다. 재시도가 필요해지거나 429·오류가 나면 차단하고 멈춘다. 서버 로그와 응답은 사용자 확인 전까지 지우지 않는다.
- 확인 내용: 기존 판정 기준(JSON, 목록 안의 곡, reason 규칙)을 지키는지, 고른 곡과 원래 목록 위치·섞인 위치를 표로 본다. 표본이 작아 효과 판단은 관찰로만 기록한다.

## Risks / Trade-offs

- [섞어도 같은 곡이 반복됨] → 위치가 원인이 아니라면 이 change로 해결되지 않는다(Context 관찰). 실제 호출 결과를 그대로 보고하고, 반복 방지는 별도 change로 판단한다.
- [최근 좋아요 쪽 쏠림이 남음] → 후보가 최근 50곡이라 그 안에서만 섞인다. 의도된 범위다.
- [같은 입력의 결과가 더 달라져 재현이 어려움] → 난수 주입으로 테스트에서는 결정적으로 재현한다.
- [재시도·폴백 퇴행] → 대조와 폴백이 원래 배열을 쓰는지 스텁으로 확인한다.

## Migration Plan

데이터·API 변경이 없어 별도 마이그레이션은 없다. 되돌리려면 `openai.ts`와 새 모듈을 되돌린다.
