# Refactoring Plan

> 이 문서는 계획만 다룹니다. 이 문서 작성 시점에는 코드를 변경하지 않습니다.

## Refactoring Goal
현재까지 구현된 Spotify 인증 · 라이브러리 조회 · 날씨 연동(Goal 1) 코드에서 눈에 띄는 중복과 얕은 결합 문제를 제거해, 다음 세션에서 AI 추천 기능을 추가할 때 같은 실수를 반복하거나 여러 곳을 동시에 고쳐야 하는 상황을 줄인다. 동작(기능)은 하나도 바꾸지 않는다.

## Current Problems

1. **CTA 버튼 스타일이 3곳에 하드코딩되어 중복됨**
   `min-h-11 min-w-11 rounded-full bg-black px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black` 조합이 `components/PrimaryButton.tsx`, `app/page.tsx`(로그인 `<a>`), `app/result/page.tsx`("Spotify에서 재생하기" `<a>`)에 각각 따로 적혀 있다. 디자인이 바뀌면 세 곳을 다 찾아 고쳐야 한다.

2. **PrimaryButton / SecondaryButton이 색상만 다른 거의 동일한 컴포넌트**
   두 컴포넌트 모두 `min-h-11 min-w-11`, `rounded-full`, `px-6 py-3`, `text-sm font-medium`, `disabled:cursor-not-allowed disabled:opacity-40` 등 레이아웃 클래스가 완전히 동일하고 색상(`bg-black`/`border`)만 다르다.

3. **`/api/spotify/library` 호출 + 상태 처리 로직이 두 페이지에서 거의 그대로 반복됨**
   `app/input/page.tsx`와 `app/verify/page.tsx`가 각각 `{loading|ready|error}` 상태 타입을 따로 선언하고, `fetch("/api/spotify/library")` → `401`이면 `router.replace("/")` → 실패면 `error` → 성공이면 `ready`로 세팅하는 동일한 흐름을 독립적으로 구현하고 있다.

4. **OAuth state 쿠키 이름이 매직 스트링으로 두 파일에 중복 정의됨**
   `"moodtune_oauth_state"`가 `app/api/auth/spotify/login/route.ts`와 `app/api/auth/spotify/callback/route.ts`에 각각 상수로 따로 선언되어 있다. 한쪽만 바꾸면 인증이 조용히 깨진다.

5. **쿠키 옵션 객체가 3곳에서 반복됨**
   `{ httpOnly: true, secure: ..., sameSite: "lax", path: "/", maxAge: ... }` 형태가 `login/route.ts`, `callback/route.ts`, `lib/session.ts`(`writeSession`)에 각각 리터럴로 작성되어 있다(maxAge만 다름).

6. **`lib/spotify.ts`가 가장 크고(184줄) 여러 책임을 한 파일에서 담당**
   OAuth 토큰 교환/갱신, 원시 Spotify API 클라이언트(`api()`), 트랙 정규화(`toTrack`), Liked/Playlist 페이지네이션, 라이브러리 병합·중복 제거가 모두 한 파일에 있다. 지금은 함수 단위로는 나뉘어 있어 당장 급하지 않지만, AI 추천 기능이 이 라이브러리 데이터를 더 가공하게 되면 파일이 더 커지기 전에 분리 기준을 잡아두는 것이 좋다.

## Allowed Refactoring
기능/동작 변경 없이 구조만 개선하는 작업만 허용한다.
- 위 1~2: `PrimaryButton`/`SecondaryButton`을 `variant` prop을 받는 단일 `Button` 컴포넌트로 통합하고, `<a>` CTA들이 같은 클래스(또는 공용 스타일 상수/링크 버튼 컴포넌트)를 재사용하도록 정리
- 위 3: `/api/spotify/library` 호출 로직을 `useLibrary()` 같은 커스텀 훅으로 추출해 `input`, `verify` 페이지가 공유
- 위 4~5: OAuth state 쿠키 이름, 쿠키 옵션(만료시간 제외)을 `lib/session.ts` 등 한 곳의 상수/헬퍼로 통일
- 위 6: `lib/spotify.ts`를 책임 단위(OAuth 토큰, API 클라이언트, 라이브러리 조합)로 여러 파일/모듈로 분리 — 단, export되는 함수의 이름·시그니처·동작은 그대로 유지
- 파일/폴더 이동, import 경로 정리, 타입 위치 정리
- 죽은 코드·미사용 import 제거
- 변수/함수명을 더 명확하게 바꾸는 것(동작에 영향 없는 경우만)

## Not Allowed
- 새 기능 추가 (예: AI 추천 로직, 실제 재생 링크 연동 등 — 이번 리팩토링의 대상이 아님)
- DB 도입/전환 (현재 세션·상태 저장 방식(암호화 쿠키) 유지)
- 인증 방식 변경 (Spotify OAuth 흐름, 쿠키 기반 세션 유지 방식 자체는 그대로)
- API 응답 형태(JSON 필드명·구조) 변경 — 클라이언트/서버 계약을 깨뜨리지 않음
- OpenSpec 변경 범위(change scope) 수정 — 이 리팩토링은 별도 OpenSpec change 없이 기존 구현의 구조만 정리하는 작업이며, planning 문서나 승인된 spec의 요구사항을 바꾸지 않음
- CLAUDE.md Boundaries에 명시된 항목(결제, 복잡한 인증, 실시간 협업, 대용량 업로드, 승인되지 않은 외부 서비스 연동) 추가
- 새로운 의존성(npm 패키지) 추가

## Verification
리팩토링 후 기존 동작이 그대로인지 아래 방법으로 확인한다.

1. **정적 검사**: `pnpm lint`, `pnpm build`(타입 오류 포함) 통과 확인
2. **수동 스모크 테스트** (리팩토링 전/후 동일 시나리오로 비교)
   - `/` → "Spotify로 시작하기" 클릭 → OAuth 로그인 → `/input`으로 정상 리다이렉트되는지
   - 잘못된 state/거부된 인증 시 `/?error=...` 메시지가 그대로 뜨는지
   - `/input`에서 실제 라이브러리 개수가 정상 표시되고, 세션 만료(401) 시 `/`로 리다이렉트되는지
   - `/verify`에서 인증 상태·라이브러리 요약·플레이리스트 목록·날씨가 리팩토링 전과 동일하게 표시되는지
   - `WeatherBadge`: 위치 자동 감지 성공/실패, 도시 직접 입력(성공/404/기타 오류) 케이스 모두 문구·동작이 동일한지
   - `/input`에서 기분·상황 선택 후 "추천받기" → `/result`로 이동해 mock 트랙과 "Spotify에서 재생하기" 링크가 그대로 보이는지
3. **Diff 검토**: 각 리팩토링 커밋의 diff가 "구조 이동/통합"에만 해당하고 로직(조건문, API 경로, 응답 필드명, 에러 처리 분기)이 바뀌지 않았는지 리뷰
4. **회귀 대상 없음 확인**: 이 시점에 자동화된 테스트 스위트가 없으므로, 위 수동 시나리오를 리팩토링 전에 한 번 실행해 기준 동작을 기록해두고, 리팩토링 후 동일 시나리오 결과와 비교한다
