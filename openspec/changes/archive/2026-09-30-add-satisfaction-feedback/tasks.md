## 1. 저장 스키마와 모듈 (`moodtune/types/index.ts`, `moodtune/lib/personalSignals.ts`)

- [x] 1.1 `types/index.ts`에 `PersonalSignal`(`feedback?: "liked" | "disliked"`, `feedbackAt?: string`, 핀·제외 예정 주석)과 `PersonalSignalsStore`(`version: 1`, `items: Record<string, PersonalSignal>`)를 추가한다(design.md Decision 1). 기존 타입은 바꾸지 않는다. `git diff moodtune/types/index.ts`에 추가만 있고 `pnpm build`가 통과하면 완료
- [x] 1.2 `lib/personalSignals.ts`에 `readSignals`, `setFeedback`, `feedbackStats`, `isSignalUri`를 구현한다(Decision 2). `readSignals`는 파싱 실패·버전 불일치·접근 예외 시 빈 저장소를, `setFeedback`은 기존 `feedback`이 있으면 덮어쓰지 않고 `false`를 반환하며 다른 필드는 유지한다. 브라우저 콘솔(`/result` 페이지에서 import된 상태)이나 임시 스크립트로 (a) 손상된 JSON → 빈 저장소, (b) 같은 URI 두 번째 `setFeedback` → `false`이고 값 유지, (c) `pinned: true`가 있던 항목에 피드백 저장 후 `pinned` 유지, (d) liked 3·disliked 1 → `{liked: 3, total: 4}`를 확인하면 완료

## 2. 피드백 UI (`moodtune/components/SatisfactionFeedback.tsx`, `moodtune/app/result/page.tsx`)

- [x] 2.1 `"use client"` 컴포넌트 `SatisfactionFeedback({ uri })`를 만든다. 상태 `loading → ask | done`, 마운트 시 저장된 응답 확인, 버튼 클릭 시 저장 결과와 관계없이 감사 문구로 전환, 저장 실패 시 `console.warn`, 문구·`aria-label`·`aria-live`는 Decision 3을 따른다. 응답 직후 `[MoodTune] 만족도 {liked}/{total} ({pct}%)`를 `console.info`로 출력한다(Decision 4). 서버로 요청을 보내지 않는다. `pnpm build` 통과로 확인
- [x] 2.2 `app/result/page.tsx`에서 `isSignalUri(uri)`일 때만 컴포넌트를 Tune Again? 버튼 아래, 기존 레이아웃 흐름에 맞춰 배치한다(정확한 위치는 추후 Figma 디자인 반영 시 확정). 기존 요소의 좌표·동작은 바꾸지 않는다. 393px 폭에서 가로 스크롤이 생기지 않고 장식 스티커가 버튼을 가리지 않는지 화면으로 확인하면 완료

## 3. 문서 갱신

- [x] 3.1 `planning/md-design/04_TECHNICAL_DESIGN.md` §6 Storage를 "개인 신호(`moodtune:signals`)에 한해 localStorage 사용"으로 바꾸고 2026-09-28 결정을 근거로 적는다. §5의 브라우저 저장소 언급은 "결과 전달에는 쓰지 않는다"로 범위를 명확히 한다(Decision 5). 두 절 사이에 모순되는 문장이 없으면 완료
- [x] 3.2 `docs/DESIGN.md`의 Result 화면 설명에 만족도 피드백 영역(질문, 좋아요/별로예요, 감사 문구)을 한 줄 추가한다

## 4. 통합 검증 (verify 스킬, 실제 OAuth 없이 `/result`에 쿼리 파라미터로 직접 진입)

- [x] 4.1 `pnpm lint`와 `pnpm build`가 모두 통과한다
- [x] 4.2 `/result?uri=spotify:track:abc&name=Test&artist=A`로 진입해 다음을 확인한다: (a) 질문과 두 버튼이 보이고, 응답 전에도 Listen in Spotify!가 `open.spotify.com/track/abc`를 새 탭으로 열고 Tune Again?이 `/input`으로 이동한다. (b) "좋아요"를 누르면 감사 문구로 바뀌고 `localStorage["moodtune:signals"]`의 `items["spotify:track:abc"].feedback`이 `liked`다. (c) 새로고침 후에도 감사 문구가 보이고 값이 바뀌지 않는다. (d) 응답 시 네트워크 탭에 새 요청이 없다. (e) 콘솔에 만족도 로그가 출력되고, URI를 바꿔 "별로예요"로 한 번 더 응답하면 `1/2 (50%)`가 된다
- [x] 4.3 예외 경로를 확인한다: (a) `uri=not-a-uri`로 진입하면 질문이 보이지 않고 나머지 화면은 그대로다. (b) `moodtune:signals`에 손상된 문자열을 넣고 새로고침하면 질문이 보이고 에러가 없다. (c) DevTools에서 사이트 데이터 저장을 차단한 상태로 응답하면 감사 문구가 보이고 화면이 깨지지 않는다
- [x] 4.4 `/api/recommend` 코드와 요청 body에 피드백 관련 변경이 없음을 `git diff moodtune/app/api moodtune/lib/openai.ts moodtune/lib/spotify.ts`가 비어 있는 것으로 확인한다(spec: Feedback Does Not Affect Recommendations)
