# 04. Technical Design — MoodTune

> Scope: Route, Source Structure, Data Model, State, Storage.
> 다루지 않음: 왜 필요한지(01/02), 화면 디자인(03), 일정(05). 구현 코드는 포함하지 않음 (설계 단계).

## 1. Tech Stack
Next.js, React, TypeScript, Tailwind CSS, Spotify Web API, OpenWeather API, Claude API.

## 2. Route

| Route | 종류 | 설명 |
|-------|------|------|
| `/` | Page | Landing — Spotify 로그인 |
| `/input` | Page | 기분·상황 입력 + 날씨 표시 |
| `/result` | Page | 추천 결과 표시. 필수 쿼리 파라미터(`uri`, `name`) 없이 진입 시 `/input`으로 리다이렉트 |
| `/api/auth/spotify/login` | API | Spotify OAuth 인증 요청 시작 |
| `/api/auth/spotify/callback` | API | OAuth 콜백 처리, 토큰 발급/세션 저장 |
| `/api/spotify/library` | API | 로그인 사용자의 저장 곡/플레이리스트 조회 |
| `/api/weather` | API | 위치(lat/lng) 또는 도시명 기반 날씨 조회 |
| `/api/recommend` | API | 기분+상황+날씨+라이브러리 샘플 → Claude API 추천 요청 |

<!-- TODO: FR-10 "다시 추천받기"가 `/api/recommend` 재호출인지 별도 엔드포인트인지 확정 (현재는 재호출로 가정). -->

## 3. Source Structure
```
src/
  app/
    page.tsx                # Landing (/)
    input/page.tsx           # /input
    result/page.tsx          # /result
    api/
      auth/spotify/login/route.ts
      auth/spotify/callback/route.ts
      spotify/library/route.ts
      weather/route.ts
      recommend/route.ts
  components/
    PrimaryButton.tsx
    SecondaryButton.tsx
    QuickReplyChip.tsx
    WeatherBadge.tsx
    TrackCard.tsx
    TextField.tsx
    LoadingIndicator.tsx
    ErrorBanner.tsx
  lib/
    spotify.ts               # Spotify API 클라이언트 래퍼
    weather.ts                # OpenWeather API 클라이언트 래퍼
    claude.ts                 # Claude API 호출 래퍼 (추천 프롬프트 조립)
  types/
    index.ts                  # 아래 Data Model 인터페이스 정의
docs/                         session-1 경량 문서
planning/md-design/           session-2 상세 설계 문서 (본 문서)
tests/                         테스트 코드
```

## 4. Data Model (Draft)

```
SpotifySession
  accessToken: string
  refreshToken: string
  expiresAt: number

LibraryTrack
  id: string
  name: string
  artist: string
  album: string
  albumArtUrl: string
  uri: string              // Spotify URI, 딥링크에 사용

WeatherContext
  condition: string        // 예: "Clear", "Rain", "Snow"
  tempC: number
  description?: string

UserContext
  mood: string              // FR-4 퀵리플라이 값
  situation: string         // FR-5 퀵리플라이 값
  freeText?: string         // FR-6 옵션 입력

RecommendationRequest
  userContext: UserContext
  weatherContext?: WeatherContext   // 실패 시 undefined 허용 (NFR-2)
  librarySample: LibraryTrack[]

RecommendationResult
  track: LibraryTrack
  reason: string            // "이 곡을 추천한 이유" 문구
  isFallback: boolean       // FR-12 폴백 경로로 선택된 경우 true (내부 로깅용, 사용자에게 노출 안 함)
```

<!-- TODO: librarySample 선택 방식 확정 필요 — 전체 라이브러리를 프롬프트에 넣기 어려우므로 무작위/최근 좋아요/장르 다양성 기준 중 선택. Claude API 비용·응답 품질에 직접 영향. -->

