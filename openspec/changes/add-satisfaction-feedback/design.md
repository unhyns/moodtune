## Context

현재 구조 (`moodtune/`):
- `app/result/page.tsx`는 **서버 컴포넌트**다. `searchParams`에서 `uri, name, artist, art, reason, type, creator, mood, situation, weather*`를 읽어 절대 좌표(393px 고정 폭) 레이아웃으로 그린다. 클라이언트 상태나 브라우저 저장소를 쓰지 않는다.
- `uri`는 `/api/recommend` 응답의 `track.uri`이며, 지금은 `spotify:track:…`와 `spotify:playlist:…`(`type: "playlist"`)가 온다. 앨범 추천은 이후 change에서 추가될 수 있다.
- 세로 배치: 추천 이유 말풍선 `top-910`(최대 약 100px), Listen in Spotify! `top-1066`, Tune Again? `top-1137`(약 40px), 컨테이너 `min-h-[1330px]`. 1177px 아래는 장식 스티커(`pointer-events-none`)만 있다.
- `planning/md-design/04_TECHNICAL_DESIGN.md` §5·§6은 localStorage를 쓰지 않는다고 정해 두었다. 2026-09-28 결정(`add-recommendation-history` 보류 노트)은 개인화 저장을 DB 대신 localStorage로 하기로 했다.

## Goals / Non-Goals

**Goals:**
- 서버 컴포넌트인 Result 페이지를 그대로 두고, 피드백만 작은 클라이언트 컴포넌트로 분리한다.
- `add-personal-signals`가 그대로 가져다 쓸 수 있는 저장 모듈과 스키마를 이번에 정한다.

**Non-Goals:**
- 저장 모듈에 핀·제외 쓰기 함수를 미리 만드는 것. 타입에 자리만 남긴다.
- 응답 이벤트 이력(시각별 로그) 저장. 비율은 URI별 최종 값으로만 계산한다(Decision 4).

## Decisions

### 1. 저장 스키마: 단일 키, 버전 있는 URI별 레코드
localStorage 키 하나(`moodtune:signals`)에 다음 JSON을 저장한다.

```ts
type PersonalSignal = {
  feedback?: "liked" | "disliked";
  feedbackAt?: string; // ISO 8601
  // 이후 add-personal-signals에서 추가 예정: pinned?: boolean; excluded?: boolean;
};

type PersonalSignalsStore = {
  version: 1;
  items: Record<string, PersonalSignal>; // key: spotify:(track|album|playlist):{id}
};
```

- **URI를 키로**: 트랙·앨범·플레이리스트를 한 맵에서 구분 없이 다루고, Spotify URI는 타입이 접두사에 들어 있어 충돌하지 않는다. 트랙 ID만 쓰면 앨범·플레이리스트 ID와 섞일 수 있다.
- **값을 문자열이 아닌 레코드로**: 요구사항의 `'liked' | 'disliked'`는 `feedback` 필드 값이다. 값 자체를 문자열로 두면 핀·제외를 붙일 때 스키마를 바꿔야 한다. 레코드로 두면 같은 URI에 `pinned`, `excluded`를 필드로 추가하기만 하면 된다.
- **`version`**: 읽을 때 `version !== 1`이거나 파싱에 실패하면 빈 저장소로 취급한다(spec: Unrecognized stored data). 이후 스키마를 바꿀 때 마이그레이션 지점이 된다.

**기각한 대안**: 기능별로 키를 나누는 방식(`moodtune:feedback`, `moodtune:pins`, …). 추천 로직이 한 URI의 신호를 모두 보려면 여러 키를 합쳐야 하고, 요구사항의 "핀/제외와 공유" 취지와 맞지 않아 기각했다.

### 2. 저장 모듈 `lib/personalSignals.ts`
브라우저에서만 호출되는 순수 함수 모듈로 둔다.
- `readSignals(): PersonalSignalsStore` — 파싱 실패·버전 불일치·localStorage 접근 예외 시 빈 저장소 반환.
- `setFeedback(uri, value): boolean` — 이미 `feedback`이 있으면 덮어쓰지 않고 `false`를 반환한다(재응답 차단을 저장 계층에서도 보장). 다른 필드는 유지한다. 쓰기 예외 시 `false`.
- `feedbackStats(store)` → `{ liked, total, ratio }` — `feedback`이 있는 항목만 센다.
- `isSignalUri(uri)` — `/^spotify:(track|album|playlist):[A-Za-z0-9]+$/`.

타입(`PersonalSignal`, `PersonalSignalsStore`)은 `types/index.ts`에 둔다. 새 의존성은 없다.

