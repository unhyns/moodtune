# 05. Delivery Plan — MoodTune

> Scope: 오늘 구현할 범위(20~30%)와 수동 QA.
> 다루지 않음: 무엇을 만들지(02), 어떻게 만들지(04) 자체에 대한 결정.

## 1. 전체 범위 대비 오늘의 범위 (20~30%)
전체 MVP는 01의 5개 핵심 기능(Spotify 연동 / 날씨 반영 / 기분·상황 입력 / AI 추천 / Spotify 이동)이다.
외부 API(Spotify OAuth, OpenWeather, Claude) 연동은 다음 세션 이후로 미루고, **오늘은 API 키 없이 검증 가능한 정적 UI 뼈대 + 로컬 상태 인터랙션**만 구현한다.

### 오늘 구현 항목
1. Next.js 라우트 3개 스캐폴딩: `/`, `/input`, `/result` (정적 레이아웃, 실제 라우팅 동작 확인)
2. 공통 컴포넌트 뼈대 구현 (스타일만, API 연동 없음): `PrimaryButton`, `SecondaryButton`, `QuickReplyChip`, `TrackCard`
3. `/input` 페이지: 기분·상황 `QuickReplyChip` 단일 선택 인터랙션 (로컬 state, 03의 상호작용 규칙대로 미선택 시 CTA 비활성화)
4. `/input` → `/result` 이동: 실제 API 호출 없이 더미(mock) `RecommendationResult` 데이터를, 04에서 확정한 **URL 쿼리 파라미터 방식**(`/result?uri=...&name=...&artist=...&art=...&reason=...`)으로 전달해 Result 화면 렌더링 확인 (3회차에 실제 API 응답으로 교체할 때 전달 방식은 그대로 유지)

### 오늘 하지 않는 항목 (다음 세션)
- Spotify OAuth 로그인 (FR-1)
- 실제 라이브러리 조회 (FR-2)
- 날씨 API 연동 (FR-3) 및 수동 도시 입력 (FR-11) — FR-11은 02_REQUIREMENTS_SPEC.md에서 Must로 격상되었지만, 날씨 API 실패 상태와 묶여 있는 기능이라 오늘의 mock-only 범위에는 포함하지 않는다. 다음 세션에 날씨 API 연동과 함께 구현한다.
- Claude API 추천 연동 (FR-7)
- Spotify로 실제 이동하는 딥링크 (FR-9) — 오늘은 더미 링크로 대체

## 2. 작업 체크리스트 (10~20분 단위)
각 작업은 route/shell/type/placeholder 중심이며 CRUD 전체 구현은 포함하지 않는다. 뒤에서부터(16→1) 순서로 잘라내도 앞 작업에는 영향 없음.

### A. 프로젝트 기반 (필수 선행)
- [ ] 1. (15분) `create-next-app`으로 Next.js + TypeScript + Tailwind 프로젝트 초기화
- [ ] 2. (10분) 폴더 뼈대 생성: `components/`, `lib/`, `types/` (빈 파일/`.gitkeep`만)
- [ ] 3. (15분) `types/index.ts` 작성 — `LibraryTrack`, `WeatherContext`, `UserContext`, `RecommendationRequest`, `RecommendationResult`(`isFallback` 포함) 인터페이스만, 로직 없음

### B. Route shell (레이아웃만, 로직 없음)
- [ ] 4. (15분) `/` (Landing) 페이지 — 로고/슬로건 + `PrimaryButton` 자리만 배치, onClick 없음
- [ ] 5. (15분) `/input` 페이지 — 헤더 + 빈 섹션 3개(날씨/기분/상황) 레이아웃만
- [ ] 6. (15분) `/result` 페이지 — 레이아웃 뼈대 + `searchParams` 타입만 지정 (파싱 로직은 14~15에서)

### C. 컴포넌트 shell (props 타입 + 최소 스타일, 상태/API 없음)
- [ ] 7. (15분) `PrimaryButton`, `SecondaryButton` — props 타입 정의 + 기본 스타일만
- [ ] 8. (15분) `QuickReplyChip` — `selected` prop으로 시각 상태만 구분, 클릭 핸들러는 타입만
- [ ] 9. (15분) `TrackCard` — props 타입 + 더미 레이아웃 (앨범아트/제목/아티스트/이유 자리만)
- [ ] 10. (15분) `WeatherBadge` + `TextField` — shell만 (실제 날씨 연동 없음)
- [ ] 11. (15분) `LoadingIndicator` + `ErrorBanner` — shell만 (지금은 아무 데서도 트리거 안 됨)

