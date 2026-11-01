## Why

추천이 라이브러리 맨 앞(가장 최근에 좋아요를 누른 곡) 쪽 곡으로 반복해서 쏠리고, 입력이 달라도 같은 곡이 나온다는 문제가 사용자에게서 보고됐다. 지금은 후보 목록이 요청마다 같은 순서로 모델에 전달되므로, 목록 위치가 선택에 영향을 줄 여지를 없앤다.

## What Changes

- 모델에 보내는 후보 곡 목록의 **순서만** 요청마다 무작위로 섞는다. 후보 집합은 바뀌지 않는다.
- 프롬프트에 "후보의 순서에는 의미가 없다"는 한 줄을 추가한다.
- 폴백은 섞기 전 원래 순서의 첫 곡을 그대로 쓴다(FR-12 결정론 유지).
- 난수 함수는 서버 내부 함수의 인자로 주입하고(기본값 `Math.random`) 요청 본문으로는 받지 않는다. 테스트는 고정 함수를 넘긴다.
- 칩 경로와 자유 텍스트 경로 모두 적용한다.

**제외 (Non-goals)**: 후보 집합 변경(최근 좋아요 우선 최대 50곡 샘플링은 그대로), 최근 추천 곡 제외 같은 반복 방지 기록, 모델 `temperature` 변경, 응답 형태·재시도·reason 규칙 변경, 새 의존성.

## Capabilities

### New Capabilities
<!-- 없음 -->

### Modified Capabilities
- `ai-recommendation`: 후보 순서를 요청마다 섞고 순서가 무의미함을 AI에 알리는 요구사항("Candidate Order Randomized Per Request")을 추가한다. 폴백은 원래 순서의 첫 곡으로 유지한다.

## Impact

- **코드**:
  - 새 파일: 섞기 순수 함수 `moodtune/lib/shuffle.ts`와 테스트 `shuffle.test.mjs`.
  - 수정: `moodtune/lib/openai.ts`(`getRecommendation`의 난수 인자, 섞은 목록을 프롬프트에 사용, 안내 한 줄). 라우트와 타입은 바꾸지 않는다.
- **API**: 요청·응답 형태 변경 없음.
- **외부 호출·의존성**: 추가 없음. 실제 OpenAI 확인은 사용자 승인 후 최대 6회.
- **문서**: `planning/md-design/04_TECHNICAL_DESIGN.md` §4.1·§4.2, `planning/md-design/02_REQUIREMENTS_SPEC.md` Decisions Log(적용 시).
