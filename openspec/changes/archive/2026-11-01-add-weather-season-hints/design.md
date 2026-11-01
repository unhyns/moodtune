## Context

동기는 proposal.md의 Why, 요구사항은 `specs/ai-recommendation/spec.md`를 참고한다. 설계에 영향을 주는 현재 상태는 다음과 같다(add-free-text-input 반영 후 기준).

- `moodtune/lib/openai.ts`의 `callOpenAI()`가 시스템 프롬프트와 사용자 프롬프트(`Context:` 블록 + 트랙 목록 JSON)를 만든다. 날씨는 `weather: ${condition}, ${temperatureC}°C` 한 줄이고, 시스템 프롬프트의 날씨 규칙과 예시는 숫자 기온("흐리고 15°C인 날")을 쓰게 한다.
- 시스템 프롬프트에는 "Use EVERY given Context value"와 "Never mention a value that is not in Context" 규칙이 있다. `Context:` 안에 넣는 값은 모두 reason에 쓰이게 된다.
- 모델이 아는 곡 정보는 제목·아티스트뿐이다. Spotify가 장르·인기도를 주지 않으므로(2026-10-28 확인) 오디오 특성으로 거를 수 없다.
- `moodtune/lib/weatherPhrase.ts`에 icon 앞 두 자리 → 상태 문구, 반올림 기온 → 5단계 문구, `weatherDayPhrase()`가 있고, 지금은 자유 텍스트 고정 문장에만 쓴다(add-free-text-input Decision 8 메모: 칩 경로도 날씨·계절 작업에서 같은 함수를 쓴다).
- 날씨 `icon`은 `/api/weather`가 OpenWeather 응답에서 그대로 넣는다. 서버 런타임 시간대는 배포 환경(Vercel)에서 UTC다.
- 재시도는 `callOpenAI(request, true)`로 같은 입력에 강제 문구만 더한다.

## Goals / Non-Goals

**Goals:**
- 힌트 계산을 순수 함수로 분리해 시각을 주입해서 경계값을 테스트할 수 있게 한다.
- 힌트가 reason으로 새지 않게, 프롬프트 구조로 Context와 분리한다.
- 칩 경로 프롬프트 변경을 "의도한 줄만 바뀌었다"로 검증할 수 있게 한다.

**Non-Goals:**
- 힌트 효과(곡 선택이 실제로 바뀌는지)의 정량 평가. 칩·입력한 글보다 우선순위가 낮은 힌트라 효과가 작아도 받아들인다.
- `/result`·`/input`의 날씨 표시(숫자 °C 배지)는 바꾸지 않는다. 바뀌는 것은 reason과 프롬프트뿐이다.

## Decisions

### Decision 1: 힌트 계산은 `moodtune/lib/contextHints.ts`의 순수 함수로 둔다
```ts
type HintInput = { weather?: WeatherContext; mood?: string; isFreeText: boolean; now: Date };
buildContextHints(input): { weatherHint: string | null; seasonHint: string; priority: string }
```
- 날씨 범주는 icon 앞 두 자리로 정한다: 01·02 맑음, 03·04·50 흐림, 09·10·11 비, 13 눈. `weatherPhrase`의 상태 문구 매핑(02 "구름 끼고", 50 "안개 끼고")과 범주가 달라서 매핑 표는 따로 둔다. 범주 밖이거나 날씨가 없으면 `weatherHint`는 null이다.
- 계절·시각은 `Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", month: "numeric", hour: "numeric", hourCycle: "h23" })`로 서울 기준 월·시를 구한다. 서버 시간대(UTC)와 무관하게 같은 결과가 나온다. 새 의존성은 없다.
- 가을 낮/밤은 시(hour) 기준 6 이상 18 미만이면 낮(06:00~17:59), 그 외 밤이다.
- 겨울 크리스마스 조건: 눈(13) 이거나, 칩 경로(`!isFreeText`)이고 mood가 `Excited` 또는 `Romantic`. 자유 텍스트는 눈일 때만.
- `priority`는 칩 경로 "mood/situation > weather > season", 자유 텍스트 "note > weather > season" 문장이다.
- 경계값 테스트는 `contextHints.test.mjs`(`node --test`, weatherPhrase 테스트와 같은 방식)로 둔다.

