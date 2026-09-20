# ARCHITECTURE.md

## Service Structure
User → Landing Page (Spotify 연동) → Mood & Context Input → AI Recommendation (OpenAI gpt-4o-mini + Spotify/Weather 데이터) → Result Page → Spotify로 이동

## Planned Routes
-`/`: Landing page (Spotify login)
-`/input`: Mood & context input page
-`/result`: Recommendation result page

## Source Structure
-`src/`: application source code
-`src/app/api/`: API route handlers for Spotify, weather, and OpenAI integrations
-`docs/`: project documents
-`tests/`: test code