### D. 최소 인터랙션 (CRUD 아님, 로컬 state만)
- [ ] 12. (20분) `/input`에 `QuickReplyChip` 두 그룹(기분/상황) 배치 + 로컬 state로 단일 선택 토글 연결
- [ ] 13. (10분) 기분·상황 미선택 시 "추천받기" 버튼 disabled 처리

### E. Mock 흐름 연결 (04 State 섹션에서 확정한 쿼리 파라미터 방식)
- [ ] 14. (15분) Input 제출 시 하드코딩된 mock `RecommendationResult`를 쿼리 파라미터로 인코딩해 `router.push('/result?...')`
- [ ] 15. (15분) `/result`에서 쿼리 파라미터 파싱 → `TrackCard`에 표시, 필수 파라미터(`uri`, `name`) 없으면 `/input`으로 리다이렉트

### F. (선택) 3회차 워밍업 — route stub만 미리 생성
- [ ] 16. (15분) `/api/recommend`, `/api/weather`, `/api/spotify/library`, `/api/auth/spotify/login`, `/api/auth/spotify/callback` route 파일을 빈 stub(요청/응답 타입만 정의, 하드코딩된 placeholder 응답)으로 생성 — 실제 연동은 3회차

## 3. 수동 QA 체크리스트 (오늘 구현 범위 기준)

| # | 시나리오 | 확인 방법 | 기대 결과 |
|---|----------|-----------|-----------|
| 1 | 라우팅 | `/`, `/input`, `/result`를 브라우저에서 직접 이동 | 각 페이지가 에러 없이 렌더링됨 |
| 2 | 기분 선택 | Input 페이지에서 기분 Chip 하나 클릭 | 해당 Chip이 선택 상태로 시각적 표시, 다른 Chip은 비선택 유지 |
| 3 | 기분 재클릭 | 선택된 기분 Chip을 다시 클릭 | 선택 해제됨 (03 상호작용 규칙) |
| 4 | 상황 선택 | 상황 Chip 하나 클릭 | 기분과 동일하게 단일 선택 동작 |
| 5 | CTA 비활성화 | 기분/상황 중 하나라도 미선택 상태에서 "추천받기" 확인 | 버튼이 비활성화(클릭 불가) 상태로 표시 |
| 6 | CTA 활성화 | 기분+상황 모두 선택 | "추천받기" 버튼이 활성화됨 |
| 7 | Mock 제출 | "추천받기" 클릭 (mock 데이터 사용) | 쿼리 파라미터와 함께 `/result`로 이동, `TrackCard`에 더미 곡 정보 표시 |
| 7-1 | 잘못된 진입 | 쿼리 파라미터 없이 `/result` 직접 접속 | `/input`으로 자동 리다이렉트됨 |
| 8 | 자연어 입력 | 텍스트 필드를 비운 채 제출 | 정상적으로 제출 가능 (필수 아님, FR-6) |
| 9 | 모바일 레이아웃 | 브라우저 창을 모바일 너비(~375px)로 조정 후 각 페이지 확인 | 레이아웃 깨짐 없음, 탭 영역 충분히 큼 |
| 10 | 라벨/접근성 | 모든 버튼/입력 필드에 텍스트 라벨 존재 여부 육안 확인 | 아이콘 단독 버튼 없음 (03 접근성 규칙) |

## 4. Definition of Done (오늘 기준)
- [ ] 3개 라우트가 모두 정상 렌더링된다.
- [ ] 기분/상황 선택 인터랙션이 단일 선택으로 동작한다.
- [ ] 미선택 시 CTA가 비활성화된다.
- [ ] Mock 데이터로 Input → Result 흐름이 끊김 없이 연결된다.
- [ ] 위 수동 QA 체크리스트 10개 항목이 모두 통과한다.

## 5. 다음 세션 예고 (참고용, 상세 계획 아님)
Spotify OAuth 연동 → 실제 라이브러리 조회 → 날씨 API 연동 → Claude 추천 연동 → Spotify 딥링크 연결 순으로 진행 (근거는 04_TECHNICAL_DESIGN.md 참고).

## 6. Open Questions
- [ ] TODO: 오늘 구현 완료 후, 실제 Spotify Developer 앱 등록을 다음 세션 전에 미리 해둘지 여부.