**대안**: `weatherPhrase.ts`에 함께 넣기. 기온·날씨 "표현"과 추천 "힌트"는 바뀌는 이유가 달라 파일을 나눈다. 칩 경로 reason이 `weatherPhrase`를 쓰는 것은 Decision 3에서 다룬다.

### Decision 2: 시각은 요청마다 한 번 정하고, 재시도에도 같은 힌트를 쓴다
- `getRecommendation()`이 시작할 때 인자 `now`(기본값 `new Date()`)로 시각을 한 번 정하고 `buildContextHints()` 결과를 `callOpenAI()`에 넘긴다. 첫 호출과 재시도가 다른 계절·시간대 힌트를 받는 경우(17:59:59 → 18:00:00)를 막는다.
- 시그니처는 `getRecommendation(request, now = new Date())`다. 시각은 서버 내부 함수의 인자이고 `RecommendationRequest`의 필드가 아니다. 그래서 클라이언트 요청 본문으로 시각을 바꿀 경로가 없다. 라우트는 인자를 넘기지 않고(서버 현재 시각), 테스트·스냅샷에서만 고정 시각을 넘긴다.

**대안**: 라우트에서 힌트를 계산해 넘기기. 라우트가 프롬프트 내용을 알게 되어 책임이 섞인다. 힌트는 프롬프트의 일부라 `openai.ts` 쪽에 둔다.

### Decision 3: 날씨 줄은 `weatherDayPhrase` 문구로 바꾸고, reason 규칙·예시도 문구 기준으로 고친다
- `Context:`의 날씨 줄을 `weather: ${weatherDayPhrase(weather)}`(예: "weather: 흐리고 시원한 날")로 바꾼다. OpenWeather의 원래 설명("실 비")과 숫자 기온은 프롬프트에 넣지 않는다. 숫자가 프롬프트에 없으면 reason에 숫자가 나올 근거가 없다.
- 시스템 프롬프트의 날씨 규칙을 다음 뜻으로 바꾼다: "weather 줄이 있으면 그 문구를 쓰인 그대로 자연스럽게 넣는다(예: '흐리고 시원한 날'). 기온 숫자나 °C를 쓰지 않는다. 날씨에 대한 감정을 덧붙이지 않고 곡과 연결하지 않는다. weather 줄이 없으면 날씨를 쓰지 않는다."
- 예시도 바꾼다: `weather "흐림, 15°C"` → `weather "흐리고 시원한 날"`, Good 문장 → "흐리고 시원한 날, 나른한 기분으로 도서관에 가는 중이라 이 곡을 골랐어요."
- 자유 텍스트 경로도 같은 날씨 줄을 받는다(곡 선택용). reason은 이미 같은 함수로 만든 고정 문장이라 바뀌지 않는다.

**대안**: 숫자와 문구를 함께 넣고 문구만 쓰게 하기. 숫자가 보이면 모델이 쓰는 경향이 있어(add-richer-reasons 튜닝 경험) 규칙 하나를 더 지켜야 한다. 아예 넣지 않는 쪽이 확실하다.

### Decision 4: 힌트는 `Context:` 밖의 별도 블록에 두고, reason에 쓰지 말라는 규칙을 더한다
사용자 프롬프트를 다음 순서로 만든다.
```
Context:
mood: 차분한 기분
weather: 비 오고 쌀쌀한 날

Hints (lower priority than the mood/situation or the note; never mention them in the reason):
- weather feel: 잔잔한 느낌
- season feel: 차분하고 서정적인 느낌
Priority: mood/situation > weather > season

Track list (JSON):
[...]
```
- 힌트를 `Context:` 밖에 두면 "Use EVERY given Context value"가 힌트를 reason에 넣으라는 지시가 되지 않고, "Never mention a value that is not in Context"가 힌트 언급을 막는 규칙이 된다.
- 시스템 프롬프트에 규칙 한 줄을 더한다: 힌트와 어울리는 후보가 있으면 그쪽을 우선하되, 칩·입력한 글과 충돌하면 칩·입력한 글을 따르고, reason에는 힌트·계절·느낌을 쓰지 않는다(2026-11-01 실제 호출 비교 후 강화). 후보를 거르지는 않는다. 기존 "곡에 대한 주장 금지" 규칙은 그대로다.
- 첫 줄("fits their current mood, situation, and weather")은 그대로 둔다.
- 날씨 힌트가 null이면 `weather feel` 줄을 빼고, 계절 줄과 Priority는 항상 넣는다.

