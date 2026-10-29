## Purpose

Lets the user describe their current state in their own words on a dedicated page, as an alternative to the mood and situation quick-reply buttons, and get a recommendation from that text alone.

## ADDED Requirements

### Requirement: Free Text Entry Point
The mood and context input page SHALL show a clearly labeled "직접 입력" action that navigates to a separate free text input page. Adding this action SHALL NOT change the existing chip selection, weather display, or submission behavior of the input page.

#### Scenario: Opening the free text page
- **WHEN** the user taps the "직접 입력" action on the input page
- **THEN** the system SHALL navigate to the free text input page

#### Scenario: Chip flow unchanged
- **WHEN** the user selects a mood or situation chip and submits from the input page without using the entry action
- **THEN** the system SHALL behave exactly as it did before this change

### Requirement: Text-Only Input Ignoring Chips
The free text input page SHALL offer only a text input for the user's state and SHALL NOT offer mood or situation chips. Any chip selected on the input page before navigating SHALL NOT be sent with, or otherwise affect, a recommendation requested from the free text page.

#### Scenario: Chips selected before entering
- **WHEN** the user selects mood "Calm" on the input page, then opens the free text page and submits "비 와서 집에 있고 싶은 기분"
- **THEN** the recommendation request SHALL contain the text and SHALL NOT contain any mood or situation value

### Requirement: Text Length and Blank Validation
The free text SHALL be limited to 200 characters. The submit action SHALL be disabled while the text is empty or contains only whitespace, and while a submission is in progress. The page SHALL show the current character count against the limit.

#### Scenario: Blank text
- **WHEN** the text is empty or contains only spaces or line breaks
- **THEN** the submit action SHALL be disabled

#### Scenario: Limit reached
- **WHEN** the user tries to enter more than 200 characters
- **THEN** the text SHALL NOT exceed 200 characters

#### Scenario: Valid text
- **WHEN** the text contains at least one non-whitespace character and no submission is in progress
- **THEN** the submit action SHALL be enabled

### Requirement: Weather Handed Over From Input Page
The free text input page SHALL NOT request weather on its own. It SHALL use the weather state the input page already obtained in the same browser tab: when weather was retrieved, it SHALL display the city (if known), weather icon, and temperature read-only and send that weather with the request; when retrieval failed or no weather state is available, it SHALL indicate that weather is unavailable and send the request without weather.

#### Scenario: Weather available
- **WHEN** the input page retrieved weather for Seoul, clear, 18°C, and the user then opens the free text page
- **THEN** the free text page SHALL display Seoul, the clear-weather icon, and 18°C without any new weather request
- **AND** a submission SHALL include that weather

#### Scenario: Weather failed or unknown
- **WHEN** weather retrieval failed on the input page, or the free text page is opened directly without a weather state
- **THEN** the free text page SHALL show that weather is unavailable
- **AND** a submission SHALL NOT include any weather

### Requirement: Draft Preserved Within the Tab
The text being written SHALL be saved temporarily in the browser tab's session storage so that it is restored after going back or reloading the page. The draft SHALL NOT be sent to the server or saved anywhere else. The draft SHALL be cleared once a recommendation is successfully shown.

#### Scenario: Reload while writing
- **WHEN** the user types text and reloads the free text page
- **THEN** the previously typed text SHALL be restored

#### Scenario: Back and forward
- **WHEN** the user types text, goes back to the input page, and opens the free text page again
- **THEN** the previously typed text SHALL be restored

#### Scenario: After successful recommendation
- **WHEN** a recommendation from the free text page is shown on the result page
- **THEN** the saved draft SHALL be cleared

### Requirement: Usage Notice
The free text input page SHALL show, near the text input, a notice that the entered text is used to generate the recommendation.

#### Scenario: Notice visible
- **WHEN** the free text input page is displayed
- **THEN** a notice stating that the entered text is used for generating the recommendation ("입력한 내용은 추천 생성에 사용돼요") SHALL be visible near the input

### Requirement: No Duplicate Submission During Composition
Submission SHALL happen only through the explicit submit action. Pressing Enter in the text input, including while Korean (IME) composition is in progress, SHALL NOT submit. Only one recommendation request SHALL be in flight per submission.

#### Scenario: Enter during Korean composition
- **WHEN** the user is composing a Korean syllable and presses Enter
- **THEN** no recommendation request SHALL be sent

#### Scenario: Repeated taps on submit
- **WHEN** the user taps the submit action several times quickly
- **THEN** exactly one recommendation request SHALL be sent

### Requirement: Submission Flow to Result
Submitting from the free text page SHALL show the same loading popup as the input page and, once the recommendation is ready, SHALL navigate directly to the result page without returning to the input page. The result page URL SHALL NOT carry the free text as the user entered it, neither as a parameter of its own nor copied verbatim inside another parameter. The recommendation reason SHALL still be passed to the result page in the URL, as for chip input; for free text the reason is the fixed sentence defined by the ai-recommendation capability and contains no part of the free text, so its presence in the URL is expected. The result page SHALL show weather when it was sent and SHALL NOT show mood or situation badges.

#### Scenario: Successful submission
- **WHEN** the user submits valid text and the recommendation succeeds
- **THEN** the loading popup SHALL be shown and the user SHALL be taken to the result page with the recommended track

#### Scenario: Entered text not in URL
- **WHEN** the result page is reached from the free text page
- **THEN** the result page URL SHALL NOT contain a parameter carrying the submitted text
- **AND** no parameter value in the URL SHALL contain the submitted text as the user typed it

#### Scenario: Reason in URL is the fixed sentence
- **WHEN** the user submits "야근 끝나고 지하철 타는 중" with weather icon "01d" and 18°C, and the recommendation succeeds with a track that is in no user playlist
- **THEN** the result page URL SHALL contain the reason "맑고 따뜻한 날, 남겨주신 이야기를 바탕으로 골랐어요." as for chip input
- **AND** no parameter value SHALL contain the sentence "야근 끝나고 지하철 타는 중" as typed

### Requirement: Failure Keeps Text and Allows Retry
When a recommendation request from the free text page fails, the system SHALL close the loading popup, keep the typed text, show a human-readable error message, and let the user submit again. The page SHALL always provide a link back to the input page. When the session is no longer valid, the system SHALL send the user to the landing page to sign in again, as the input page does.

#### Scenario: Request fails
- **WHEN** the recommendation request fails due to a server or network error
- **THEN** the typed text SHALL remain in the input
- **AND** an error message SHALL be shown and the submit action SHALL be enabled again

#### Scenario: Empty library
- **WHEN** the recommendation request fails because the user's library is empty
- **THEN** the page SHALL show a message that the library is empty instead of the generic error

#### Scenario: Going back
- **WHEN** the user taps the link back to the input page
- **THEN** the system SHALL navigate to the input page
