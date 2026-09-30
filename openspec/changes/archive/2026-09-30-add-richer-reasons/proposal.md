## Why

지금 추천 이유는 "한 문장의 친근한 설명"이라는 지시만 받고 생성되어, 사용자가 고른 기분·상황·날씨와 연결되지 않거나 모델이 곡의 사운드·가사를 추측해 단정하는 경우가 있다. 추천을 믿고 바로 재생하게 하려면, 이유가 사용자의 입력과 사용자 자신의 라이브러리(어느 플레이리스트에 넣어둔 곡인지)라는 확인 가능한 근거에 기대야 한다. 이 change는 확장 로드맵(2026-09-28 결정)의 첫 단계로, 이후 자유 입력·옵션 확장·앨범/플레이리스트 추천이 모두 이 이유 생성 규칙 위에 쌓인다.

## What Changes

- 추천 이유가 입력값(기분, 상황, 날씨) 중 값이 있는 것을 하나 이상 언급하도록 한다.
- 곡의 사운드·가사에 대한 사실 주장은 제목과 아티스트만으로 확실한 것에 한정하고, 확실하지 않으면 곡의 분위기를 단정하지 않도록 한다.
- 라이브러리 조회 시 곡별 출처 플레이리스트(사용자 본인이 만든 플레이리스트 이름)를 유지하고, 추천 이유의 근거로 쓸 수 있게 AI에 전달한다. 좋아요만 한 곡(출처 없음)도 그대로 동작한다.
- 추천 이유를 한국어 1~2문장으로 한다 (현재는 1문장).

**제외 (Non-goals)**: UI 변경, API 응답 스키마 변경(`/api/recommend`, `/api/spotify/library` 모두), FR-12 재시도·폴백 로직 변경. 폴백 시의 일반화된 이유 문구도 그대로 둔다.

Breaking change 없음.

## Capabilities

### New Capabilities
(없음)

### Modified Capabilities
- `ai-recommendation`: 기존 "a short reason"을 구체화한다.
  - MODIFIED `AI-Based Recommendation Generation`: 폴백이 아닌 추천의 이유를 한국어 1~2문장으로 정한다.
  - ADDED `Reason References Provided Input`, `No Unfounded Claims About the Track`, `Source Playlist as Grounding`: 입력값 언급, 사실 주장 제한, 출처 플레이리스트 근거와 이를 위한 곡별 출처 정보 유지.
  - ADDED `Unchanged Response Shape and Fallback Behavior`: 응답 형태와 재시도·폴백(일반화된 이유 포함)이 그대로임을 명시한다.

## Impact

- **코드**: `moodtune/lib/openai.ts`(프롬프트, 트랙 목록에 출처 포함), `moodtune/lib/spotify.ts`(라이브러리 조회 시 곡별 출처 수집), `moodtune/app/api/recommend/route.ts`(출처 정보 전달), `moodtune/app/api/spotify/library/route.ts`(응답 형태 유지 확인), `moodtune/types/index.ts`(내부 요청 타입)
- **API 응답**: 변경 없음. 출처 정보는 서버 내부에서만 쓰이고 어떤 응답에도 포함되지 않는다.
- **외부 호출**: Spotify API 호출 수 변화 없음(이미 조회 중인 플레이리스트 데이터 재사용). OpenAI 프롬프트 토큰이 출처 이름만큼 소폭 증가.
- **의존성**: 추가 없음.
- **문서**: `planning/md-design/02` FR-8은 "추천 이유 문구 표시"만 정하고 길이·내용 규칙은 없어 충돌하지 않는다. 갱신 불필요.
