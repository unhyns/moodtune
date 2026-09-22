## 1. Setup & Environment

- [x] 1.1 Add environment variables (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`, `OPENWEATHER_API_KEY`, `OPENAI_API_KEY`) and verify the app reads them without throwing at startup
- [x] 1.2 Register a Spotify Developer app and configure the redirect URI, and verify the OAuth authorize URL loads without a `redirect_uri_mismatch` error
- [x] 1.3 Define shared types (`SpotifySession`, `LibraryTrack`, `WeatherContext`, `UserContext`, `RecommendationRequest`, `RecommendationResult`) and verify the project type-checks with no errors

## 2. Spotify Auth (spotify-auth)

- [x] 2.1 Implement `/api/auth/spotify/login` to redirect to Spotify's authorize endpoint with read-only scopes only, and verify the requested scope list contains no write/modify scopes
- [x] 2.2 Implement `/api/auth/spotify/callback` to exchange the auth code for tokens and store them in an encrypted, signed http-only cookie (design.md Decision 1), and verify a successful login sets the cookie and advances to the input step
- [x] 2.3 Show an error state with a retry action on the Landing page when login is denied or fails, and verify denying consent triggers that state
- [x] 2.4 Detect an expired/invalid token on an API call and redirect to Landing to re-authenticate, and verify a simulated expired token redirects correctly

## 3. Library Retrieval (spotify-library)

- [x] 3.1 Implement `/api/spotify/library` to fetch saved tracks and the user's own playlists (excluding followed playlists) using the session cookie, and verify it returns at least one track for a seeded test account
- [x] 3.2 Show a dedicated empty-library message instead of attempting a recommendation when the library is empty, and verify an account with no saved tracks sees that message

## 4. Weather Context (weather-context)

- [x] 4.1 Request browser geolocation permission on the input step and call `/api/weather` with the coordinates, and verify the weather badge shows condition and temperature when permission is granted
- [x] 4.2 Continue the recommendation flow without weather context when retrieval fails or permission is denied, and verify a recommendation still succeeds in that case
- [x] 4.3 Show a manual city input field when geolocation permission is denied or retrieval fails, and call `/api/weather` with the entered city name (FR-11), and verify submitting a city updates the weather badge with condition and temperature

## 5. Mood & Situation Input (mood-context-input)

- [ ] 5.1 Add the confirmed mood options (신남/차분함/우울함/집중/설렘) and situation options (출근길/산책/카페/운동/드라이브) as constant arrays (design.md Decision 3) and render them as `QuickReplyChip` groups
- [ ] 5.2 Implement single-select toggle behavior within each group, and verify selecting a new option deselects the previously selected one in the same group
- [ ] 5.3 Disable the recommendation request action until both a mood and a situation are selected, and verify the button's enabled/disabled state toggles correctly

## 6. AI Recommendation (ai-recommendation)

- [ ] 6.1 Build `librarySample` from the user's most recently liked tracks, capped at 50 (design.md Decision 2), and verify the sample size never exceeds 50
- [ ] 6.2 Implement `/api/recommend` to call OpenAI with mood, situation, weather (when available), and the library sample, and verify a valid request returns exactly one track with a reason
- [ ] 6.3 Validate the returned track against `librarySample` by URI/ID and retry once with an explicit "select only from this list" instruction on mismatch, and verify a mismatched first response triggers exactly one retry
- [ ] 6.4 On a second mismatch, select a deterministic fallback track from `librarySample` with a generic reason and `isFallback: true`, and verify the client renders identically regardless of `isFallback`
- [ ] 6.5 Pass the result to `/result` via URL query parameters (`uri`, `name`, `artist`, `art`, `reason`) (design.md Decision 4), and verify `/result` renders correctly from a directly-constructed URL
- [ ] 6.6 Redirect to `/input` when required query parameters (`uri`, `name`) are missing on `/result`, and verify visiting `/result` with no parameters redirects

## 7. Spotify Playback Redirect (spotify-playback-redirect)

- [ ] 7.1 Replace the placeholder Spotify link with the real track URI/web URL on the recommendation card, and verify tapping it opens the correct Spotify track in a new tab or app deep link
