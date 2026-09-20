# OpenSpec Change 입력 초안: moodtune-mvp-must

> `/opsx:propose`에 그대로 전달하기 위한 입력 문서입니다. `md-to-openspec` Skill이 `planning/md-design/01~05`에서 생성했습니다. `openspec/` 디렉토리는 이 문서에서 생성/수정하지 않았습니다.

⚠️ **Must 항목이 9개로 많음 — change 분리를 고려하세요.** (FR-1, FR-2, FR-3, FR-4, FR-5, FR-7, FR-8, FR-9, FR-12) 지금은 하나의 change로 정리했지만, `/opsx:propose` 단계에서 "인증+라이브러리", "컨텍스트 입력", "AI 추천"처럼 쪼개는 것도 검토해볼 만합니다.

## 1. 목적 (Why)
스트리밍 앱에 곡은 넘치지만 "지금 뭘 들을지" 고르는 선택 피로가 있고, 기존 추천 시스템은 신곡·인기곡 위주라 사용자가 이미 가진 라이브러리와 취향을 활용하지 못한다. MoodTune은 기분·날씨·상황 세 가지 맥락을 결합해, 사용자의 실제 Spotify 라이브러리 안에서 지금 상황에 맞는 곡을 빠르게 골라주고 Spotify로 바로 이동해 재생하게 한다.

## 2. Proposal 후보

### Why
(위 1절과 동일 — `01_PRODUCT_BRIEF.md` 문제 정의·핵심 가치 근거)

### What Changes
- Spotify OAuth 연동 추가 (FR-1)
- 사용자 라이브러리(저장한 곡 + 플레이리스트) 조회 추가 (FR-2)
- 위치 기반 날씨 자동 조회 추가 (FR-3)
- 기분·상황 퀵리플라이 입력 UI 추가 (FR-4, FR-5)
- OpenAI 기반 AI 추천 생성 및 결과 표시 추가 (FR-7, FR-8)
- 추천 결과에서 Spotify로 이동하는 딥링크 추가 (FR-9)
- 추천 결과가 실제 라이브러리 트랙인지 검증·폴백하는 로직 추가 (FR-12, 환각 방지)

### Impact
- **영향받는 라우트** (`04_TECHNICAL_DESIGN.md` §2): `/`, `/input`, `/result`, `/api/auth/spotify/login`, `/api/auth/spotify/callback`, `/api/spotify/library`, `/api/weather`, `/api/recommend`
- **영향받는 컴포넌트**: `PrimaryButton`, `SecondaryButton`, `QuickReplyChip`, `WeatherBadge`, `TrackCard` (Must 흐름에 직접 관여하는 컴포넌트만. `TextField`/`LoadingIndicator`/`ErrorBanner`는 이 change의 Must 요구사항과 직접 연결되지 않음)
- **영향받는 데이터 모델**: `SpotifySession`, `LibraryTrack`, `WeatherContext`, `UserContext`, `RecommendationRequest`, `RecommendationResult`(`isFallback` 포함)
- **신규 환경 변수**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `OPENWEATHER_API_KEY`, `OPENAI_API_KEY`
- **DB 영향 없음** — MVP는 영구 데이터베이스를 두지 않음 (04 §6)

## 3. Spec 요구사항 (ADDED Requirements)

### Requirement: Spotify OAuth Login
사용자는 Spotify OAuth(Authorization Code Flow)로 로그인해 앱에 라이브러리 읽기 권한을 부여할 수 있어야 한다. (FR-1)

#### Scenario: 로그인 성공
- **WHEN** 사용자가 Landing 페이지에서 "Spotify로 시작하기"를 클릭하고 OAuth 동의 화면에서 승인한다
- **THEN** 시스템은 액세스 토큰을 발급하고 사용자를 다음 화면으로 진행시킨다

#### Scenario: 로그인 거부/실패
- **WHEN** 사용자가 OAuth 동의 화면에서 거부하거나 인증에 실패한다
- **THEN** Landing 페이지는 에러 상태와 재시도 버튼을 표시한다

### Requirement: Library Retrieval
로그인한 사용자의 저장한 곡(Liked Songs) 및 플레이리스트 목록을 조회할 수 있어야 한다. (FR-2)

#### Scenario: 라이브러리 조회 성공
- **WHEN** 로그인한 사용자가 라이브러리 조회를 요청한다
- **THEN** 시스템은 최소 1개 이상의 트랙/플레이리스트를 반환한다

#### Scenario: 빈 라이브러리
- **WHEN** 사용자의 라이브러리에 저장된 곡/플레이리스트가 없다
- **THEN** 시스템은 별도의 안내를 표시한다 (정확한 문구/동작은 `04. 미정` 목록 참고)