### 3. UI: 클라이언트 컴포넌트 `components/SatisfactionFeedback.tsx`
- `"use client"`, props는 `uri` 하나. `page.tsx`는 `isSignalUri(uri)`일 때만 렌더링한다(서버에서 판정 가능한 순수 함수).
- 상태: `"loading" | "ask" | "done"`. 서버 렌더와 첫 클라이언트 렌더에서는 localStorage를 모르므로 `loading`(같은 높이의 빈 자리)을 그리고, `useEffect`에서 저장된 응답이 있으면 `done`, 없으면 `ask`로 바꾼다. 하이드레이션 불일치와 "버튼이 보였다가 사라지는" 깜빡임을 피한다.
- 버튼을 누르면 `setFeedback` 결과와 관계없이 `done`으로 바꾼다(저장 실패 시에도 감사 문구, spec: Storage unavailable). 저장 실패는 `console.warn`만 남긴다.
- 문구(Figma 확정): 질문 "( ᵕ·̮ᵕ )♩ Did You Enjoy?", 버튼 "Well-Tuned!"(`liked`) / "Not Enough"(`disliked`), 감사 문구 "Thank you for feedback ヾ(◕ˇｏˇ◕)`*:;,｡･". 버튼 문구가 영어라 `aria-label`에 예/아니오 의미를 한국어로 넣는다. 카오모지는 `aria-hidden`으로 스크린리더에서 숨기고, `aria-live="polite"`로 전환을 알리며, 응답 후 포커스를 감사 문구로 옮긴다.
- 위치(Figma result node 121:52 / result_after feedback node 121:149): Tune Again? 아래, 가로 354px 박스를 가운데(`calc(50% + 0.5px)`) 정렬하고 중심을 y=1288px에 둔다. 응답 전후로 박스 높이가 달라도 Figma처럼 중심이 유지된다. 기존 요소는 움직이지 않는다.
- 스타일(Figma 값): 흰 배경 + `#8d29f2` 테두리, 안쪽 여백 24px, 간격 16px. 전부 Pixelify Sans. 질문 22px `#8d29f2`. 버튼은 144px 폭, 여백 16/8px, 16px — Well-Tuned! `#f91e96` 배경·`#e43c98` 테두리·흰 글자, Not Enough 흰 배경·`#0a46c7` 테두리·`#315ebf` 글자. 감사 문구 16px `#8793a0`.
- 함께 반영한 Figma 프레임 변경: 페이지 높이 1330 → 1592px, 별 배경을 1446px 높이 버전(`public/result/stars.svg`, Input은 기존 파일 유지)으로 교체, 붐박스 스티커(node 121:68, `public/result/boombox.png`)를 (178, 1326)에 추가. 스티커는 박스 위에 겹치므로 `pointer-events-none` + `aria-hidden`이다.

**기각한 대안**: Listen 버튼과 이유 말풍선 사이에 배치. 말풍선이 최대 5줄일 때 1010px 근처까지 내려와 1066px 버튼과의 사이가 좁아, 기존 요소를 옮겨야 해 기각했다.

### 4. 만족 비율은 URI별 최종 값으로, 응답 시 콘솔에 출력
응답 직후 `readSignals()`로 다시 읽어 `feedbackStats`를 계산하고 다음 형식으로 `console.info` 한다.

```
[MoodTune] 만족도 4/5 (80%)
```

- 같은 URI는 한 번만 응답할 수 있으므로(spec: One Response per Result) "전체 응답 수"는 응답한 서로 다른 항목 수와 같다.
- 응답 없이 비율만 보고 싶을 때는 DevTools Application 탭에서 `moodtune:signals`를 보면 된다. 전역 디버그 함수는 만들지 않는다(표면적 최소화).

**기각한 대안**: 응답 이벤트를 배열로 누적해 같은 곡의 반복 추천도 따로 세는 방식. 재응답을 막는 요구사항과 충돌하고, 저장량이 계속 늘어나 기각했다. 같은 곡이 다시 추천되는 경우는 한 번으로 센다(Risks 참고).

### 5. 문서 갱신
- `04_TECHNICAL_DESIGN.md` §6: "localStorage/sessionStorage 사용하지 않음"을 "개인 신호(`moodtune:signals`, 피드백·향후 핀/제외)에 한해 localStorage 사용, 그 외 사용하지 않음"으로 바꾸고 2026-09-28 결정을 근거로 적는다. §5의 Input → Result 전달 방식(URL 파라미터)은 그대로이므로 해당 문장은 "결과 전달에는 브라우저 저장소를 쓰지 않는다"로 범위만 명확히 한다.
- `docs/DESIGN.md` Result 화면 설명에 만족도 피드백 영역을 한 줄 추가한다.

## Risks / Trade-offs

- [기기·브라우저별로 따로 저장됨] → 다른 기기, 시크릿 모드, 저장소 삭제 시 응답이 사라지고 비율도 해당 브라우저 기준이다. PRD 기준이 1인 자가 평가라 주 사용 브라우저 하나에서 재면 충분하다. 동기화가 필요해지면 보류 중인 `add-recommendation-history`와 함께 재검토한다.
- [같은 곡이 다시 추천되면 응답할 수 없음] → 두 번째 추천이 상황에 더 맞거나 덜 맞아도 비율에 반영되지 않는다. URI를 키로 한다는 요구사항과 재응답 차단을 우선했다.
- [URL을 직접 조작해 임의 URI로 응답 가능] → 본인 브라우저에만 영향이 있어 보안 문제는 아니다. `isSignalUri`로 형식만 막는다.
- [localStorage 용량] → 항목당 100바이트 안팎이라 수천 건도 수백 KB 수준이다. 이번 change에서는 정리 로직을 두지 않는다.

## Migration Plan

기존 저장 데이터가 없어 마이그레이션이 필요 없다. 롤백 시 이전 커밋으로 되돌리면 되고, 남은 `moodtune:signals` 키는 읽는 코드가 없어 영향이 없다.
