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
- Claude 기반 AI 추천 생성 및 결과 표시 추가 (FR-7, FR-8)
- 추천 결과에서 Spotify로 이동하는 딥링크 추가 (FR-9)
- 추천 결과가 실제 라이브러리 트랙인지 검증·폴백하는 로직 추가 (FR-12, 환각 방지)

### Impact
- **영향받는 라우트** (`04_TECHNICAL_DESIGN.md` §2): `/`, `/input`, `/result`, `/api/auth/spotify/login`, `/api/auth/spotify/callback`, `/api/spotify/library`, `/api/weather`, `/api/recommend`
- **영향받는 컴포넌트**: `PrimaryButton`, `SecondaryButton`, `QuickReplyChip`, `WeatherBadge`, `TrackCard` (Must 흐름에 직접 관여하는 컴포넌트만. `TextField`/`LoadingIndicator`/`ErrorBanner`는 이 change의 Must 요구사항과 직접 연결되지 않음)
- **영향받는 데이터 모델**: `SpotifySession`, `LibraryTrack`, `WeatherContext`, `UserContext`, `RecommendationRequest`, `RecommendationResult`(`isFallback` 포함)
- **신규 환경 변수**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `OPENWEATHER_API_KEY`, `ANTHROPIC_API_KEY`
- **DB 영향 없음** — MVP는 영구 데이터베이스를 두지 않음 (04 §6)

## 3. Spec 요구사항 (ADDED Requirements)

### Requirement: Spotify OAuth Login
사용자는 Spotify OAuth(Authorization Code Flow)로 로그인해 앱에 라이브러리 읽기 권한을 부여할 수 있어야 한다.

#### Scenario: 로그인 성공
- **WHEN** 사용자가 Landing 페이지에서 "Spotify로 시작하기"를 클릭하고 OAuth 동의 화면에서 승인한다
- **THEN** 시스템은 액세스 토큰을 발급하고 사용자를 다음 화면으로 진행시킨다

#### Scenario: 로그인 거부/실패
- **WHEN** 사용자가 동의를 거부하거나 OAuth 흐름이 실패한다
- **THEN** Landing 페이지는 에러 상태와 재시도 버튼을 표시한다

### Requirement: User Library Retrieval
로그인한 사용자의 저장한 곡(Liked Songs) 및 플레이리스트 목록을 조회할 수 있어야 한다.

#### Scenario: 라이브러리 조회 성공
- **WHEN** 로그인이 완료된 사용자에 대해 라이브러리 조회가 실행된다
- **THEN** 최소 1개 이상의 트랙/플레이리스트가 반환된다

#### Scenario: 빈 라이브러리
- **WHEN** 사용자의 라이브러리가 비어 있다
- **THEN** 별도의 안내가 표시된다 (정확한 문구/동작은 02 Open Question — 4절 참고)

### Requirement: Automatic Weather Context
위치 기반으로 현재 날씨(조건 + 기온)를 자동 조회해 추천에 반영해야 한다.

#### Scenario: 위치 권한 허용
- **WHEN** 사용자가 위치 권한을 허용한다
- **THEN** Input 페이지에 날씨 조건과 기온이 표시된다

### Requirement: Mood and Situation Quick-Reply Input
사용자는 기분과 상황을 각각 퀵리플라이 버튼으로 단일 선택할 수 있어야 한다.

#### Scenario: 단일 선택 및 제출 조건
- **WHEN** 사용자가 기분 버튼 그룹과 상황 버튼 그룹에서 각각 하나씩 선택한다
- **THEN** "추천받기" 버튼이 활성화된다

#### Scenario: 미선택 시 제출 차단
- **WHEN** 기분 또는 상황 중 하나라도 선택되지 않았다
- **THEN** "추천받기" 버튼은 비활성화 상태로 표시된다

### Requirement: AI-Based Recommendation Generation and Display
기분·날씨·상황·라이브러리를 종합해 Claude API로 추천을 생성하고, 결과를 화면에 표시해야 한다.

#### Scenario: 추천 성공
- **WHEN** 사용자가 유효한 입력으로 "추천받기"를 제출한다
- **THEN** 로딩 상태를 거쳐 최소 1개 트랙(제목/아티스트/앨범아트)과 추천 이유 문구가 표시된다

### Requirement: Redirect to Spotify for Playback
추천 결과를 클릭하면 Spotify 앱 또는 웹으로 이동해 재생할 수 있어야 한다.

#### Scenario: 결과 클릭
- **WHEN** 사용자가 추천된 트랙 카드를 클릭한다
- **THEN** 새 탭(웹) 또는 앱 딥링크로 해당 Spotify 트랙 페이지가 열린다

### Requirement: Recommendation Library Validation and Fallback
AI가 반환한 추천 트랙은 항상 사용자의 실제 라이브러리 안에 있는 트랙이어야 한다 (환각 방지).

#### Scenario: 정상 응답
- **WHEN** Claude 응답의 트랙이 `librarySample`과 URI/ID 기준으로 일치한다
- **THEN** 해당 트랙과 추천 이유가 그대로 사용자에게 표시된다

#### Scenario: 불일치 후 재시도 성공
- **WHEN** Claude 응답의 트랙이 라이브러리와 일치하지 않는다
- **THEN** 시스템은 제약을 강조해 최대 1회 재시도하고, 성공 시 해당 결과를 사용한다

