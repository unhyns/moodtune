## Why

스트리밍 앱에 곡은 넘치지만 "지금 뭘 들을지" 고르는 선택 피로가 있고, 기존 추천 시스템은 신곡·인기곡 위주라 사용자가 이미 가진 라이브러리와 취향을 활용하지 못한다. MoodTune은 기분·날씨·상황 세 가지 맥락을 결합해, 사용자의 실제 Spotify 라이브러리 안에서 지금 상황에 맞는 곡을 빠르게 추천하고 Spotify로 바로 이동해 재생하게 한다.

## What Changes

- Spotify OAuth(Authorization Code Flow) 로그인 추가
- 로그인한 사용자의 저장한 곡(Liked Songs)·플레이리스트 조회 추가
- 위치 기반 현재 날씨 자동 조회 추가
- 기분·상황 퀵리플라이 단일 선택 입력 UI 추가
- 기분·날씨·상황·라이브러리를 종합한 Claude 기반 AI 추천 생성 및 결과 표시 추가
- 추천 결과 클릭 시 Spotify 앱/웹으로 이동하는 딥링크 추가
- 추천 결과가 항상 사용자의 실제 라이브러리 트랙인지 검증하고, 아니면 결정론적으로 폴백하는 안전장치 추가 (AI 환각 방지)

Breaking change 없음 (그린필드 프로젝트, 기존 스펙 없음).

## Capabilities

### New Capabilities
- `spotify-auth`: Spotify OAuth 로그인 및 세션(액세스 토큰) 관리
- `spotify-library`: 로그인한 사용자의 저장한 곡·플레이리스트 조회
- `weather-context`: 위치 기반 현재 날씨 자동 조회
- `mood-context-input`: 기분·상황 퀵리플라이 단일 선택 입력
- `ai-recommendation`: 기분·날씨·상황·라이브러리를 종합한 AI 추천 생성, 결과 표시, 라이브러리 검증 및 폴백(환각 방지)
- `spotify-playback-redirect`: 추천 결과에서 Spotify 앱/웹으로 이동해 재생

### Modified Capabilities
(없음 — 그린필드 프로젝트, `openspec/specs/`에 기존 capability 없음)

## Impact

- **영향받는 라우트**: `/`, `/input`, `/result`, `/api/auth/spotify/login`, `/api/auth/spotify/callback`, `/api/spotify/library`, `/api/weather`, `/api/recommend`
- **영향받는 컴포넌트**: `PrimaryButton`, `SecondaryButton`, `QuickReplyChip`, `WeatherBadge`, `TrackCard`
- **영향받는 데이터 모델**: `SpotifySession`, `LibraryTrack`, `WeatherContext`, `UserContext`, `RecommendationRequest`, `RecommendationResult`
- **신규 외부 의존성**: Spotify Web API, OpenWeather API, Claude API
- **신규 환경 변수**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `OPENWEATHER_API_KEY`, `ANTHROPIC_API_KEY`
- **저장소 영향**: 없음 — 영구 데이터베이스를 추가하지 않음 (MVP는 요청-응답 생명주기 동안만 데이터를 메모리에 유지)
