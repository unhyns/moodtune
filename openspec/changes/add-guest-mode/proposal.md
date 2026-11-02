## Why

Spotify 개발 모드는 OAuth 사용자를 허용 목록 5명으로 제한하므로, 계정이 없거나 목록에 없는 사람은 지금 서비스를 전혀 써 볼 수 없다. 로그인 없이 체험할 수 있는 경로를 연다.

## What Changes

- 랜딩의 로그인 버튼 아래에 "Go to Guest mode" 버튼을 두고, 누르면 바텀시트가 열린다(Figma 59:649, 170:703, 170:749).
- 바텀시트에서 국가(단일: Korea / Western / Japan / RoW)와 장르(복수, 1~3개: Pop / Hip-Hop / R&B / Rock / Indie / EDM / Ballad / Jazz / K-POP)를 고른다. "Start Guest Mode"를 누르면 게스트 입력 화면(`/guest/input`)에서 기존 기분·상황 칩과 날씨로 추천을 요청한다. 선택 없이 직접 들어오면 랜딩으로 돌려보내고, 선택 요약을 누르면 랜딩의 시트로 돌아가 바꿀 수 있다.
- **정적 곡 목록**: 빌드 스크립트가 Last.fm(국가별 차트, 곡 태그)에서 후보를 모으고 Spotify 검색(client credentials)으로 실제 트랙인지 검증해 파일로 저장한다. 저장 필드는 Spotify 트랙 ID, 제목, 아티스트, 우리가 붙인 장르·국가 라벨뿐이다. Last.fm 순위·재생 수·태그 목록은 저장하지 않는다.
- Last.fm API 키는 빌드 스크립트에서만 쓴다. 앱 실행 중에는 Last.fm을 호출하지 않는다. 게스트 화면에 "곡 선정 참고: Last.fm" 출처 문구와 링크를 둔다.
- **추천**: 선택한 장르·국가에 맞는 곡을 모아 요청마다 섞어 최대 50곡을 후보로 쓰고, 기존 추천·검증·재시도·폴백을 재사용한다. 맞는 곡이 15곡 미만이면 같은 국가의 다른 장르로 넓혀 채운다.
- 앨범 아트는 저장하지 않고, 고른 곡 한 곡만 실행 시 Spotify에서 조회한다(실패해도 추천은 표시).
- 결과 화면과 👍/👎를 재사용한다. 출처 플레이리스트 문구는 게스트에 나오지 않는다.
- **호출 제한**: 공개 엔드포인트라 게스트 요청을 제한해 OpenAI 한도를 보호한다(design.md Decision 7).
- 게스트는 Spotify 사용자 데이터를 읽거나 저장하지 않는다.

**외부 서비스 승인**: 프로젝트 규칙상 Spotify·날씨·OpenAI 외 외부 서비스는 승인이 필요하다. Last.fm과 MusicBrainz는 이 change에서 빌드 시점 사용으로 승인받았다. 실행 시점 호출은 승인 범위가 아니다.

**착수 조건**: Last.fm·Spotify 약관에서 확인이 필요한 점이 있다(design.md Risks, tasks 0.1). 사용자가 확인하기 전에는 곡 목록을 빌드하지 않는다.

**제외 (Non-goals)**: 게스트의 자유 텍스트 입력, 게스트 추천 이력, 곡 목록 자동 갱신, 로그인 사용자 경로의 변경, 호출 제한용 공유 저장소(새 서비스), Figma 상세 디자인.

## Capabilities

### New Capabilities
- `guest-mode`: 로그인 없는 진입, 장르·국가 입력, 정적 곡 목록, 후보 선택과 확장, 추천 재사용, 앨범 아트 조회, 출처 표시, 호출 제한, 사용자 데이터 미사용.

### Modified Capabilities
<!-- 없음. 로그인 경로의 요구사항은 바뀌지 않는다. 게스트는 곡 목록을 추천의 라이브러리 샘플 자리에 넣어 기존 ai-recommendation 규칙을 그대로 따른다. -->

## Impact

- **코드**:
  - 새 파일: `moodtune/scripts/build-guest-catalog.mjs`, `moodtune/data/guest-catalog.json`, `moodtune/lib/guestCatalog.ts`(+ 테스트), `moodtune/lib/guestLimit.ts`(+ 테스트), `moodtune/components/GuestModeSheet.tsx`, `moodtune/lib/guestSelection.ts`(+ 테스트), `moodtune/app/guest/input/page.tsx`, `moodtune/app/api/guest/recommend/route.ts`.
  - 수정: `moodtune/app/page.tsx`(버튼과 시트), `moodtune/lib/useRecommendSubmit.ts`(엔드포인트 선택, 한도 오류), `moodtune/app/result/page.tsx`(게스트 표시), `moodtune/lib/spotify.ts`(앱 토큰과 트랙 조회).
  - 바꾸지 않음: `moodtune/lib/openai.ts`, `moodtune/app/api/recommend/route.ts`, `/input`.
- **API**: `POST /api/guest/recommend` 추가(인증 없음). 기존 API는 변경 없음.
- **외부 호출·의존성**: 빌드 시 Last.fm, Spotify 검색. 실행 시 Spotify 트랙 조회 1회, OpenAI. npm 의존성 추가 없음. 환경 변수 `LASTFM_API_KEY`(빌드 전용).
- **문서**: `CLAUDE.md` Boundaries(Last.fm 빌드 전용 예외), `planning/md-design/02`·`03`·`04`, `docs/DESIGN.md`.
