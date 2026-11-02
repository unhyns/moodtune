# MoodTune

지금 기분·상황·날씨를 고르면 어울리는 곡을 한 곡 골라주는 외출 전 30초 음악 결정 서비스. Spotify로 로그인하면 내 라이브러리에서, 로그인 없이는 게스트 모드의 샘플 곡 목록에서 골라 줍니다.

**배포 URL**: moodtune-moodtune.vercel.app

## 이런 서비스예요

스트리밍 서비스에 곡은 넘치는데, 정작 "지금 뭐 듣지?"를 고르는 데는 매번 시간이 듭니다. MoodTune은 지금 기분과 상황에 어울리는 한 곡을 빠르게 골라 줍니다.

- **로그인 모드**: 새로운 곡을 발굴해주는 대신, **내가 이미 좋아한 곡 안에서** 골라 줍니다.
- **게스트 모드**: 로그인 없이 국가와 장르를 고르면, 미리 만들어 둔 샘플 곡 목록에서 골라 줍니다.

1. Spotify로 로그인하거나, "Go to Guest mode"에서 국가와 장르를 선택
2. 기분과 상황을 선택 (하나만 골라도 OK), 날씨는 위치 기반으로 자동 반영
3. 레트로 iPod 화면에 추천곡과 추천 이유가 표시됨
4. "Listen in Spotify!"로 바로 재생

## 체험 방법

- **게스트 모드 (누구나)**: 첫 화면에서 "Go to Guest mode"를 누르고, 국가 1개와 장르 1~3개를 고르면 됩니다. 로그인이 필요 없고, Spotify 계정 정보를 읽지 않습니다.
- **로그인 모드 (등록된 계정만)**: 이 앱은 Spotify 개발 모드로 운영되어, Spotify 대시보드에 등록된 **최대 5명의 계정만** 로그인할 수 있습니다. 등록되지 않은 계정이라면 게스트 모드로 체험해 주세요.

## 구현된 기능

- **Spotify 로그인**: 읽기 전용 권한(`user-library-read`, `playlist-read-private`)만 요청하고, 토큰은 암호화한 http-only 쿠키에 저장합니다.
- **라이브러리 조회**: 좋아요한 곡과 내가 만든 플레이리스트를 불러옵니다. 추천 후보는 최근 좋아요한 곡 최대 50곡이에요.
- **날씨 자동 반영**: 위치 권한을 허용하면 현재 날씨가 표시되고, 거부하거나 실패하면 도시를 직접 입력할 수 있어요.
- **기분·상황 선택**: 버튼으로 선택하며, 하나만 골라도 추천받을 수 있어요.
- **자유 입력**: 버튼 대신 지금 상태를 최대 200자로 적어 추천받을 수 있어요 (로그인 모드).
- **날씨·계절 힌트**: 날씨와 서울 기준 계절을 AI에게 약한 힌트로 전달합니다. 후보를 거르지 않고, 기분·상황이나 입력한 글이 먼저예요.
- **후보 섞기**: 후보 곡의 순서를 요청마다 무작위로 섞어, 목록 맨 앞 곡으로 추천이 쏠리는 것을 줄입니다.
- **AI 추천**: OpenAI(gpt-4o-mini)가 기분·상황·날씨·후보 곡 목록을 보고 한 곡과 추천 이유를 골라줍니다. 후보에 없는 곡이 나오면 1회 재시도하고, 그래도 안 맞으면 후보 곡으로 대체해서 항상 결과가 나오게 했어요.
- **게스트 모드**: 로그인 없이 국가(Korea / Western / Japan / RoW)와 장르(Pop / Hip-Hop / R&B / Rock / Indie / EDM / K-POP)를 골라 샘플 곡 목록에서 추천받습니다. 조건에 맞는 곡이 15곡 미만이면 같은 국가의 다른 장르 곡을 함께 후보에 넣고, 결과 화면에 안내합니다.
- **만족도 피드백**: 결과 화면에서 "Well-Tuned!" / "Not Enough"로 응답할 수 있어요. 브라우저에만 저장됩니다.
- **결과 화면**: 앨범 커버 색에 맞춰 화면 색이 바뀌는 iPod 플레이어 UI로 곡, 추천 이유, 선택한 날씨·기분·상황을 보여주고, 입력 화면으로 돌아가는 링크가 있어요.
- **디자인**: 핑크 톤 레트로(Y2K) 무드, 계속 도는 LP판(동작 줄이기 설정 시 정지), 실시간 시계

