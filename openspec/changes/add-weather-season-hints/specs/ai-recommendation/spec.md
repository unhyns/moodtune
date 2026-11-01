## MODIFIED Requirements

### Requirement: Reason References Provided Input
For a non-fallback recommendation, the reason SHALL explicitly reference at least one of the input values the user actually provided among mood, situation, free text, and weather. Whenever a reason refers to the weather, it SHALL use the weather expression "{condition} {temperature} 날" and SHALL NOT state the temperature as a number. {condition} SHALL be derived from the first two characters of the weather icon code (01 맑고, 02 구름 끼고, 03 or 04 흐리고, 09, 10, or 11 비 오고, 13 눈 오고, 50 안개 끼고) and SHALL be omitted, together with its following space, when the code is missing or not in this mapping. {temperature} SHALL be derived from the temperature rounded to the nearest integer: 더운 at 25°C or above, 따뜻한 from 17 to 24, 시원한 from 12 to 16, 쌀쌀한 from 6 to 11, and 추운 at 5 or below.

For mood and situation input, the reason is written by the AI from the provided values; when weather is available, it SHALL describe the weather only with this weather expression as given. When free text is provided, the free text SHALL be used only to select the track, and the reason SHALL be a fixed sentence determined by the system rather than wording written by the AI: "{weather expression}, 남겨주신 이야기를 바탕으로 골랐어요." when weather is available, and "남겨주신 이야기를 바탕으로 골랐어요." when it is not. The reason for free text SHALL NOT contain any part of the free text. The reason is passed to the result page in the URL as for chip input, so this keeps the entered text out of the URL. Input values that were not provided (for example, weather when it could not be retrieved) SHALL NOT be referenced as if they were known.

#### Scenario: Mood and weather provided
- **WHEN** the user submits mood "Calm" with no situation, and weather is available with icon "01d" and 18°C
- **THEN** the reason SHALL mention the calm mood, the weather, or both
- **AND** if it mentions the weather, it SHALL use the expression "맑고 따뜻한 날" and SHALL NOT contain "18°C" or any other temperature number

#### Scenario: Weather with an unmapped icon in a chip reason
- **WHEN** the user submits situation "Driving" with weather whose icon code is not in the mapping and 3°C
- **THEN** a reason that mentions the weather SHALL use the expression "추운 날" without any condition expression or temperature number

#### Scenario: Only situation provided, no weather
- **WHEN** the user submits situation "Driving" with no mood, and weather could not be retrieved
- **THEN** the reason SHALL mention the driving situation
- **AND** the reason SHALL NOT describe any weather condition

#### Scenario: Free text provided, no weather
- **WHEN** the user submits the free text "야근 끝나고 지하철 타는 중", weather could not be retrieved, and the selected track is in no user playlist
- **THEN** the reason SHALL be exactly "남겨주신 이야기를 바탕으로 골랐어요."
- **AND** the reason SHALL NOT contain any part of "야근 끝나고 지하철 타는 중"

#### Scenario: Free text provided with weather
- **WHEN** the user submits the free text "비 오는데 늦잠 자서 급하게 나가는 중" with weather icon "10d" and 12.4°C, and the selected track is in no user playlist
- **THEN** the reason SHALL be exactly "비 오고 시원한 날, 남겨주신 이야기를 바탕으로 골랐어요."

#### Scenario: Temperature rounding at a boundary
- **WHEN** the user submits free text with weather icon "01d" and 24.6°C
- **THEN** the temperature SHALL be treated as 25 and the reason SHALL begin with "맑고 더운 날,"

#### Scenario: Unknown icon code
- **WHEN** the user submits free text with a weather icon code that is not in the mapping, and 3°C
- **THEN** the reason SHALL begin with "추운 날," without any condition expression

## ADDED Requirements

### Requirement: Weather and Season Hints
For every recommendation request, the system SHALL give the AI weather and season hints as weak, reference-only guidance for choosing the track. The hints SHALL NOT filter or reorder the library sample offered to the AI, and no candidate filtering by weather, season, release date, or track length SHALL be applied. The system SHALL also state the priority of the inputs to the AI: for mood and situation input, "mood and situation > weather > season"; for free text, "the user's text > weather > season".

