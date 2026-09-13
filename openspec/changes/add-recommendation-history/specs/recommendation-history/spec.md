## Purpose

사용자가 과거에 받은 추천을 다시 찾아보고 관리할 수 있도록, 추천 기록을 생성·조회·상태 변경·필터링하는 기능을 제공한다.

## ADDED Requirements

### Requirement: History Entry Creation on Recommendation
The system SHALL create a history entry each time a recommendation is generated, recording the recommended track, mood, situation, weather (when available), and the time it was generated, with a default initial status.

#### Scenario: Recommendation generates a history entry
- **WHEN** a recommendation is successfully generated for the user
- **THEN** the system SHALL create a corresponding history entry recorded against that user

### Requirement: History List Retrieval
The system SHALL let the user view their past recommendation history entries in reverse chronological order (most recent first).

#### Scenario: Viewing history
- **WHEN** the user opens the history list
- **THEN** the system SHALL display their past history entries ordered from most recent to oldest

#### Scenario: No history yet
- **WHEN** the user has no history entries
- **THEN** the system SHALL show a message indicating there is no history yet

### Requirement: History Entry Status Change
The system SHALL let the user change a history entry's status to one of: played, saved, or dismissed.

#### Scenario: Changing status
- **WHEN** the user selects a new status for a history entry
- **THEN** the system SHALL update that entry's status and reflect the change in the list

### Requirement: History Filtering
The system SHALL let the user filter their history list by mood and by date range.

#### Scenario: Filtering by mood
- **WHEN** the user selects a mood filter
- **THEN** the system SHALL show only history entries recorded with that mood

#### Scenario: Filtering by date
- **WHEN** the user selects a date range filter
- **THEN** the system SHALL show only history entries created within that range

#### Scenario: Clearing filters
- **WHEN** the user clears active filters
- **THEN** the system SHALL show the full unfiltered history list again