**대안**: 힌트를 시스템 프롬프트에 넣기. 시스템 프롬프트는 요청마다 같은 규칙만 두는 편이 재시도 강제 문구와의 관계도 단순하고, 스냅샷 비교에서 "바뀐 곳"이 사용자 프롬프트의 블록 하나로 모인다.

### Decision 5: 칩 경로 회귀 검증은 "새 기준선 + 허용된 변경 목록"으로 한다
- 기준선은 이 change를 적용하기 직전 커밋(add-free-text-input archive 이후)이다. 5a7e472 기준은 해제한다(02 Decisions Log 2026-10-29).
- add-free-text-input 2.1과 같은 고정 입력 (a)~(e)에 고정 시각(예: 2026-10-15 19:30 KST)을 넣어 변경 전·후 프롬프트를 저장하고 diff한다. diff에 나와도 되는 줄은 다음뿐이다: ① `Context:`의 weather 줄, ② 시스템 프롬프트의 날씨 규칙 줄과 날씨 예시 줄, ③ 새 힌트 규칙 줄, ④ 사용자 프롬프트의 Hints 블록. 그 밖의 차이가 하나라도 있으면 실패다.
- 재시도·폴백 응답은 add-free-text-input 최종 확인 때처럼 OpenAI 스텁으로 변경 전·후를 비교해 같음을 확인한다.

### Decision 6: 실제 OpenAI 확인은 사용자 승인 후 정해진 횟수만 한다
- reason 문구가 바뀌므로(숫자 → 문구) 실제 모델 출력 확인이 필요하다. 다만 호출은 사용자가 승인한 뒤, 정한 횟수만 한다(tasks 4.x).
- 판정은 객관 기준으로 한다: reason에 숫자 기온·"°C"가 없다 / 날씨를 언급하면 Context의 문구가 그대로 들어 있다 / 계절 이름(봄·여름·가을·겨울)과 힌트 문구("~한 느낌")가 없다 / JSON이 올바르고 곡이 목록 안에 있다.

## Risks / Trade-offs

- [모델이 힌트 문구를 reason에 옮김(예: "잔잔한 느낌이라 골랐어요")] → 힌트를 Context 밖에 두고 금지 규칙을 더한다. 실제 호출 확인에서 나오면 힌트 블록 문구를 조정한다. 서버 후처리는 하지 않는다(재시도·폴백 흐름을 바꾸게 됨).
- [힌트의 우선순위가 낮아 곡 선택이 거의 안 바뀜] → 의도된 설계다(칩·입력한 글보다 우선순위가 낮은 힌트, 필터 없음). 모델은 제목·아티스트로만 곡의 느낌을 짐작한다.
- [add-richer-reasons에서 안정화한 reason 품질 퇴행] → 바뀌는 줄을 Decision 5의 목록으로 제한하고, 실제 호출로 날씨 규칙을 다시 확인한다.
- [서버 시각대 착오로 계절이 하루 어긋남] → Asia/Seoul로 명시 계산하고, UTC 날짜가 바뀌는 경계(15:00 UTC)를 단위 테스트로 확인한다.
- [날씨 표현이 "구름 끼고"(02)인데 힌트는 "밝고 경쾌한 느낌"(맑음 범주)] → 표현과 힌트의 범주가 다른 것은 결정 사항(02는 맑음, 50은 흐림)이다. 힌트는 reason에 나오지 않아 사용자에게 어긋나 보이지 않는다.

## Migration Plan

- 배포 순서: add-free-text-input archive → 이 change 적용. 데이터·API 변경이 없어 별도 마이그레이션은 없다.
- 되돌리기: `openai.ts`와 새 모듈을 되돌리면 이전 프롬프트로 돌아간다.
