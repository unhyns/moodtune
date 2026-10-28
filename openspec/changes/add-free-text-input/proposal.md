## Why

기분/상황 칩 6+6개로는 "비 오는데 늦잠 자서 급하게 나가는 중"처럼 사용자가 실제로 느끼는 상태를 다 담지 못한다. 기획 문서는 FR-6(자연어 텍스트 입력, Should)을 두고 `UserContext.freeText` 타입과 프롬프트의 `note:` 줄까지 이미 만들어 두었지만, 화면과 API가 이를 받지 않아 지금은 쓸 수 없다. 칩을 고르기 어려운 사용자에게 한 문장으로 바로 추천받는 경로를 연다.

## What Changes

- `/input`에 '직접 입력' 진입 요소를 추가한다. 누르면 새 페이지 `/input/custom`으로 이동한다. 칩 선택·날씨 표시·Tune Mine! 등 `/input`의 기존 동작은 바뀌지 않는다.
- `/input/custom`은 텍스트 입력 하나만 있는 페이지다.
  - 최대 200자. 빈 값이나 공백만 있으면 제출할 수 없다.
  - 진입 전 `/input`에서 고른 칩은 반영하지 않는다. 텍스트 경로는 칩과 함께 쓰이지 않는다.
  - 날씨는 새로 조회하지 않는다. `/input`이 이미 얻은 값(도시/아이콘/기온, 또는 실패 상태)을 sessionStorage로 받아 읽기 전용으로 보여 주고 추천 맥락으로만 보낸다.
  - 작성 중인 텍스트는 sessionStorage에 임시 저장해 뒤로가기·새로고침 후에도 남는다.
  - 입력창 근처에 "입력한 내용은 추천 생성에 사용됩니다" 안내 문구를 둔다.
  - 제출은 버튼으로만 한다. 한글 조합 중 Enter 때문에 두 번 제출되지 않는다.
  - 제출하면 `/input`과 같은 로딩 팝업을 거쳐 `/result`로 바로 이동한다.
  - 전송에 실패하면 텍스트를 유지한 채 재시도할 수 있고, `/input`으로 돌아가는 링크를 둔다.
- `/api/recommend`는 `mood`, `situation`, `freeText` 중 하나 이상 있으면 요청을 받는다. `freeText`는 공백 제거 후 1~200자여야 한다. `freeText`가 있으면 `mood`/`situation`은 무시한다.
- 프롬프트는 `freeText`를 사용자가 쓴 **데이터**로만 다룬다(그 안의 지시는 따르지 않는다). 텍스트는 곡 선택에만 쓰고, 이유는 모델 문장 대신 코드가 정하는 고정 문장("{상태} {기온표현} 날, 남겨주신 이야기를 바탕으로 골랐어요." / 날씨가 없으면 "남겨주신 이야기를 바탕으로 골랐어요.")으로 한다. 출처 플레이리스트 인용은 그대로 붙인다.
- `/result` URL 쿼리에는 `freeText` 원문(입력한 그대로의 문자열)을 넣지 않는다. 별도 파라미터로도, 다른 파라미터 안에 복사된 형태로도 넣지 않는다. 추천 이유는 칩 경로와 같이 URL로 전달된다. 텍스트 경로의 결과 화면에는 날씨 배지만 표시된다.
- `/input`의 제출 로직(API 호출, 로딩 팝업 연동, 에러 처리, `/result` 이동)을 공유 훅으로 분리한다. 분리 후 `/input`의 동작이 이전과 같은지 먼저 검증한다.
- 기획 문서의 FR-6 설명("Input 화면 안의 옵션 텍스트, 칩과 함께 사용")을 "별도 페이지, 칩과 배타적"으로 갱신한다.

**제외 (Non-goals)**: 칩과 텍스트를 함께 쓰는 입력(텍스트 경로에서는 칩을 완전히 무시), 추천 로직 변경(라이브러리 샘플링·후보 선택·재시도/폴백·응답 형태), 텍스트 저장·이력, 결과 화면에 입력 텍스트 표시, 새 외부 서비스나 의존성 추가.

Breaking change 없음. 기존 `mood`/`situation` 요청은 이전과 같이 처리된다.

## Capabilities

### New Capabilities
- `free-text-input`: `/input`의 '직접 입력' 진입, `/input/custom` 페이지(200자 제한, 빈 값 차단, 임시 저장, 안내 문구, 조합 중 중복 제출 방지), `/input`에서 넘겨받은 날씨 사용, 로딩 팝업을 거친 `/result` 이동, 실패 시 재시도와 돌아가기, 결과 URL에 원문 미포함.

### Modified Capabilities
- `ai-recommendation`: 추천 입력에 자유 텍스트를 추가한다. "AI-Based Recommendation Generation"과 "Reason References Provided Input"을 freeText까지 포함하도록 고친다. 요청 검증(mood/situation/freeText 중 하나 이상, 길이 제한, freeText가 있으면 칩 무시)과 freeText를 데이터로만 다루는 요구사항을 추가한다. 곡 주장 금지·출처 인용·응답 형태·폴백 요구사항은 바뀌지 않는다.

`mood-context-input`은 바뀌지 않는다. 칩 화면의 선택 규칙과 제출 활성화 조건은 그대로이고, 진입 요소는 `free-text-input`에서 정의한다.

## Impact

- **코드**:
  - 새 파일: 공유 제출 훅 `moodtune/lib/useRecommendSubmit.ts`, 새 페이지 `moodtune/app/input/custom/page.tsx`, sessionStorage 헬퍼 `moodtune/lib/inputHandoff.ts`, 날씨 표현 공용 모듈 `moodtune/lib/weatherPhrase.ts`(+ 경계값 테스트).
  - 수정: `moodtune/app/input/page.tsx`(훅 사용, 날씨 sessionStorage 기록, 진입 요소 추가), `moodtune/app/api/recommend/route.ts`(검증과 freeText 전달), `moodtune/lib/openai.ts`(freeText를 데이터로 다루는 프롬프트 규칙).
  - `moodtune/types/index.ts`의 `UserContext.freeText`는 이미 있어 바꾸지 않는다.
- **API**: `POST /api/recommend` 요청 본문에 선택 필드 `freeText` 추가. 응답 형태는 변경 없음.
- **외부 호출·의존성**: 추가 없음. OpenAI에 보내는 프롬프트에 사용자 텍스트가 포함된다.
- **문서**: `planning/md-design/02_REQUIREMENTS_SPEC.md` FR-6, `planning/md-design/03_UX_UI_SPEC.md` §1.2·§3, `docs/DESIGN.md` Main Screens.