The weather hint SHALL be chosen from the weather icon category: 01 or 02 "밝고 경쾌한 느낌", 03, 04, or 50 "차분한 느낌", 09, 10, or 11 "잔잔한 느낌", 13 "따뜻하고 설레는 느낌". When weather is unavailable or its icon is not in these categories, no weather hint SHALL be given.

The season hint SHALL always be given and SHALL be determined by the server from the current date and time in the Asia/Seoul time zone (spring March–May, summer June–August, autumn September–November, winter December–February): spring "가볍고 행복한 느낌"; summer "빠르고 열정적인 느낌"; autumn "가볍고 잔잔한 느낌" from 06:00 to 17:59 and "차분하고 서정적인 느낌" from 18:00 to 05:59; winter "설레고 따뜻한 크리스마스 느낌" when the weather icon category is snow (13) or, for mood and situation input, when the mood is Excited or Romantic, and "차분하고 서정적인 느낌" otherwise. For free text, the winter Christmas hint SHALL apply only when it is snowing. Time of day SHALL affect only the autumn hint.

The hints SHALL be used only for choosing the track; the reason SHALL NOT mention the hints or the season, and all existing reason rules, including No Unfounded Claims About the Track, SHALL still apply. The retry and deterministic fallback behavior SHALL NOT change.

#### Scenario: Rainy autumn evening with chips
- **WHEN** the user submits mood "Calm" at 19:30 Asia/Seoul time on October 15 with weather icon "10n"
- **THEN** the AI SHALL receive the weather hint "잔잔한 느낌" and the season hint "차분하고 서정적인 느낌"
- **AND** the AI SHALL be told that mood and situation take priority over weather, and weather over season

#### Scenario: Autumn time-of-day boundary
- **WHEN** a request is made in autumn at 05:59 and another at 06:00 Asia/Seoul time
- **THEN** the first SHALL receive "차분하고 서정적인 느낌" and the second "가볍고 잔잔한 느낌"
- **AND** a request at 17:59 SHALL receive "가볍고 잔잔한 느낌" and one at 18:00 "차분하고 서정적인 느낌"

#### Scenario: Season uses Asia/Seoul time
- **WHEN** a request is made at 2026-11-30 15:30 UTC, which is 2026-12-01 00:30 in Asia/Seoul
- **THEN** the season SHALL be winter

#### Scenario: Winter with an Excited mood
- **WHEN** the user submits mood "Excited" in January with weather icon "01d"
- **THEN** the AI SHALL receive the weather hint "밝고 경쾌한 느낌" and the season hint "설레고 따뜻한 크리스마스 느낌"

#### Scenario: Winter without snow or an excited mood
- **WHEN** the user submits mood "Calm" in December with weather icon "04d"
- **THEN** the season hint SHALL be "차분하고 서정적인 느낌"

#### Scenario: Winter free text
- **WHEN** the user submits free text in February with weather icon "13d"
- **THEN** the season hint SHALL be "설레고 따뜻한 크리스마스 느낌" and the AI SHALL be told that the user's text takes priority over weather, and weather over season
- **AND** with weather icon "01d" instead, the season hint SHALL be "차분하고 서정적인 느낌"

#### Scenario: No weather available
- **WHEN** the user submits situation "Driving" in July and weather could not be retrieved
- **THEN** no weather hint SHALL be given and the season hint "빠르고 열정적인 느낌" SHALL still be given

#### Scenario: Hints never filter candidates
- **WHEN** two requests with the same input and library differ only in weather or season
- **THEN** the library sample offered to the AI SHALL be identical in both

#### Scenario: Hints not mentioned in the reason
- **WHEN** a chip recommendation is returned on a summer day with weather icon "01d"
- **THEN** the reason SHALL NOT mention the season, "밝고 경쾌한 느낌", "빠르고 열정적인 느낌", or any hint wording, and SHALL NOT describe the track's feel
