## Why

현재 MoodTune은 추천을 받을 때마다 결과 화면만 보여주고 끝나며, 사용자가 과거에 어떤 추천을 받았는지 다시 확인할 방법이 없다. 예전에 마음에 들었던 추천을 다시 찾거나, 특정 기분·날짜의 추천 이력을 돌아보고 싶은 사용자를 위해 추천 히스토리 기능을 추가한다.

## What Changes

- 추천이 생성될 때마다 히스토리 항목을 기록하는 기능 추가
- 과거 추천 목록을 확인할 수 있는 화면/API 추가
- 각 히스토리 항목의 상태(재생함/저장함/무시함)를 변경하는 기능 추가
- 기분·날짜 기준으로 히스토리를 필터링하는 기능 추가

Breaking change 없음 — 기존 추천 흐름(`add-moodtune-mvp`)에 추가되는 기능이며 그 요구사항을 변경하지 않는다.

**참고 (범위 밖 영향)**: 이 기능은 `planning/md-design/04_TECHNICAL_DESIGN.md`의 "영구 데이터베이스 없음" 결정 및 `02_REQUIREMENTS_SPEC.md`의 NFR-5("불필요한 사용자 데이터 영구 저장 금지")와 배치되어, 신규 영구 저장소 도입이 필요하다 (design.md에서 구체적으로 다룸). `planning/md-design/` 문서 자체를 이 방향에 맞게 갱신하는 작업은 이 change의 범위 밖이며 별도로 진행이 필요하다.

## Capabilities

### New Capabilities
- `recommendation-history`: 사용자가 받은 추천 기록을 생성·조회·상태 변경·필터링하는 기능

### Modified Capabilities
(없음 — 추천 생성 시점에 히스토리 항목이 함께 만들어지지만, 이는 `recommendation-history` capability의 요구사항으로 정의하며 기존 `ai-recommendation`의 요구사항 자체는 변경하지 않는다. `ai-recommendation`은 아직 별도 change(`add-moodtune-mvp`)에 속해 있고 `openspec/specs/`에 아카이브되지 않았으므로 이 change에서 델타 대상으로 삼지 않는다.)

## Impact

- **신규 라우트**: `/history`(화면), `/api/history`(GET 목록+필터, POST 생성, PATCH 상태 변경)
- **신규 데이터 모델**: `HistoryEntry` (트랙, 기분, 상황, 날씨, 생성 시각, 상태)
- **신규 저장소**: 영구 데이터베이스 도입 필요 (구체적 선택은 design.md 참고) — 기존 "DB 없음" 결정과 배치됨
- **의존 관계**: `add-moodtune-mvp`가 정의한 `RecommendationResult` 구조를 참조하되, 그 change의 파일은 직접 수정하지 않는다
