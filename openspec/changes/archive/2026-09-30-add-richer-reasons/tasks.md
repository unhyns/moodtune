## 1. 곡별 출처 플레이리스트 수집 (`moodtune/lib/spotify.ts`, `moodtune/types/index.ts`)

- [x] 1.1 `fetchLibrary()`의 플레이리스트 순회에서 중복 여부와 관계없이 모든 곡의 트랙 ID에 플레이리스트 이름을 추가해 `sourcesByTrackId: Record<string, string[]>`를 만든다. 같은 이름은 중복으로 넣지 않고, 조회에 실패한 플레이리스트는 건너뛴다(design.md Decision 2). `tracks` 중복 제거와 순서는 그대로 둔다. `pnpm build`가 타입 에러 없이 통과하면 완료
- [x] 1.2 `fetchLibrary()`가 `{ library: LibraryResponse, sourcesByTrackId }`를 반환하도록 바꾸고, 반환 타입을 `types/index.ts`에 정의한다. `LibraryTrack`·`LibraryResponse`·`RecommendationResult`는 수정하지 않는다(Decision 1). `git diff moodtune/types/index.ts`에서 세 타입이 바뀌지 않았는지 확인하면 완료
- [x] 1.3 `app/api/spotify/library/route.ts`가 `library` 부분만 응답하도록 수정한다. 검증 스텁(verify 스킬, `MOODTUNE_E2E_TEST=1`)으로 `curl /api/spotify/library` 응답의 최상위 키가 `user, tracks, likedCount, playlists`, 트랙 키가 `id, name, artist, album, albumArtUrl, uri`뿐이면 완료

## 2. 추천 요청에 출처 전달 (`moodtune/app/api/recommend/route.ts`, `moodtune/types/index.ts`)

- [x] 2.1 `RecommendationRequest`에 선택 필드 `sourcesByTrackId?: Record<string, string[]>`를 추가하고, `/api/recommend`가 `fetchLibrary()` 결과의 맵에서 추천 후보(`librarySample`, 최대 50곡)의 트랙 ID에 해당하는 항목만 골라 `getRecommendation()`에 넘기도록 수정한다(design.md Decision 1). 샘플 크기(50)와 빈 라이브러리 처리는 그대로 둔다. `pnpm build` 통과로 확인

## 3. 프롬프트 규칙 강화 (`moodtune/lib/openai.ts`)

- [x] 3.1 트랙 목록 JSON은 `{uri, name, artist}`만 담고 `playlists`는 모델에 넘기지 않는다. `getRecommendation()`에서 `isFallback: false`일 때만, 선택된 곡에 출처가 있으면 모델 문장 뒤에 `'{이름}' 플레이리스트에 넣어두신 곡이에요.`(첫 번째 출처, 40자를 넘으면 공백 기준으로 자르고 `…`)를 붙이고, 출처가 없으면 모델 문장을 그대로 둔다. 폴백 반환 줄(`GENERIC_FALLBACK_REASON`, `librarySample[0]`)은 바꾸지 않는다(design.md Decision 3). 스텁으로 (a) 출처 있는 곡은 인용 문장이 붙고, (b) 출처 없는 곡은 1문장 그대로이며, (c) 40자 넘는 이름은 단어 중간이 아니라 공백 기준으로 잘리고 `…`가 붙는 것을 확인하면 완료
- [x] 3.2 시스템 프롬프트의 `reason` 설명을 design.md Decision 4 규칙으로 바꾼다. 한국어 정확히 1문장, 입력값으로만 구성, 플레이리스트는 절대 언급 금지, 주어진 입력값(기분·상황·날씨) 모두 사용, 기분·상황이 둘 다 있으면 한 문장에 엮기, 날씨는 조건 그대로와 숫자 기온으로만 표현, 주어지지 않은 값 언급 금지, 기분·상황 표현의 의미와 핵심 단어 유지, 곡 자체 설명과 곡-입력 연결 표현 금지를 넣고, 가상 표현("나른한 기분", "도서관에 가는 중", "흐림, 15°C")으로 된 좋은 예·나쁜 예를 둔다. 기분·상황은 `MOOD_OPTIONS`/`SITUATION_OPTIONS`의 `promptLabel`(한국어)로 바꿔 넘긴다. URI 제약 문구, `forceListOnly` 재시도 문구, 재시도·폴백 흐름은 바꾸지 않는다. `git diff`에서 폴백 반환 줄이 그대로인지 확인하면 완료

