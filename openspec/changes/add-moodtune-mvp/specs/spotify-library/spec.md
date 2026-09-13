## Purpose

Retrieves the authenticated user's saved tracks and playlists from Spotify so that recommendations can be drawn from the user's own real library rather than generic catalog data.

## ADDED Requirements

### Requirement: User Library Retrieval
The system SHALL retrieve the authenticated user's saved tracks (Liked Songs) and playlists from Spotify.

#### Scenario: Library retrieval succeeds
- **WHEN** library retrieval runs for an authenticated user who has at least one saved track or playlist
- **THEN** the system SHALL return at least one track

#### Scenario: Empty library
- **WHEN** the authenticated user's library contains no saved tracks or playlists
- **THEN** the system SHALL show a dedicated empty-library message instead of attempting a recommendation
