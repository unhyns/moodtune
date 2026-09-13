## Purpose

Generates a single personalized track recommendation from the user's own library by combining mood, situation, and weather, and guarantees the result is always a track that genuinely exists in that library.

## ADDED Requirements

### Requirement: AI-Based Recommendation Generation
The system SHALL generate a track recommendation by combining the user's mood, situation, weather (when available), and their retrieved Spotify library.

#### Scenario: Recommendation succeeds
- **WHEN** the user submits a valid mood and situation selection
- **THEN** the system SHALL display exactly one recommended track with title, artist, album art, and a short reason

### Requirement: Recommendation Must Be a Real Library Track
The system SHALL ensure the recommended track always exists in the user's retrieved library, retrying or falling back when the AI's response does not.

#### Scenario: AI response matches library
- **WHEN** the AI's returned track matches a track in the retrieved library sample by URI or ID
- **THEN** the system SHALL present that track and its reason to the user

#### Scenario: AI response does not match library, retry succeeds
- **WHEN** the AI's returned track does not match any track in the retrieved library sample
- **THEN** the system SHALL retry the request once with an explicit instruction to select only from the provided list

#### Scenario: AI response still does not match after retry
- **WHEN** the retried AI response still does not match the retrieved library sample
- **THEN** the system SHALL select a deterministic fallback track from the library sample and present a generic reason, without indicating to the user that a fallback occurred
