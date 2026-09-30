## Why

PRD 성공 기준의 "체감 품질"(추천이 상황에 맞다고 느끼는 비율 5회 중 4회 이상)은 지금 측정할 방법이 없어 주관적 기억에 의존한다. Result 화면에서 바로 예/아니오로 답하게 하면 실제 사용 중에 만족 비율을 셀 수 있고, 같은 데이터가 이후 개인화 change(`add-personal-signals`)의 입력 신호가 된다.

## What Changes

- Result 화면에 "이 추천 어땠나요?" 문구와 예/아니오 버튼을 추가한다. 응답은 선택 사항이며, 응답하지 않아도 Listen in Spotify!, Tune Again? 등 기존 동작은 그대로다.
- 버튼을 누르면 감사 문구로 바뀌고, 같은 결과(같은 URI)에는 다시 응답할 수 없다. 새로고침하거나 같은 곡이 다시 추천되어도 응답한 상태로 보인다.
- 응답은 브라우저 localStorage에 Spotify URI(트랙/앨범/플레이리스트)를 키로, `'liked' | 'disliked'`를 값으로 저장한다. 저장 구조는 URI별 항목 안에 필드를 두는 형태로, 이후 핀·제외 신호가 같은 항목에 필드를 추가해 공유할 수 있게 설계한다.
- 응답할 때마다 전체 응답 중 만족 비율을 브라우저 콘솔에 로그로 남긴다(PRD 체감 만족도 실측용).
- 기획 문서의 "localStorage 사용하지 않음" 원칙(04 §5·§6)을 이 용도에 한해 허용하도록 갱신한다. 2026-09-28 결정(개인화 저장은 DB 대신 localStorage)과 맞춘다.

**제외 (Non-goals)**: 피드백을 추천 로직(`/api/recommend`, 프롬프트, 샘플링)에 반영하는 것(`add-personal-signals`의 몫), 핀·제외 UI와 동작, DB 저장, 서버 전송·분석 도구 연동, 응답 수정·취소 UI.

Breaking change 없음.

## Capabilities

### New Capabilities
- `recommendation-feedback`: Result 화면의 만족도 질문과 응답 UI, 재응답 차단, localStorage 저장 스키마(URI 키, 핀·제외와 공유 가능한 구조), 콘솔 만족 비율 로그.

### Modified Capabilities
(없음) — `spotify-playback-redirect`의 Listen 동작과 `ai-recommendation`의 추천 생성은 요구사항이 바뀌지 않는다. 피드백이 이 둘에 영향을 주지 않는다는 점은 새 capability 안에서 명시한다.

## Impact

- **코드**: `moodtune/app/result/page.tsx`(피드백 컴포넌트 배치), 새 클라이언트 컴포넌트 `moodtune/components/SatisfactionFeedback.tsx`, 새 저장 모듈 `moodtune/lib/personalSignals.ts`(읽기·쓰기·만족 비율 계산), `moodtune/types/index.ts`(저장 타입)
- **API**: 변경 없음. 서버로 보내는 요청이 없다.
- **외부 호출·의존성**: 추가 없음.
- **문서**: `planning/md-design/04_TECHNICAL_DESIGN.md` §5·§6(localStorage 허용 범위), `docs/DESIGN.md` Result 화면 설명에 피드백 영역 추가.
