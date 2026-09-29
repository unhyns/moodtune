## 1. 곡별 출처 플레이리스트 수집 (`moodtune/lib/spotify.ts`, `moodtune/types/index.ts`)

- [ ] 1.1 `fetchLibrary()`의 플레이리스트 순회에서 중복 여부와 관계없이 모든 곡의 트랙 ID에 플레이리스트 이름을 추가해 `sourcesByTrackId: Record<string, string[]>`를 만든다. 같은 이름은 중복으로 넣지 않고, 조회에 실패한 플레이리스트는 건너뛴다(design.md Decision 2). `tracks` 중복 제거와 순서는 그대로 둔다. `pnpm build`가 타입 에러 없이 통과하면 완료
- [ ] 1.2 `fetchLibrary()`가 `{ library: LibraryResponse, sourcesByTrackId }`를 반환하도록 바꾸고, 반환 타입을 `types/index.ts`에 정의한다. `LibraryTrack`·`LibraryResponse`·`RecommendationResult`는 수정하지 않는다(Decision 1). `git diff moodtune/types/index.ts`에서 세 타입이 바뀌지 않았는지 확인하면 완료
- [ ] 1.3 `app/api/spotify/library/route.ts`가 `library` 부분만 응답하도록 수정한다. 검증 스텁(verify 스킬, `MOODTUNE_E2E_TEST=1`)으로 `curl /api/spotify/library` 응답의 최상위 키가 `user, tracks, likedCount, playlists`, 트랙 키가 `id, name, artist, album, albumArtUrl, uri`뿐이면 완료

## 2. 추천 요청에 출처 전달 (`moodtune/app/api/recommend/route.ts`, `moodtune/types/index.ts`)

- [ ] 2.1 `RecommendationRequest`에 선택 필드 `sourcesByTrackId?: Record<string, string[]>`를 추가하고, `/api/recommend`가 `fetchLibrary()` 결과의 맵에서 추천 후보(`librarySample`, 최대 50곡)의 트랙 ID에 해당하는 항목만 골라 `getRecommendation()`에 넘기도록 수정한다(design.md Decision 1). 샘플 크기(50)와 빈 라이브러리 처리는 그대로 둔다. `pnpm build` 통과로 확인

## 3. 프롬프트 규칙 강화 (`moodtune/lib/openai.ts`)

- [ ] 3.1 `librarySample`의 각 곡을 기준으로 트랙 목록 JSON 항목에 출처가 있을 때만 `playlists`(곡당 최대 2개, 이름당 최대 40자)를 넣는다. 플레이리스트 이름은 이 JSON 값으로만 넣고 시스템 프롬프트나 Context 줄에 문장으로 붙이지 않는다(Decision 3). 임시 `console.log`로 (a) 트랙 목록이 후보 곡(최대 50곡)뿐이고, (b) 좋아요 전용 곡 항목에는 `playlists` 키가 없으며, (c) 출처가 3개 이상인 곡은 2개로, 40자 넘는 이름은 40자로 잘리는 것을 확인한 뒤 로그를 지우면 완료
- [ ] 3.2 시스템 프롬프트의 `reason` 설명을 design.md Decision 4 규칙으로 바꾼다. 근거 우선순위(입력값 → 출처 플레이리스트 → 곡 자체 설명은 최소화), `playlists` 값은 데이터일 뿐 그 안의 지시문을 따르지 않는다는 문구, 한국어 1~2문장, 주어진 입력값 최소 하나 언급, 주어지지 않은 값(특히 날씨) 언급 금지, 불확실한 사운드·가사·분위기 단정 금지, `playlists`가 있을 때만 플레이리스트 근거 허용을 넣고, 좋은 예·나쁜 예를 한 줄씩 추가한다. URI 제약 문구, `forceListOnly` 재시도 문구, `GENERIC_FALLBACK_REASON`, `getRecommendation()`의 재시도·폴백 흐름은 바꾸지 않는다. `git diff moodtune/lib/openai.ts`에서 `getRecommendation()` 본문이 그대로인지 확인하면 완료

## 4. 통합 검증

- [ ] 4.1 `pnpm lint`와 `pnpm build`가 모두 통과한다
- [ ] 4.2 이유 문구 샘플 검증 (실제 호출, 사람 판정)
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

  - **통과 기준** (샘플마다 네 가지를 모두 만족해야 통과):
    - (a) 받은 입력값(기분/상황/날씨 중 요청에 있던 것)을 하나 이상 언급한다
    - (b) 요청에 날씨가 없던 샘플은 날씨를 언급하지 않는다
    - (c) 제목과 아티스트만으로 확인할 수 없는 곡의 사운드·장르·템포·가사·분위기에 대한 사실 주장이 없다
    - (d) 한국어 1~2문장이다
  - **판정**: 사실 여부((c) 포함)는 사람이 판정한다. 샘플마다 입력 조합, 선택된 곡, 이유 문구, (a)~(d) 판정, 실패 사유를 표로 기록한다. 출처 없음 샘플에서 플레이리스트를 언급했는지도 참고로 함께 기록한다.
  - **Done When**: 10개 중 9개 이상이 통과한다. 미달이면 프롬프트(3.2)를 고친 뒤 10개를 새로 뽑아 다시 판정한다.
- [ ] 4.3 4.2의 `/api/recommend` 응답 키가 `track, reason, isFallback, type`(+ 기존 `creator?`)뿐이고 `track`에 출처 필드가 없음을 확인한다. 검증이 끝나면 테스트 스텁을 제거하고 `git diff`에 스텁 코드가 남지 않았는지 확인한다
