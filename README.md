# MoodTune

지금 기분·상황·날씨를 고르면, 내 Spotify 라이브러리에서 딱 맞는 곡을 골라주는 외출 전 30초 음악 결정 서비스

**배포 URL**: moodtune-moodtune.vercel.app

> Spotify 개발 모드 앱이라, Spotify 대시보드에 사용자로 등록된 계정만 로그인할 수 있어요. 체험을 원하시면 계정 등록을 요청해 주세요.

## 이런 서비스예요

스트리밍 서비스에 곡은 넘치는데, 정작 "지금 뭐 듣지?"를 고르는 데는 매번 시간이 듭니다. MoodTune은 새로운 곡을 발굴해주는 대신, **내가 이미 좋아한 곡 안에서** 지금 기분과 상황에 어울리는 한 곡을 골라줍니다.

1. Spotify로 로그인
2. 기분과 상황을 선택 (하나만 골라도 OK), 날씨는 위치 기반으로 자동 반영
3. 레트로 iPod 화면에 추천곡과 추천 이유가 표시됨
4. "Listen in Spotify!"로 바로 재생

## 구현된 기능

- **Spotify 로그인**: 읽기 전용 권한(`user-library-read`, `playlist-read-private`)만 요청하고, 토큰은 암호화한 http-only 쿠키에 저장합니다.
- **라이브러리 조회**: 좋아요한 곡과 내가 만든 플레이리스트를 불러옵니다. 추천 후보는 최근 좋아요한 곡 최대 50곡이에요.
- **날씨 자동 반영**: 위치 권한을 허용하면 현재 날씨가 표시되고, 거부하거나 실패하면 도시를 직접 입력할 수 있어요.
- **기분·상황 선택**: 버튼으로 선택하며, 하나만 골라도 추천받을 수 있어요.
- **AI 추천**: OpenAI(gpt-4o-mini)가 기분·상황·날씨·내 곡 목록을 보고 한 곡과 추천 이유를 골라줍니다. 라이브러리에 없는 곡이 나오면 1회 재시도하고, 그래도 안 맞으면 후보 곡으로 대체해서 항상 결과가 나오게 했어요.
- **결과 화면**: 앨범 커버 색에 맞춰 화면 색이 바뀌는 iPod 플레이어 UI로 곡, 추천 이유, 선택한 날씨·기분·상황을 보여주고, 입력 화면으로 돌아가는 링크가 있어요.
- **디자인**: 핑크 톤 레트로(Y2K) 무드, 계속 도는 LP판(동작 줄이기 설정 시 정지), 실시간 시계

## 알려진 한계와 다음 계획

- 도시 수동 입력은 영문 지명이 가장 잘 됩니다. 한글 지명(예: "서울")은 날씨 API(OpenWeather)가 인식하지 못하는 경우가 많아요.
- "다시 추천받기"(FR-10)는 의도적으로 다음 단계로 미뤘어요.
- 자연어 입력, 플레이리스트 추천, 추천 히스토리(DB 필요)는 아직 구현하지 않았어요.
- 자동화 테스트(Playwright 등)는 아직 없고, 직접 실행해서 확인했어요.

## 기술 스택

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, pnpm
- Spotify Web API, OpenWeather API, OpenAI API (gpt-4o-mini)
- 배포: Vercel
- 개발 방식: Claude Code + OpenSpec 기반 바이브코딩

## 로컬 실행

앱은 저장소의 `moodtune/` 폴더 안에 있어요.

```bash
git clone https://github.com/unhyns/moodtune.git
cd moodtune/moodtune
pnpm install
cp .env.example .env.local
pnpm dev
```

`.env.local`에 아래 값을 채워주세요. 값은 절대 커밋하지 마세요.

| 변수 | 설명 |
|---|---|
| `SPOTIFY_CLIENT_ID` | Spotify Developer Dashboard의 Client ID |
| `SPOTIFY_CLIENT_SECRET` | 같은 곳의 Client Secret |
| `SPOTIFY_REDIRECT_URI` | 로컬은 `http://127.0.0.1:3000/api/auth/spotify/callback` |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API 키 |
| `OPENAI_API_KEY` | OpenAI API 키 |
| `SESSION_SECRET` | 쿠키 암호화용 임의 문자열 (`openssl rand -base64 32`) |

**주의**: 접속은 `localhost`가 아니라 **`http://127.0.0.1:3000`** 으로 하세요. Spotify Redirect URI와 호스트가 다르면 로그인 쿠키가 붙지 않아요. Redirect URI는 Spotify 대시보드에 등록한 값과 글자 하나까지 같아야 합니다.

## 문서 구조

| 위치 | 내용 |
|---|---|
| `CLAUDE.md`, `docs/` | 프로젝트 규칙, 디자인, 아키텍처, PRD |
| `planning/md-design/` | 제품 정의, 요구사항, UX/UI, 기술 설계, 일정 |
| `openspec/` | 구현 단위 명세 (proposal / design / specs / tasks) |
| `moodtune/docs/REFACTORING_PLAN.md` | 리팩토링 계획 |
