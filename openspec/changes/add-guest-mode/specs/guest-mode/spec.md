## Purpose

Lets people without an allow-listed Spotify account try MoodTune without signing in, by recommending one track from a prebuilt static catalog according to their mood or situation, genres, and country.

## ADDED Requirements

### Requirement: Guest Entry Without Login
The landing page SHALL show a "Go to Guest mode" button below the Spotify login button. Tapping it SHALL open a bottom sheet over the landing page without any Spotify authorization. The sheet's close button and the Escape key SHALL close it and return to the landing page with its selections cleared. Existing login behavior SHALL NOT change.

#### Scenario: Opening guest mode
- **WHEN** a visitor without a session taps "Go to Guest mode"
- **THEN** the bottom sheet SHALL open with no redirect to Spotify

#### Scenario: Closing the sheet
- **WHEN** the user closes the sheet after selecting a country and a genre
- **THEN** the landing page SHALL be shown and reopening the sheet SHALL show no selection

#### Scenario: Login still available
- **WHEN** a visitor taps the Spotify login button
- **THEN** the existing login flow SHALL run unchanged

### Requirement: Guest Catalog Selections
The bottom sheet SHALL offer country chips Korea, Western, Japan, and RoW with exactly one selectable, and genre chips Pop, Hip-Hop, R&B, Rock, Indie, EDM, Ballad, Jazz, and K-POP with one to three selectable and a count of selected genres. With three genres selected, the other genre chips SHALL be dimmed and not selectable. The "Start Guest Mode" action SHALL be enabled, in pink, only when one country and at least one genre are selected, and SHALL be gray and disabled otherwise. Chips and the close button SHALL have a touch area of at least 40 pixels in each dimension without changing their appearance. The sheet SHALL state that countries are based on the artist's country of origin in a legible size of at least 11 pixels.

#### Scenario: Fourth genre
- **WHEN** three genres are selected
- **THEN** the other genre chips SHALL be dimmed and tapping them SHALL NOT select them
- **AND** deselecting a genre SHALL make them selectable again

#### Scenario: Missing selection
- **WHEN** a country is selected but no genre is selected
- **THEN** the "Start Guest Mode" action SHALL be gray and disabled

#### Scenario: Country is single choice
- **WHEN** Korea is selected and the user taps Japan
- **THEN** only Japan SHALL be selected

### Requirement: Guest Input Page
Starting guest mode SHALL open a guest input page offering the existing mood and situation chips and weather display, with submission enabled when at least one of mood or situation is selected. The page SHALL NOT offer free text input. The page SHALL show a small summary of the selection (for example "Korea · Pop, Indie") that returns to the landing page with the sheet open so the selection can be changed. Opening the page without a valid selection SHALL redirect to the landing page.

#### Scenario: Direct visit
- **WHEN** a visitor opens the guest input page with no selection
- **THEN** they SHALL be redirected to the landing page

#### Scenario: Changing the selection
- **WHEN** the user taps the selection summary
- **THEN** the landing page SHALL open with the sheet showing the current selection

### Requirement: Guest Request Validation
The guest recommendation API SHALL NOT require a session and SHALL reject with a bad request error any request whose mood or situation is not one of the offered options, that has neither mood nor situation, whose genres are not one to three distinct offered values, whose country is not an offered value, or whose weather is malformed. It SHALL ignore any other field, including free text and any library or candidate data.

#### Scenario: Unknown mood
- **WHEN** a guest request contains a mood that is not an offered option
- **THEN** the API SHALL respond with a bad request error and SHALL NOT call the AI

#### Scenario: Too many genres
- **WHEN** a guest request contains four genres
- **THEN** the API SHALL respond with a bad request error

#### Scenario: Injected text
- **WHEN** a guest request also contains a free text or candidate list field
- **THEN** that field SHALL NOT reach the AI

### Requirement: Static Guest Catalog
Guest recommendations SHALL use a static catalog file produced once by a build script. The script SHALL gather candidates from Last.fm country charts and track tags, and SHALL keep a track only when a Spotify search with app credentials confirms a matching track. Each entry SHALL contain only the Spotify track ID, title, artist, and the genre and country labels assigned by this project. The catalog SHALL NOT contain Last.fm ranks, play counts, listener counts, or tag lists. The Last.fm API key SHALL be used only by the build script, and the running application SHALL NOT call Last.fm. Country labels SHALL represent the artist's country of origin as looked up from MusicBrainz by the build tooling, which the running application SHALL NOT call; a track whose artist has no confident match SHALL have no country label and SHALL NOT be offered as a candidate. The catalog SHALL NOT be served as a public file.

#### Scenario: Catalog fields
- **WHEN** the catalog file is inspected
- **THEN** each entry SHALL contain only the track ID, title, artist, genre labels, and country labels

#### Scenario: No Spotify match
- **WHEN** a Last.fm candidate has no confirmed matching track on Spotify
- **THEN** it SHALL NOT be included in the catalog

#### Scenario: No Last.fm at runtime
- **WHEN** a guest requests a recommendation
- **THEN** no request SHALL be made to Last.fm