#### Scenario: 재시도 후에도 불일치 (폴백)
- **WHEN** 재시도 후에도 라이브러리와 일치하는 트랙을 얻지 못한다
- **THEN** 시스템은 `librarySample`에서 결정론적 폴백 트랙을 선택하고 일반화된 이유 문구로 대체하며, 사용자에게는 폴백 여부를 노출하지 않는다

## 4. Design 결정사항

(04_TECHNICAL_DESIGN.md에서 이미 확정된 항목만)

- **Tech Stack**: Next.js, React, TypeScript, Tailwind CSS + Spotify Web API, OpenWeather API, Claude API
- **Routes**: `/`, `/input`, `/result`(쿼리 파라미터 필수, 없으면 `/input` 리다이렉트), `/api/auth/spotify/login`, `/api/auth/spotify/callback`, `/api/spotify/library`, `/api/weather`, `/api/recommend`
- **Data Model**: `SpotifySession`, `LibraryTrack`, `WeatherContext`, `UserContext`, `RecommendationRequest`, `RecommendationResult`(`isFallback` 포함)
- **FR-12 검증 로직**: Claude 응답을 `librarySample`과 대조 → 불일치 시 제약을 강조해 최대 1회 재시도 → 그래도 불일치면 `librarySample[0]` 등 결정론적 폴백 + 일반화된 이유 문구, `isFallback: true`
- **State 관리**: 전역 상태 라이브러리·브라우저 저장소 없이 React 로컬 상태만 사용. Input→Result 전달은 URL 쿼리 파라미터(`uri`, `name`, `artist`, `art`, `reason`)로 확정
- **Storage**: 영구 DB 없음. 라이브러리/추천 결과는 요청-응답 생명주기 동안만 메모리에 존재
- **에러 처리**: 날씨 실패 → 날씨 없이 진행 / Claude 실패 → 재시도 액션 제공 / 토큰 만료 → 재로그인 유도
- **Non-Goals**: 커스텀 인증 시스템, 실시간 기능, 대용량 파일 업로드, Spotify/OpenWeather/Claude 외 외부 연동 없음

### 미정 — 착수 전 확정 필요
- FR-4/FR-5 기분·상황 퀵리플라이의 세부 옵션 목록 (02 TODO — Must 요구사항 자체의 세부값이라 우선순위 높음)
- `librarySample` 선택 기준: 무작위/최근 좋아요/장르 다양성 중 확정 필요 (04 TODO — Claude 비용·추천 품질에 직접 영향)
- 빈 라이브러리일 때 정확한 대체 문구/동작 (02 Open Question)
- FR-10 "다시 추천받기"가 `/api/recommend` 재호출인지 별도 엔드포인트인지 (04 TODO — 단, FR-10 자체는 Should라 이번 change 범위 밖. FR-9/FR-12 구현 시 재사용 가능성만 참고)
- Spotify 토큰 세션 저장의 정확한 구현체: 04에 "예: 암호화된 http-only 쿠키"로만 서술되어 있어, JWT 방식인지 서버 메모리+쿠키 ID 방식인지 확정되지 않음 (배포 대상이 서버리스인지 여부와 직결)
- 배포 대상 (Vercel 가정, 확정 필요)
- Spotify Developer 앱 등록 및 실제 redirect URI 값

## 5. Tasks 제안

### 1. Spotify OAuth (FR-1)
- [ ] 1.1 Spotify Developer 앱 등록 및 redirect URI 확정 (선행 필요 — 위 미정 항목)
- [ ] 1.2 세션 저장 방식(쿠키 구현체) 확정 (선행 필요 — 위 미정 항목)
- [ ] 1.3 `/api/auth/spotify/login`, `/api/auth/spotify/callback` 실제 OAuth 로직 구현

### 2. 라이브러리 조회 (FR-2)
- [ ] 2.1 `/api/spotify/library` 실제 Spotify Web API 연동
- [ ] 2.2 빈 라이브러리 케이스 대체 문구/동작 확정 후 구현

### 3. 날씨 연동 (FR-3)
- [ ] 3.1 브라우저 geolocation 권한 요청 흐름 구현
- [ ] 3.2 `/api/weather` OpenWeather 연동

### 4. 기분/상황 입력 (FR-4, FR-5)
- [ ] 4.1 기분/상황 옵션 목록 확정 (선행 필요 — 위 미정 항목)
- [ ] 4.2 확정된 옵션으로 `QuickReplyChip` 그룹 채우기

### 5. AI 추천 (FR-7, FR-8)
- [ ] 5.1 `librarySample` 선택 기준 확정 (선행 필요 — 위 미정 항목)
- [ ] 5.2 Claude API 프롬프트 설계 및 `/api/recommend` 연동
- [ ] 5.3 추천 결과를 쿼리 파라미터로 `/result`에 전달 (04에서 이미 확정된 방식 적용)

### 6. Spotify 이동 (FR-9)
- [ ] 6.1 mock 딥링크를 실제 Spotify 트랙 URI/웹 링크로 교체

### 7. 추천 검증/폴백 (FR-12)
- [ ] 7.1 `librarySample` 대조 검증 로직 구현
- [ ] 7.2 불일치 시 1회 재시도 로직 구현
- [ ] 7.3 결정론적 폴백 및 `isFallback` 처리 구현

## 이번 change에서 제외 (Should/Could)
- FR-6: 자연어 텍스트로 추가 맥락 입력 (Should)
- FR-10: "다시 추천받기" 재요청 액션 (Should)
- FR-11: 날씨 자동 조회 실패 시 수동 도시 입력 대체 (Could)
