## Purpose

Automatically determines the user's current weather condition and temperature from their location so recommendations can factor in weather without any manual input, while degrading gracefully when weather is unavailable.

## ADDED Requirements

### Requirement: Automatic Weather Retrieval
The system SHALL retrieve the current weather condition and temperature for the user's location without requiring manual input, when location permission is granted.

#### Scenario: Location permission granted
- **WHEN** the user grants location permission on the mood/context input step
- **THEN** the system SHALL display the current weather condition and temperature

### Requirement: Weather Retrieval Failure Degrades Gracefully
The system SHALL proceed with recommendation generation using mood and situation alone when weather retrieval fails or is unavailable, without blocking the user.

#### Scenario: Weather fetch fails
- **WHEN** weather retrieval fails or location permission is denied
- **THEN** the system SHALL continue the recommendation flow without weather context

### Requirement: Manual City Input on Weather Failure
The system SHALL let the user manually enter a city name to retrieve weather when geolocation permission is denied or automatic retrieval fails, so weather context can still be included when possible (FR-11).

#### Scenario: Geolocation denied or retrieval fails
- **WHEN** location permission is denied or automatic weather retrieval fails
- **THEN** the system SHALL show a manual city input field

#### Scenario: Manual city submitted
- **WHEN** the user submits a city name via the manual input field
- **THEN** the system SHALL look up weather for that city and display the returned condition and temperature