### Requirement: Guest Candidate Selection
For each guest request, the system SHALL collect catalog tracks labeled with the selected country and at least one selected genre. When at least 15 such tracks exist, the candidates SHALL come only from them. When fewer than 15 exist, the system SHALL widen to other tracks of the same country, keeping all matching tracks, until 40 candidates are reached or the country's tracks run out. Candidates SHALL be chosen in an independently randomized order per request and SHALL number at most 50. The source of randomness SHALL NOT be controllable through the request.

#### Scenario: Enough matching tracks
- **WHEN** 120 catalog tracks match the selected country and genres
- **THEN** 50 of them SHALL be offered, with no track from another genre or country

#### Scenario: Moderate number of matches
- **WHEN** 20 catalog tracks match
- **THEN** exactly those 20 SHALL be offered

#### Scenario: Too few matches
- **WHEN** 8 catalog tracks match and the same country has 100 other tracks
- **THEN** the candidates SHALL include all 8 and be filled to 40 from the same country

#### Scenario: Different requests differ
- **WHEN** two requests with the same selections use different random values
- **THEN** the offered candidates MAY differ

### Requirement: Guest Recommendation Reuses Recommendation Rules
A guest recommendation SHALL use the same recommendation rules as a logged-in chip recommendation, with the guest candidates in place of the library sample: selecting only from the candidates, retry once, deterministic fallback to the first candidate, the reason rules, and the weather and season hints. Genre and country SHALL be used only to choose candidates and SHALL NOT be sent to the AI as reason input. The reason SHALL NOT mention any playlist. The response shape SHALL match the logged-in recommendation response.

#### Scenario: Recommended track is a candidate
- **WHEN** the AI returns a track that is among the candidates
- **THEN** that track and reason SHALL be returned

#### Scenario: Fallback
- **WHEN** the AI's pick is still not among the candidates after one retry
- **THEN** the first candidate SHALL be returned with the generic fallback reason

#### Scenario: No playlist grounding
- **WHEN** a guest recommendation is returned
- **THEN** the reason SHALL NOT state that the track is in any playlist

### Requirement: Album Art Looked Up at Run Time
The catalog SHALL NOT store album art. After a track is chosen, the system SHALL look up that one track's album art from Spotify with app credentials. If the lookup fails or times out, the recommendation SHALL still be returned without album art and the result page SHALL show its existing no-art state.

#### Scenario: Lookup succeeds
- **WHEN** a guest recommendation is chosen and Spotify returns the track
- **THEN** the result SHALL include that track's album art

#### Scenario: Lookup fails
- **WHEN** the album art lookup fails
- **THEN** the recommendation SHALL still be shown without album art

### Requirement: Guest Result Screen
The guest result SHALL use the existing result screen, Spotify link, and satisfaction feedback. Its link for trying again SHALL return to the guest input page. A direct visit to the result page without a track SHALL behave as it does today.

#### Scenario: Trying again as a guest
- **WHEN** a guest taps the try-again link on the result page
- **THEN** the guest input page SHALL open, not the logged-in input page

#### Scenario: Feedback
- **WHEN** a guest responds with thumbs up or down
- **THEN** the response SHALL be handled as on the logged-in result page, in the browser only

### Requirement: Last.fm Attribution
The guest bottom sheet, guest input page, and guest result page SHALL show the text "곡 선정 참고: Last.fm" with a link to Last.fm. The logged-in pages SHALL NOT show it.

#### Scenario: Attribution visible
- **WHEN** the guest bottom sheet, guest input page, or guest result page is displayed
- **THEN** the attribution text and link SHALL be visible

### Requirement: Guest Rate Limit
The guest recommendation API SHALL limit requests per browser and per client address, and SHALL limit guest AI use per day, so that guest traffic does not exhaust the AI allowance. A limited request SHALL NOT call the AI, SHALL respond with a too-many-requests error, and SHALL lead the page to show a human-readable message. Limits SHALL reset by day in Asia/Seoul time. These limits SHALL NOT apply to logged-in recommendations.

#### Scenario: Browser limit reached
- **WHEN** a browser has used its daily guest requests
- **THEN** the next request SHALL receive a too-many-requests error without calling the AI
- **AND** the page SHALL show a message that today's trial limit has been reached

#### Scenario: Next day
- **WHEN** the date changes in Asia/Seoul after a browser reached its limit
- **THEN** the browser SHALL be able to request again

#### Scenario: Invalid requests do not count
- **WHEN** a request is rejected as a bad request
- **THEN** it SHALL NOT use up the limit

### Requirement: No Spotify User Data for Guests
Guest mode SHALL NOT start Spotify authorization, read a Spotify session, call any Spotify user endpoint, or store Spotify user data. Guest selections SHALL NOT be stored on the server or written to server logs.

#### Scenario: Guest request
- **WHEN** a guest recommendation is processed
- **THEN** only app-credential Spotify requests for track data SHALL be made

#### Scenario: Visitor with a session
- **WHEN** a logged-in user opens guest mode
- **THEN** the guest recommendation SHALL NOT read their session or library