## 4. 통합 검증

- [x] 4.1 `pnpm lint`와 `pnpm build`가 모두 통과한다
- [x] 4.2 이유 문구 샘플 검증 (실제 호출, 사람 판정)
  - **준비**: verify 스킬의 스텁을 확장해 테스트 라이브러리를 두 가지로 둔다. 출처 있음 = 모든 후보 곡이 좋아요 + 본인 플레이리스트 "출근길"에 모두 있음, 출처 없음 = 모든 후보 곡이 좋아요 전용. 날씨 없음은 요청 body에서 `weather`를 빼서 만든다.
  - **샘플**: 실제 `OPENAI_API_KEY`로 `/api/recommend`를 아래 10개 조합으로 1회씩 호출한다. 폴백(`isFallback: true`) 응답은 샘플로 치지 않고 같은 조합으로 다시 호출한다.

    | # | 입력 | 날씨 | 출처 |
    |---|---|---|---|
    | 1 | 기분만 | 있음 | 있음 |
    | 2 | 기분만 | 없음 | 없음 |
    | 3 | 기분만 | 없음 | 있음 |
    | 4 | 상황만 | 있음 | 없음 |
    | 5 | 상황만 | 없음 | 있음 |
    | 6 | 상황만 | 있음 | 있음 |
    | 7 | 둘 다 | 있음 | 있음 |
    | 8 | 둘 다 | 없음 | 없음 |
    | 9 | 둘 다 | 있음 | 없음 |
    | 10 | 둘 다 | 없음 | 있음 |

  - **통과 기준** (샘플마다 여섯 가지를 모두 만족해야 통과):
    - (a) 받은 입력값(기분/상황/날씨 중 요청에 있던 것)을 하나 이상 언급한다
    - (b) 요청에 날씨가 없던 샘플은 날씨를 언급하지 않는다
    - (c) 제목과 아티스트만으로 확인할 수 없는 곡의 사운드·장르·템포·가사·분위기에 대한 사실 주장이 없다
    - (d) 한국어 1~2문장이다
    - (e) 받지 않은 기분·상황·날씨를 언급하지 않는다 (받은 값을 다른 기분·상황으로 바꿔 말하는 것도 포함)
    - (f) 출처 없는 곡에 플레이리스트(또는 그 곡 제목·다른 텍스트를 플레이리스트처럼)를 언급하지 않는다
  - **판정**: 사실 여부((c) 포함)는 사람이 판정한다. 샘플마다 입력 조합, 선택된 곡, 이유 문구, (a)~(f) 판정, 실패 사유를 표로 기록한다. 출처 있음 샘플에서 출처를 실제로 인용했는지도 참고로 함께 기록한다.
  - **Done When**: 10개 중 9개 이상이 통과한다. 미달이면 프롬프트(3.2)를 고친 뒤 10개를 새로 뽑아 다시 판정한다.
  - **결과 (2026-09-30, 8차에서 마무리)**: (a)~(f) 10/10 통과, 사람 판정 완료. 참고 항목인 입력값 반영은 9/10이다. 남은 1건은 "집중하는 중 + 카페에 있는 중"처럼 두 표현이 자연스럽게 엮이지 않는 특수 케이스라 완료로 판정했다. 8차 샘플은 위 표 대신 기분+상황이 둘 다 있고 날씨가 있는 조합 위주로 뽑았다(기분+상황 8개, 날씨 있음 7개, 출처 있음·없음 각 5개). 위 표의 조합은 1~7차에서 사용했다. 1~8차 경과는 design.md Decision 4에 있다.
- [x] 4.3 4.2의 `/api/recommend` 응답 키가 `track, reason, isFallback, type`(+ 기존 `creator?`)뿐이고 `track`에 출처 필드가 없음을 확인한다. 검증이 끝나면 테스트 스텁을 제거하고 `git diff`에 스텁 코드가 남지 않았는지 확인한다