### 4.1 추천 결과 검증 (FR-12 — AI 환각 방지)
`/api/recommend`는 Claude 응답을 그대로 반환하지 않고 아래 검증을 거친다.
1. Claude가 반환한 트랙을 `librarySample`과 `uri`(또는 `id`) 기준으로 대조.
2. 불일치 시, "목록 안의 트랙만 선택하라"는 제약을 강조해 Claude를 **최대 1회 재호출**.
3. 재시도 후에도 불일치하면 `librarySample[0]`(또는 정해진 규칙)을 **결정론적 폴백**으로 사용하고 `reason`을 일반화된 문구로 대체, `isFallback: true` 설정.
4. 클라이언트는 `isFallback` 값과 무관하게 항상 동일한 방식으로 `RecommendationResult`를 렌더링한다 (사용자에게 폴백 여부를 노출하지 않음).

## 5. State (클라이언트 상태 관리)
- 별도 전역 상태 라이브러리(Redux 등) 없이 React 로컬 상태 + URL/세션 기반으로 관리 (MVP 범위에 맞춰 최소화).
- **Landing**: 로그인 진행 상태(idle/connecting/error)만 로컬 상태로 관리.
- **Input**: `UserContext`(mood, situation, freeText) + `WeatherContext` + 제출 상태(loading/error)를 페이지 로컬 상태로 관리.
- **Input → Result 전달 (확정)**: 전역 상태 라이브러리도, 브라우저 저장소(localStorage/sessionStorage, 6장 Storage 원칙)도 쓰지 않는다. 대신 `/api/recommend` 응답에서 화면 표시에 필요한 최소 필드만 뽑아 **URL 쿼리 파라미터**로 인코딩하고, `router.push`로 `/result`에 client-side 이동한다.
  - 예: `/result?uri=<encodeURIComponent>&name=...&artist=...&art=...&reason=...`
  - `reason`은 짧은 한 줄 문구로 제한해 쿼리 길이 문제를 피한다 (03 UX 스펙과 일치).
  - 이 방식은 DB/서버 캐시/브라우저 저장소 없이도 동작하며, 새로고침·URL 직접 접근 시에도 파라미터만 있으면 동일하게 렌더링된다.
- **Result**: 진입 시 `searchParams`에서 위 필드를 읽어 렌더링. 필수 파라미터(`uri`, `name`)가 없으면 잘못된 진입으로 간주해 `/input`으로 리다이렉트한다 (직접 URL 접근·공유 링크·파라미터 유실 케이스 처리). 그 외 로딩/에러 상태는 로컬로 관리.
- 페이지 새로고침 시 상태가 초기화되는 것은 MVP에서 허용 (별도 영속화 요구사항 없음, 02 NFR-5와 일치).

## 6. Storage
- **영구 데이터베이스 없음** — MVP는 DB를 두지 않는다.
- **Spotify 토큰**: 서버 사이드 세션(예: 암호화된 http-only 쿠키)에만 보관, 클라이언트 JS에서 직접 접근 불가하도록 처리.
- **라이브러리/추천 결과**: 요청-응답 생명주기 동안만 메모리에 존재, 별도 캐시/DB 저장 없음 (MVP).
- **localStorage/sessionStorage**: 사용하지 않음 (필요성이 생기면 별도 논의 후 결정).

<!-- TODO: 라이브러리 조회가 매 요청마다 Spotify API를 호출하기엔 느릴 경우, 짧은 TTL의 서버 메모리 캐시 도입 여부 검토 (DB 도입 아님). -->

## 7. 환경 변수
```
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REDIRECT_URI
OPENWEATHER_API_KEY
ANTHROPIC_API_KEY
```

## 8. 에러 처리 전략
- 날씨 API 실패 → `WeatherContext` 없이 추천 진행 (NFR-2).
- Claude API 실패 → Result 페이지에서 재시도 액션 제공 (NFR-3).
- Spotify 토큰 만료 → 재로그인 유도 (Landing으로 리다이렉트).

## 9. Explicit Non-Goals (기술)
- 커스텀 인증 시스템 (Spotify OAuth 외 추가 인증 없음)
- 실시간 기능 (websocket 등)
- 대용량 파일 업로드/저장
- Spotify, OpenWeather, Claude 이외 외부 서비스 연동

## 10. Open Questions
- [ ] TODO: 배포 대상 (Vercel 가정, 확정 필요).
- [ ] TODO: Spotify Developer 앱 등록 및 redirect URI 값 확정.