## 알려진 한계와 다음 계획

- **날씨·계절은 약한 힌트**: 곡 선택을 바꾸지 못할 수 있어요. 버튼 입력에서는 같은 기분·상황이면 날씨가 달라도 같은 곡이 나온 경우가 있었고, 계절 힌트의 효과는 확인하지 못했습니다.
- **자유 입력의 주의점**: 입력한 글은 추천 생성을 위해 OpenAI로 전송됩니다. 개인정보는 적지 말아 주세요. 글은 곡을 고르는 데만 쓰고, 추천 이유는 정해진 문장으로 표시합니다. 게스트 모드에는 자유 입력이 없습니다.
- **게스트 곡 목록**: 샘플 646곡뿐이며 내 라이브러리와 무관합니다. 국가를 알 수 없는 34곡은 후보에서 빠집니다.
- **국가·장르 라벨**: 국가는 곡의 인기 지역이 아니라 **아티스트 출신 국가** 기준이고, 일부는 수동으로 보정했습니다. 장르는 태그 기반입니다. 체감과 다를 수 있어요.
- **게스트 호출 한도**: 브라우저당 하루 5회(성공한 요청만), 주소당 분당 3회, 전체 하루 20회입니다. 주소·전체 한도는 서버 인스턴스 메모리 기준이라 엄밀하지 않습니다.
- 도시 수동 입력은 영문 지명이 가장 잘 됩니다. 한글 지명(예: "서울")은 날씨 API(OpenWeather)가 인식하지 못하는 경우가 많아요.
- 플레이리스트 추천, 추천 히스토리(DB 필요)는 아직 구현하지 않았습니다.
- 브라우저 자동화 테스트(Playwright 등)는 아직 없습니다. 단위 테스트(`node --test lib/*.test.mjs scripts/*.test.mjs`)가 있고, 화면은 직접 실행해서 확인했습니다.

## 기술 스택

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, pnpm
- Spotify Web API, OpenWeather API, OpenAI API (gpt-4o-mini)
- Last.fm, MusicBrainz (게스트 곡 목록 빌드 스크립트 전용, 앱 실행 중에는 호출하지 않음)
- 배포: Vercel
- 개발 방식: Claude Code + OpenSpec 기반 바이브코딩

## 로컬 실행

앱은 저장소의 `moodtune/` 폴더 안에 있습니다.

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

게스트 곡 목록을 다시 만들 때만 `LASTFM_API_KEY`가 필요합니다(`moodtune/scripts/`). 앱 실행과 배포에는 필요 없습니다.

**주의**: 접속은 `localhost`가 아니라 **`http://127.0.0.1:3000`** 으로 하세요. Spotify Redirect URI와 호스트가 다르면 로그인 쿠키가 붙지 않습니다. Redirect URI는 Spotify 대시보드에 등록한 값과 글자 하나까지 같아야 합니다.

## 출처와 크레딧

- **[Last.fm](https://www.last.fm)**: 게스트 곡 목록의 곡 선정 참고. 순위·재생 수·태그 목록은 저장하지 않습니다.
- **[MusicBrainz](https://musicbrainz.org)**: 아티스트 출신 국가 정보.
- **[Spotify](https://www.spotify.com)**: 곡 정보, 앨범 아트, 재생 링크.
- 일부 이미지의 출처를 정리할 예정입니다.

## 글꼴 라이선스

| 글꼴 | 쓰는 곳 | 라이선스 |
|---|---|---|
| Pixelify Sans, Jockey One, Geist, Geist Mono | Google Fonts (`next/font/google`) | SIL Open Font License 1.1 |
| 둥근모꼴 (DungGeunMo) 1.301 서브셋 | 자유 입력 화면 (`moodtune/fonts/`) | 글꼴 파일 내부에 Public Domain으로 표기되어 있고(DungGeunMo 1.301, 제작 Kil Hyung-jin, 디자인 Kim Jung-tae·Darien Gavin Valentine), 받은 곳의 기록이 남아 있지 않아 배포처의 조건은 별도로 확인하지 못했습니다. |

## 문서 구조

| 위치 | 내용 |
|---|---|
| `CLAUDE.md`, `docs/` | 프로젝트 규칙, 디자인, 아키텍처, PRD |
| `planning/md-design/` | 제품 정의, 요구사항, UX/UI, 기술 설계, 일정 |
| `openspec/` | 구현 단위 명세 (proposal / design / specs / tasks) |
| `moodtune/docs/REFACTORING_PLAN.md` | 리팩토링 계획 |
