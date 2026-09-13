## Purpose

Lets the user express their current mood and situation through simple quick-reply buttons, so the recommendation can be personalized without requiring effortful text input.

## ADDED Requirements

### Requirement: Mood and Situation Single Selection
The system SHALL let the user select exactly one mood option and one situation option from quick-reply buttons.

#### Scenario: Selecting an option
- **WHEN** the user taps a mood or situation quick-reply button
- **THEN** that option SHALL become selected and any previously selected option in the same group SHALL become unselected

### Requirement: Submission Gated on Required Selections
The system SHALL disable the recommendation request action until both a mood and a situation are selected.

#### Scenario: Incomplete selection
- **WHEN** either mood or situation has not been selected
- **THEN** the recommendation request action SHALL remain disabled

#### Scenario: Complete selection
- **WHEN** both mood and situation are selected
- **THEN** the recommendation request action SHALL become enabled
