## 1. Storage Setup

- [ ] 1.1 Provision a hosted Postgres database (e.g., Vercel Postgres) and add its connection string as an environment variable, and verify the app can connect to it
- [ ] 1.2 Create the `history_entries` table (owner Spotify user ID, track, mood, situation, weather, created_at, status) and verify the migration runs without error

## 2. History Creation (depends on add-moodtune-mvp's /api/recommend)

- [ ] 2.1 Store the Spotify user ID in the session cookie at login time for use as the history owner key (extends `add-moodtune-mvp`'s `spotify-auth`), and verify the ID is present after login
- [ ] 2.2 Add a history-entry-creation call triggered on successful recommendation generation from `add-moodtune-mvp`'s `/api/recommend` — **prerequisite: that endpoint must exist first** — and verify a generated recommendation results in a new row with status `recorded`

## 3. History List & Retrieval

- [ ] 3.1 Implement `GET /api/history` to return the current user's history entries ordered most-recent-first, and verify the order with a multi-entry test
- [ ] 3.2 Build the `/history` screen to render the list, and verify an empty history shows the "no history yet" message

## 4. Status Change

- [ ] 4.1 Implement `PATCH /api/history/:id` to update a history entry's status to played, saved, or dismissed, and verify only entries owned by the requesting user can be updated
- [ ] 4.2 Add status-change controls to the `/history` screen, and verify selecting a new status updates the entry in the list without a full page reload

## 5. Filtering

- [ ] 5.1 Add `mood` and date-range query parameters to `GET /api/history`, and verify filtered requests return only matching entries
- [ ] 5.2 Add mood and date-range filter controls to the `/history` screen, and verify clearing filters restores the full unfiltered list
