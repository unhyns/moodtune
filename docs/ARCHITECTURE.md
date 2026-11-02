# ARCHITECTURE.md

## Service Structure
- 로그인 모드: User → Landing Page (Spotify 로그인) → Mood & Context Input 또는 Free Text Input → AI Recommendation (OpenAI gpt-4o-mini + 내 라이브러리 + 날씨) → Result Page → Spotify로 이동
- 게스트 모드: User → Landing Page (게스트 시트에서 국가·장르 선택) → Guest Input → AI Recommendation (OpenAI gpt-4o-mini + 정적 곡 목록 + 날씨) → Result Page → Spotify로 이동

## Routes
-`/`: Landing page (Spotify login, guest bottom sheet)
-`/input`: Mood & context input page
-`/input/custom`: Free text input page
-`/guest/input`: Guest input page (no login)
-`/result`: Recommendation result page (both modes)
-`/verify`: 초기 연동 확인용 페이지 (서비스 흐름에 포함되지 않음)
-`/api/auth/spotify/login`, `/api/auth/spotify/callback`: Spotify OAuth
-`/api/spotify/library`: Liked Songs and own playlists
-`/api/weather`: Weather lookup
-`/api/recommend`: Recommendation from the user's library (session required)
-`/api/guest/recommend`: Recommendation from the guest catalog (no session, rate limited)

## Source Structure
저장소 루트 아래 `moodtune/`이 Next.js 앱이다. `src/`는 쓰지 않는다.
-`moodtune/app/`: pages and API route handlers
-`moodtune/components/`: UI components
-`moodtune/lib/`: Spotify, weather, OpenAI wrappers and recommendation helpers. 단위 테스트는 `*.test.mjs`로 같은 폴더에 둔다
-`moodtune/data/`: guest catalog and manual artist country overrides (read by the server only)
-`moodtune/scripts/`: guest catalog build scripts, run by hand. Last.fm and MusicBrainz are called only here, never by the running app
-`moodtune/types/`: shared types
-`docs/`: project documents
-`planning/md-design/`: detailed design documents
-`openspec/`: specs and change history