### Requirement: Automatic Weather Lookup
위치 기반으로 현재 날씨(조건+기온)를 자동 조회해 추천에 반영해야 한다. (FR-3)

#### Scenario: 위치 권한 허용
- **WHEN** 사용자가 Input 페이지에서 위치 권한을 허용한다
- **THEN** 시스템은 날씨 조건과 기온을 표시한다

### Requirement: Mood Quick Reply Selection
사용자는 기분을 퀵리플라이 버튼으로 단일 선택할 수 있어야 한다. (FR-4)

#### Scenario: 기분 단일 선택
- **WHEN** 사용자가 기분 버튼 그룹에서 하나를 선택한다
- **THEN** 선택한 버튼만 선택 상태로 표시되고 다른 버튼은 비선택 상태를 유지한다

### Requirement: Situation Quick Reply Selection
사용자는 상황을 퀵리플라이 버튼으로 단일 선택할 수 있어야 한다. (FR-5)

#### Scenario: 상황 단일 선택
- **WHEN** 사용자가 상황 버튼 그룹에서 하나를 선택한다
- **THEN** 선택한 버튼만 선택 상태로 표시되고 다른 버튼은 비선택 상태를 유지한다

#### Scenario: 필수 입력 미완성 시 제출 차단
- **WHEN** 기분 또는 상황 중 하나라도 선택되지 않았다
- **THEN** "추천받기" 버튼은 비활성화 상태로 표시된다

### Requirement: AI-Generated Recommendation
기분·날씨·상황·라이브러리를 종합해 OpenAI API (gpt-4o-mini)로 추천을 생성하고 결과를 화면에 표시해야 한다. (FR-7, FR-8)

#### Scenario: 추천 요청 및 결과 표시
- **WHEN** 사용자가 기분·상황을 선택하고 "추천받기"를 제출한다
- **THEN** 시스템은 로딩 상태를 표시한 뒤, 성공 시 최소 1개 트랙(제목/아티스트/앨범아트)과 추천 이유 문구를 표시한다

### Requirement: Spotify Redirect on Recommendation
추천 결과를 클릭하면 Spotify 앱 또는 웹으로 이동해 재생할 수 있어야 한다. (FR-9)

#### Scenario: 추천 결과 클릭
- **WHEN** 사용자가 추천된 트랙 카드를 클릭한다
- **THEN** 새 탭/앱으로 해당 Spotify 트랙 페이지가 열린다

### Requirement: Recommendation Library Validation & Fallback
AI 추천 결과가 사용자 라이브러리에 실제로 존재하는 트랙인지 검증하고, 아니면 결정론적으로 폴백해야 한다 (환각 방지). (FR-12)

#### Scenario: 라이브러리 내 트랙으로 검증됨
- **WHEN** OpenAI가 반환한 트랙이 `librarySample`의 URI/ID와 일치한다
- **THEN** 시스템은 해당 트랙을 그대로 추천 결과로 사용한다

#### Scenario: 불일치 후 재시도 성공
- **WHEN** OpenAI가 반환한 트랙이 `librarySample`과 일치하지 않는다
- **THEN** 시스템은 "목록 안의 트랙만 선택하라"는 제약을 포함해 최대 1회 재시도한다

#### Scenario: 재시도 후에도 불일치 — 결정론적 폴백
- **WHEN** 재시도한 응답도 `librarySample`과 일치하지 않는다
- **THEN** 시스템은 `librarySample`에서 결정론적으로 폴백 트랙을 선택하고, 이유 문구를 일반화된 문구로 대체하며, 사용자에게는 `isFallback` 여부를 노출하지 않는다

## 4. Design 결정사항

### 확정된 것
- **Route** (04 §2): `/`, `/input`, `/result`, `/api/auth/spotify/login`, `/api/auth/spotify/callback`, `/api/spotify/library`, `/api/weather`, `/api/recommend`
- **Source Structure** (04 §3): `src/app`, `src/components`, `src/lib`, `src/types` 구조
- **Data Model** (04 §4): `SpotifySession`, `LibraryTrack`, `WeatherContext`, `UserContext`, `RecommendationRequest`, `RecommendationResult`(`isFallback` 포함) 필드 확정
- **FR-12 검증 로직** (04 §4.1): 대조 → 최대 1회 재시도 → 결정론적 폴백(`librarySample[0]` 등) → `isFallback`과 무관하게 동일 방식으로 렌더링
- **State/전달 방식** (04 §5): 전역 상태 라이브러리·브라우저 저장소 없이, Input→Result는 URL 쿼리 파라미터(`uri`, `name`, `artist`, `art`, `reason`)로 전달. Result는 필수 파라미터(`uri`, `name`) 없으면 `/input`으로 리다이렉트
- **Storage** (04 §6): 영구 DB 없음. Spotify 토큰은 서버 사이드 세션(암호화된 http-only 쿠키)에만 보관. localStorage/sessionStorage 사용 안 함
- **에러 처리 전략** (04 §8): 날씨 API 실패 → 날씨 없이 진행(NFR-2). OpenAI API 실패 → 재시도 액션 제공(NFR-3). 토큰 만료 → Landing으로 재로그인 유도
- **환경 변수** (04 §7): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `OPENWEATHER_API_KEY`, `OPENAI_API_KEY`

