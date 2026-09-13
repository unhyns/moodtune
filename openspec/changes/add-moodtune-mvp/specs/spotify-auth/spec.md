## Purpose

Authenticates the user against Spotify via OAuth so the app can access the user's saved tracks and playlists on their behalf, using only the minimum access needed.

## ADDED Requirements

### Requirement: Spotify OAuth Login
The system SHALL allow a user to authenticate via Spotify OAuth (Authorization Code Flow) to grant the app read-only access to their library.

#### Scenario: Successful login
- **WHEN** a user starts Spotify login from the Landing page and approves the OAuth consent screen
- **THEN** the system SHALL issue an access token and advance the user to the mood/context input step

#### Scenario: Login denied or failed
- **WHEN** the user denies consent or the OAuth flow fails
- **THEN** the Landing page SHALL show an error state with a retry action

### Requirement: Minimal OAuth Scope
The system SHALL request only the read-only Spotify scopes needed to read saved tracks and playlists, and SHALL NOT request write or modify scopes.

#### Scenario: Scope request
- **WHEN** the system initiates the Spotify OAuth authorization request
- **THEN** the requested scopes SHALL be limited to read-only library access

### Requirement: Session Expiry Handling
The system SHALL detect an expired or invalid Spotify session and prompt the user to re-authenticate.

#### Scenario: Expired token
- **WHEN** a call to the Spotify API fails because the access token is expired or invalid
- **THEN** the system SHALL redirect the user to the Landing page to re-authenticate
