---
name: verify
description: How to actually run and drive the moodtune Next.js app for runtime verification (no real Spotify OAuth available in this environment)
---

# Verifying moodtune at runtime

## Boot

```bash
cd moodtune
pnpm dev > /tmp/dev.log 2>&1 &     # Turbopack, ready in ~0.4s
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/input
```

Kill cleanly before re-running: `pkill -f "next dev"; lsof -ti:3000,3001 | xargs -r kill`.

## The blocker: no real Spotify login here

There is no interactive browser in this environment (`claude-in-chrome`
extension is never connected), so the real Spotify OAuth flow can't be
driven. Every route past `/input` needs a session cookie
(`lib/session.ts` → `readSession()`) and real library data
(`lib/spotify.ts` → `fetchLibrary()`).

**Pattern that works**: temporarily stub *only* those two functions,
gated behind `MOODTUNE_E2E_TEST=1`, so the rest of the real code
(recommend logic, retry/fallback, UI wiring, Result rendering) runs
unmodified and for-real:

```ts
// lib/session.ts, inside readSession(), before the real cookie read:
if (process.env.MOODTUNE_E2E_TEST === "1") {
  return { accessToken: "TEST_TOKEN", refreshToken: "x", expiresAt: Date.now() + 3_600_000 };
}
```

```ts
// lib/spotify.ts, inside fetchLibrary(token), before the real API calls:
if (token === "TEST_TOKEN") {
  return { user: {...}, tracks: [/* 2-3 fake LibraryTrack with real picsum.photos album art URLs */], likedCount: N, playlists: [] };
}
```

Run with `MOODTUNE_E2E_TEST=1 pnpm dev`. **Always revert both edits
immediately after** and confirm with `git diff lib/session.ts
lib/spotify.ts` (must be empty) — never leave this in.

OpenAI (`lib/openai.ts`) and OpenWeather (`/api/weather`) are real
external services with working API keys in `.env.local` — call them
for real, don't stub them. `/api/weather?city=Seoul,KR` returns real
weather with no auth needed.

## Driving the UI without an interactive browser

Headless Chrome screenshots work but can't type/click. For end-to-end
UI flows (mood/situation select → submit → LoadingPopup → navigate →
Result), add a temporary `useEffect` in the page under test that
calls the same setters/handlers a real click would, then screenshot
at increasing `--virtual-time-budget` values to watch state progress:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --incognito --screenshot=out.png \
  --window-size=500,900 --hide-scrollbars --virtual-time-budget=5500 \
  "http://localhost:3000/input"
```

Note the real viewport this Chrome build renders at is ~500px wide
regardless of `--window-size`'s width for small values — crop the
screenshot to the centered 393px mobile frame:
`im.crop((int((W-393)/2), 0, ...))`.

Revert the temporary auto-trigger effect (and any temp `id=` added
for `document.getElementById(...).click()`) right after capturing
evidence.

## Gotcha found during verification

`WeatherBadge` always runs its own real `geolocation` check on mount
and calls `onChange(null)` when it fails (expected in headless — no
geolocation permission). If a test harness pre-seeds a fake
`weather` value on the parent page before mount, WeatherBadge's own
effect will race it and overwrite it back to `null` shortly after.
This is correct product behavior (NFR-2 graceful degradation), not a
bug — but it means you can't get a "weather succeeded" state through
literal UI simulation here. Verify that path directly against
`/api/recommend` / `/result` with a manually-constructed weather
value instead, and treat the UI-driven run as covering the
"weather unavailable" path.

## Quick endpoint probes (no browser needed)

```bash
# auth gate (real, no stub)
curl -s -X POST localhost:3000/api/recommend -d '{"mood":"Calm"}' -w '\n%{http_code}\n'   # -> 401

# with MOODTUNE_E2E_TEST=1 stub active:
curl -s -X POST localhost:3000/api/recommend -H 'Content-Type: application/json' \
  -d '{"mood":"Depressed","situation":"🚙 Driving","weather":{"condition":"...","temperatureC":26,"city":"Seoul","icon":"02d"}}'

curl -s -X POST localhost:3000/api/recommend -d '{}' -w '\n%{http_code}\n'                 # -> 400 bad_request
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' localhost:3000/result             # -> 307 to /input
```

To force the retry/fallback branch deterministically (not relying on
LLM randomness), add a similar `MOODTUNE_E2E_TEST` + a second env var
(e.g. `MOODTUNE_TEST_FORCE_MISMATCH=once|always`) short-circuit at the
top of `callOpenAI()` in `lib/openai.ts` returning an out-of-library
`uri` — `once` proves exactly-one-retry-then-success, `always` proves
the deterministic fallback (`librarySample[0]`, generic reason,
`isFallback:true`). Same revert-and-confirm discipline applies.
