# recommendation-feedback Specification

## Purpose
Let users rate each recommendation on the Result screen with a simple yes/no, keep those ratings on their own device keyed by Spotify URI, and expose the overall satisfaction ratio for measuring the PRD perceived-quality criterion.

## Requirements

### Requirement: Satisfaction Prompt on Result Screen
The Result screen SHALL display a satisfaction question (for example, "이 추천 어땠나요?") with two response controls, one meaning satisfied (yes) and one meaning not satisfied (no), for the recommended item identified by its Spotify URI. Responding SHALL be optional.

#### Scenario: Unanswered result
- **WHEN** the user opens a Result screen for a URI that has no stored response
- **THEN** the screen SHALL show the question with the yes and no controls

#### Scenario: Other actions work without responding
- **WHEN** the user has not responded to the question
- **THEN** "Listen in Spotify!" and "Tune Again?" SHALL work exactly as before this change

#### Scenario: Invalid URI
- **WHEN** the Result screen's URI is not a Spotify track, album, or playlist URI
- **THEN** the question SHALL NOT be shown and the rest of the screen SHALL render as before

### Requirement: One Response per Result
After the user responds, the question and controls SHALL be replaced with a thank-you message, and the user SHALL NOT be able to respond again for the same URI. This SHALL hold across page reloads and when the same URI is recommended again later on the same device and browser.

#### Scenario: Responding
- **WHEN** the user presses yes or no
- **THEN** the response SHALL be recorded and the controls SHALL be replaced by a thank-you message

#### Scenario: Reload after responding
- **WHEN** the user reloads the Result screen for a URI they already responded to
- **THEN** the thank-you message SHALL be shown instead of the controls

#### Scenario: Same item recommended again
- **WHEN** a later recommendation returns a URI the user already responded to
- **THEN** the thank-you message SHALL be shown and the stored response SHALL NOT change

### Requirement: Local Feedback Storage
Responses SHALL be stored only in the browser's local storage, keyed by the item's Spotify URI (track, album, or playlist), with the value `liked` for yes and `disliked` for no. Each URI's entry SHALL be a record that can hold additional per-item signals (such as pin or exclude) in the future without changing or losing existing feedback values. Responses SHALL NOT be sent to any server.

#### Scenario: Stored value
- **WHEN** the user presses yes for `spotify:track:abc`
- **THEN** local storage SHALL contain an entry for `spotify:track:abc` whose feedback is `liked`

#### Scenario: No network request
- **WHEN** the user responds
- **THEN** no network request SHALL be made as a result of the response

#### Scenario: Storage unavailable
- **WHEN** local storage cannot be read or written (for example, blocked by the browser)
- **THEN** pressing a control SHALL still show the thank-you message, the Result screen SHALL keep working, and no error SHALL be shown to the user

#### Scenario: Unrecognized stored data
- **WHEN** the stored data is missing, malformed, or uses an unknown version
- **THEN** the system SHALL treat it as having no responses and SHALL NOT crash

### Requirement: Satisfaction Ratio Log
After each response, the system SHALL write the overall satisfaction ratio across all stored responses to the browser console, including the number of `liked` responses, the total number of responses, and the percentage.

#### Scenario: Ratio after responding
- **WHEN** local storage holds 3 `liked` and 1 `disliked` responses and the user responds yes to a new URI
- **THEN** the console SHALL show 4 liked out of 5 responses (80%)

### Requirement: Feedback Does Not Affect Recommendations
Stored feedback SHALL NOT change how recommendations are generated, what the recommendation API receives or returns, or the Result screen's other content in this change.

#### Scenario: Disliked item
- **WHEN** the user has marked a URI as `disliked`
- **THEN** subsequent recommendation requests SHALL be identical to those made without that feedback
