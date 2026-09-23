# DESIGN.md

## Design Goal
레트로 Y2K 무드보드 감성의 플레이풀한 웹 앱. 카세트테이프·워크맨·게임보이·CD 같은 2000년대 아날로그 음악 기기 오브젝트를 스티커처럼 기울여 붙이고, 진한 핑크 배경과 손그림 느낌의 별로 채운 화면 위에서, 학생이 짧은 시간 안에 재미있게 훑어보며 오늘 들을 곡을 고르는 경험을 제공한다.

## Visual Tone
- **Retro / Y2K 콜라주**: 카세트테이프·워크맨·게임보이·CD·플립폰 스티커를 살짝 회전시켜 배경에 겹쳐 배치 (`app/input/page.tsx`, `public/input/*.png`)
- **Playful, 스티커 태그 스타일**: 카드보다는 "종이에 붙인 라벨" 느낌 — 흰 배경(`bg-white`) + 얇은 테두리(`border`)로 된 사각 태그가 기본 단위이며, 기분/상황 선택지마다 고유한 테두리색·글자색을 가진다 (예: Excited `border #e4de3c` / `text #ec6f21`, Calm `#9ee462`/`#73c22d`, Depressed `#1d4aab`/`#0a46c7`, Romantic `#da24bf`/`#c70aab`, Focusing `#17bc98`/`#0ac79e`; 상황 태그는 이모지 + 영문 라벨과 함께 `#8d29f2`, `#40a00d`, `#b15d20`, `#df0f12`, `#00b4ff` 계열). 태그는 모서리가 각진 사각형이며, CTA 버튼만 별도로 둥글거나(Landing의 Spotify 버튼) 각진(Input의 "Tune Mine!") 형태를 쓴다 — 버튼 모양이 화면마다 통일되어 있지는 않다.
- **큰 반투명 글래스 타이포**: Input 화면 상단의 실시간 시계는 화면 폭을 거의 채우는 크기로, `text-white/35` 반투명 색과 세로로 늘린(`scale-y`) 형태를 사용해 뒤에 있는 장식 이미지가 비쳐 보이는 "liquid glass" 느낌을 낸다 (`components/LiveClock.tsx`).
- **화면별 배경색 분리**: Landing은 밝은 오프화이트 `#fafafa` + 포인트 핑크(로고 점·별 `#E43C98`, 구분선 `rgba(228,60,152,0.2)`), Input은 진한 핑크 `#ea7eb9` 풀블리드 배경. 공통 포인트 컬러로 핫핑크 `#F91E96`/`#f91e96`이 CTA·강조 테두리에 쓰인다.
- **폰트**: 본문·라벨·버튼은 전부 `Helvetica`(Bold 위주, 서브텍스트만 Regular), Input 화면의 시계 숫자·날짜만 Google Font `Jockey One`을 쓴다. 레이아웃 기본 폰트로 잡혀 있던 Geist Sans/Mono(`app/layout.tsx`)는 두 화면 모두에서 Helvetica로 덮어써져 실제로는 쓰이지 않는다.
- **다크모드 미지원**: `app/globals.css`에 `prefers-color-scheme: dark` 토큰이 남아 있지만, Landing/Input은 배경·텍스트 색을 전부 하드코딩(`bg-[#fafafa]`, `bg-[#ea7eb9]` 등)해 다크모드가 적용되지 않는다.
- **Result 화면은 톤이 아직 안 맞음**: 위 스타일이 적용되지 않은 예전 상태(흰 `rounded-2xl` 카드, `zinc`/검정 톤, `dark:` 클래스 포함)로 남아 있어 별도 리디자인이 필요하다.

## Main Screens
- **Landing Page**: 로고 + 핑크 구분선 헤더, 큰 헤드라인("Music Does Matter."), 계속 회전하는 LP판(CSS 애니메이션, `prefers-reduced-motion` 대응), Spotify 연동 CTA(초록 `#1ed760` 알약 버튼). 에러 메시지는 CTA 버튼 바로 위에 표시.
- **Mood & Context Input Page**: 핑크 배경 위에 실시간 글래스 시계, Y2K 장식 스티커, 날씨 상태 박스(위치 실패 시 빨간 테두리 + 수동 입력창, 성공 시 핑크 테두리 + 이모지 아이콘 + 기온), 기분/상황 색상별 태그(하나 선택 시 나머지는 회색 `#AFAFAF`로 비활성 처리), "Tune Mine!" 제출 버튼(핫핑크 `#f91e96`).
- **Recommendation Result Page**: *(미리디자인 상태)* 흰 카드 + 앨범아트 + 곡명/아티스트 + 추천 이유 + 검정 알약 모양 "Spotify에서 재생하기" 버튼.

## UI Rules
- Use clear button text (아이콘/이모지는 텍스트를 보완할 뿐, 아이콘 단독 버튼은 없음).
- Use labels for inputs (도시 입력창 등 `aria-label` 유지).
- Use semantic headings (각 화면 h1 1개 + 섹션 h2 구조 유지, Input의 시각적 타이틀 태그도 실제로는 `<h2>`).
- Avoid icon-only actions.
- 장식용 이미지(별, 카세트, 워크맨 등)는 전부 `aria-hidden` + `pointer-events-none` — 클릭/포커스 불가능해야 한다.
- Avoid random design changes — 화면별 색상·좌표는 Figma에서 읽은 실제 값을 그대로 따른다.