### 미정 — 착수 전 확정 필요
- 기분(mood)/상황(situation) 퀵리플라이 옵션의 실제 값 (02, TODO 초안만 존재)
- "라이브러리" 범위 — Liked Songs만인지 팔로우한 플레이리스트도 포함하는지 (01 Open Question)
- `librarySample` 구성 방식 — 무작위/최근 좋아요/장르 다양성 중 선택 (04, TODO)
- 라이브러리가 비어있거나 매우 적을 때의 정확한 대체 문구/동작 (02 Open Question)
- 배포 대상 (Vercel로 가정, 04 Open Question)
- Spotify Developer 앱 등록 및 실제 redirect URI 값 (04 Open Question)

## 5. Tasks 제안

### A. 프로젝트 기반
- [ ] 1.1 Next.js + TypeScript + Tailwind 프로젝트 초기화
- [ ] 1.2 `components/`, `lib/`, `types/` 폴더 구조 생성
- [ ] 1.3 `types/index.ts`에 `LibraryTrack`, `WeatherContext`, `UserContext`, `RecommendationRequest`, `RecommendationResult` 인터페이스 정의
- [ ] 1.4 환경 변수(`SPOTIFY_CLIENT_ID` 등) 설정

### B. Spotify OAuth (FR-1)
- [ ] 2.1 `/api/auth/spotify/login` 구현 (읽기 전용 scope만 요청)
- [ ] 2.2 `/api/auth/spotify/callback` 구현 — 토큰 교환 및 암호화된 http-only 쿠키에 세션 저장
- [ ] 2.3 Landing 페이지 로그인 거부/실패 에러 상태 + 재시도 버튼

### C. Library Retrieval (FR-2)
- [ ] 3.1 `/api/spotify/library` 구현 — 저장한 곡 + 플레이리스트 조회 (범위는 "미정" 목록 확정 후 반영)
- [ ] 3.2 빈 라이브러리 안내 처리 (문구는 "미정" 목록 확정 후 반영)

### D. Weather (FR-3)
- [ ] 4.1 Input 페이지에서 브라우저 위치 권한 요청 → `/api/weather` 호출
- [ ] 4.2 `WeatherBadge`에 조건+기온 표시

### E. Mood/Situation Input (FR-4, FR-5)
- [ ] 5.1 기분/상황 옵션 값 확정 반영 (상수 배열)
- [ ] 5.2 `QuickReplyChip` 두 그룹을 Input 페이지에 배치, 단일 선택 로직 연결
- [ ] 5.3 기분/상황 미선택 시 "추천받기" 버튼 비활성화

### F. AI Recommendation (FR-7, FR-8, FR-12)
- [ ] 6.1 `librarySample` 구성 로직 구현 (선택 방식은 "미정" 목록 확정 후 반영)
- [ ] 6.2 `/api/recommend` 구현 — mood/situation/weather/librarySample을 OpenAI API에 전달
- [ ] 6.3 OpenAI 응답을 `librarySample`과 URI/ID 대조 검증
- [ ] 6.4 불일치 시 제약을 강조해 최대 1회 재시도
- [ ] 6.5 재시도 후에도 불일치하면 결정론적 폴백 + `isFallback` 내부 플래그 처리
- [ ] 6.6 결과를 URL 쿼리 파라미터로 인코딩해 `/result`로 이동
- [ ] 6.7 `/result`에서 쿼리 파라미터 파싱해 `TrackCard` 렌더링, 필수 파라미터 없으면 `/input`으로 리다이렉트

### G. Spotify Redirect (FR-9)
- [ ] 7.1 `TrackCard`의 "Spotify에서 재생하기" 클릭 시 실제 Spotify 앱/웹 링크로 연결

## 이번 change에서 제외 (Should/Could)
- FR-6: 자연어 텍스트로 추가 맥락 입력 (Should)
- FR-10: "다시 추천받기" 재요청 액션 (Should)
- FR-11: 날씨 자동 조회 실패 시 수동 도시 입력 대체 (Could)
