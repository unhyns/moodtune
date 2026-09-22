# MoodTune (무드튠)

내 Spotify 라이브러리 안에서, 지금 기분·날씨·상황에 맞는 곡을 빠르게 골라주는 선곡 파트너.

## 주요 기능

### 구현됨
- **Spotify 계정 연동**: OAuth 로그인으로 내 계정 인증
- **실제 라이브러리 조회**: Liked Songs 및 내가 만든 플레이리스트 불러오기
- **날씨 반영**: 위치 기반 자동 감지 + 수동 입력 지원

### 아직 구현 안 됨 (다음 세션 구현 예정)
- **AI 맞춤 추천**: 기분·날씨·상황을 종합한 곡/플레이리스트 추천
- **실제 재생 링크**: 추천 결과에서 Spotify로 바로 이동해 재생

## 기술 스택
- Next.js
- React
- TypeScript
- Tailwind CSS
- Claude Code
- GitHub
- Spotify Web API
- Weather API (OpenWeather)
- OpenAI API (gpt-4o-mini)

## 로컬 실행 방법

1. `.env.local` 파일을 만들고 아래 환경변수를 채워주세요 (값 예시는 별도 문의).

```
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REDIRECT_URI
OPENWEATHER_API_KEY
OPENAI_API_KEY
SESSION_SECRET
```

2. 의존성 설치 및 개발 서버 실행

```bash
pnpm install
pnpm dev
```

3. [http://localhost:3000](http://localhost:3000) 에서 확인

## 배포 URL
https://moodtune-moodtune.vercel.app/

## 현재 제외 범위
- 결제 기능
- 복잡한 인증(소셜 로그인 등 확장 인증)
- 실시간 협업 기능
- 대용량 파일 업로드
- Spotify, 날씨, OpenAI 외 추가 외부 API 연동 (사전 승인 없이는 추가하지 않음)
