# CLAUDE.md

## Project
Micro SaaS MVP project for a Vibe Coding class.

## Product Idea
This app helps users who want to quickly decide what to listen to before heading out solve the daily "what should I listen to right now" decision fatigue by recommending tracks from their own Spotify library based on mood, weather, and situation. Guest mode lets people without an allow-listed Spotify account try it with a prebuilt static catalog.

## Tech Stack
-Next.js
-React
-TypeScript
-Tailwind CSS
-Claude Code
-GitHub
-Spotify Web API
-Weather API (OpenWeather)
-OpenAI API (gpt-4o-mini)
-Last.fm, MusicBrainz (guest catalog build scripts only, never at runtime)

## Current Stage
MVP 구현 완료(로그인 모드, 자유 입력, 날씨·계절 힌트, 후보 섞기, 게스트 모드). 문서 정리와 배포 점검 단계

## Working Rules
-Read relevant files before suggesting changes.
-Explain the plan before editing files.
-Keep changes small.
-Do not add unnecessary dependencies.
-Update docs when project direction changes.
-Summarize changed files before commit.

## Boundaries
Do not add:
-payment
-complex authentication
-real-time collaboration
-large file upload
-external API integrations beyond Spotify, weather, and OpenAI — no additional third-party services without explicit approval (approved exception: Last.fm and MusicBrainz in `moodtune/scripts/` only; the running app must not call them, and Last.fm ranks, play counts, and tag lists must not be stored)

## References
-Follow docs/DESIGN.md for UI direction.
-Follow docs/ARCHITECTURE.md for project structure.