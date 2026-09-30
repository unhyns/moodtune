## MODIFIED Requirements

### Requirement: AI-Based Recommendation Generation
The system SHALL generate a track recommendation by combining the user's mood, situation, weather (when available), and their retrieved Spotify library. For a non-fallback recommendation, the reason SHALL be written in Korean and SHALL be one or two sentences long.

#### Scenario: Recommendation succeeds
- **WHEN** the user submits a valid mood and situation selection
- **THEN** the system SHALL display exactly one recommended track with title, artist, album art, and a short reason

#### Scenario: Reason format
- **WHEN** a non-fallback recommendation is returned
- **THEN** its reason SHALL be Korean text of one or two sentences

## ADDED Requirements

### Requirement: Reason References Provided Input
For a non-fallback recommendation, the reason SHALL explicitly reference at least one of the input values the user actually provided among mood, situation, and weather. Input values that were not provided (for example, weather when it could not be retrieved) SHALL NOT be referenced as if they were known.

#### Scenario: Mood and weather provided
- **WHEN** the user submits mood "Calm" with no situation, and weather is available as clear, 18°C
- **THEN** the reason SHALL mention the calm mood, the weather, or both

#### Scenario: Only situation provided, no weather
- **WHEN** the user submits situation "Driving" with no mood, and weather could not be retrieved
- **THEN** the reason SHALL mention the driving situation
- **AND** the reason SHALL NOT describe any weather condition

### Requirement: No Unfounded Claims About the Track
The reason SHALL NOT describe the track itself, including its sound, genre, tempo, instrumentation, lyrics, mood, atmosphere, or any impression of it, and SHALL NOT link the track to the user's input with expressions such as "fits" or "is good for". The reason MAY name the track title or artist. The reason SHALL be grounded only in the user's input and, when available, the track's source playlist.

#### Scenario: Unfamiliar track
- **WHEN** the recommended track is one whose sound or lyrics cannot be reliably known from its title and artist
- **THEN** the reason SHALL NOT claim what the track sounds like or what its lyrics are about
- **AND** the reason SHALL justify the pick using the user's input or source playlist instead

#### Scenario: Well-known characteristic
- **WHEN** a characteristic of the track, such as its genre or tempo, is reliably known from its title and artist
- **THEN** the reason SHALL NOT mention that characteristic

#### Scenario: Linking the track to input
- **WHEN** the reason is generated for any input
- **THEN** the reason SHALL NOT state that the track fits or suits the user's mood, situation, or weather

### Requirement: Source Playlist as Grounding
The system SHALL retain, for each track retrieved from the user's library, the names of the user's own playlists that contain it, including tracks that are also in Liked Songs. For a non-fallback recommendation whose track has one or more source playlists, the system SHALL include the name of one of those playlists in the reason as grounding; a very long name MAY be shortened to a bounded length. When the track has no source playlist (Liked Songs only), recommendation and reason generation SHALL work normally without it, and the reason SHALL NOT mention any playlist.

#### Scenario: Track found in a user playlist
- **WHEN** the recommended track is in Liked Songs and also in the user's own playlist named "출근길"
- **THEN** the returned reason SHALL state that the track is in the "출근길" playlist

#### Scenario: Liked-only track
- **WHEN** the recommended track appears only in Liked Songs and in none of the user's own playlists
- **THEN** a recommendation with a reason SHALL still be returned
- **AND** the reason SHALL NOT name or imply any playlist

#### Scenario: Followed playlists are not sources
- **WHEN** a track appears only in a playlist the user follows but did not create
- **THEN** that playlist SHALL NOT be treated as a source for the track

### Requirement: Unchanged Response Shape and Fallback Behavior
Retaining source playlists and changing reason content SHALL NOT change the shape of any API response, and SHALL NOT change the existing retry and deterministic fallback behavior, including the generic reason used on fallback.

#### Scenario: Library response unchanged
- **WHEN** the client requests the user's library
- **THEN** the response SHALL contain the same fields as before this change and SHALL NOT include source playlist data per track

#### Scenario: Recommendation response unchanged
- **WHEN** a recommendation is returned
- **THEN** the response SHALL contain the same fields as before this change and SHALL NOT include source playlist data

#### Scenario: Fallback reason unchanged
- **WHEN** the AI's pick still does not match the library after one retry
- **THEN** the system SHALL use the deterministic fallback track with the same generic reason as before, and the rules above for input references and playlist grounding SHALL NOT apply to it
