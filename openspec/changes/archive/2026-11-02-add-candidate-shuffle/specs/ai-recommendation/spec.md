## ADDED Requirements

### Requirement: Candidate Order Randomized Per Request
For every recommendation request, on both the mood and situation path and the free text path, the system SHALL present the library sample to the AI in an independently randomized order and SHALL tell the AI that the order of the candidates has no meaning. Randomizing SHALL change only the order: the candidates offered SHALL be exactly the tracks of the library sample, with none added, removed, or duplicated. The first attempt and its retry within one request SHALL use the same order. The deterministic fallback SHALL remain the first track of the library sample in its original, unrandomized order. The source of randomness SHALL NOT be controllable through the request body.

#### Scenario: Same candidates in a different order
- **WHEN** a recommendation request is made with a library sample of 50 tracks
- **THEN** the candidates given to the AI SHALL be exactly those 50 tracks, each once
- **AND** the AI SHALL be told that the order of the candidates has no meaning

#### Scenario: Requests are randomized independently
- **WHEN** two requests are made with the same input and library using different random values
- **THEN** the candidates MAY be given in different orders while the set of candidates SHALL be identical

#### Scenario: Free text path
- **WHEN** a recommendation request contains valid free text
- **THEN** the candidates SHALL be randomized and the order notice given as on the mood and situation path

#### Scenario: Retry keeps the order
- **WHEN** the AI's first pick is not in the library sample and the request is retried
- **THEN** the retry SHALL give the AI the candidates in the same order as the first attempt

#### Scenario: Fallback ignores the randomized order
- **WHEN** the retried AI response still does not match the library sample
- **THEN** the fallback track SHALL be the first track of the library sample in its original order, regardless of the randomized order
- **AND** the generic fallback reason SHALL be used as before

#### Scenario: Request body cannot control randomness
- **WHEN** a request body contains a field that attempts to set a random seed or a candidate order
- **THEN** the field SHALL be ignored
