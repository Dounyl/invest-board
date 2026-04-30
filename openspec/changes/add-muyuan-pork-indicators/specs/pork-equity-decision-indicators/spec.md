## ADDED Requirements

### Requirement: Three-stage decision indicator scope
The system SHALL define the first version of the pork equity decision dashboard around three investment decision stages: sentiment low, industry turning point, and sector sentiment confirmation.

#### Scenario: First-version indicator set is derived
- **WHEN** the system defines the first-version indicator scope
- **THEN** it MUST include Muyuan stock price, national breeding sow inventory, national live hog ex-factory price, leading pork company stock performance, leading pork company disclosed cost range, and leading pork company cash condition metrics

#### Scenario: Non-essential industry metrics are excluded
- **WHEN** the system defines the first-version indicator scope
- **THEN** it MUST exclude commodity hog average selling price, hog slaughter volume, pork output, slaughterhouse volume, feed price, hog-corn ratio, hog-feed ratio, and sales revenue

### Requirement: Authoritative source boundary
The system SHALL use authoritative or officially authorized sources for first-version data collection and MUST NOT use third-party market data sources for stock prices.

#### Scenario: Stock price source is selected
- **WHEN** the system selects a source for stock price data
- **THEN** it MUST use exchange pages or authorized market data sources and MUST NOT use third-party market data sources

#### Scenario: Live hog price source is selected
- **WHEN** the system selects a source for national live hog ex-factory price
- **THEN** it MUST use the National Development and Reform Commission price monitoring center as the first source because it provides higher-frequency weekly data

#### Scenario: Live hog price is cross-checked
- **WHEN** the system needs a lower-frequency verification source for national live hog price
- **THEN** it MAY use Ministry of Agriculture and Rural Affairs monthly pig product information as a cross-check source

### Requirement: Industry turning point indicators
The system SHALL represent the industry turning point using national breeding sow inventory as the leading supply indicator and national live hog ex-factory price as the price confirmation indicator.

#### Scenario: Turning point data is displayed
- **WHEN** the dashboard presents industry turning point information
- **THEN** it MUST show national breeding sow inventory together with national live hog ex-factory price

#### Scenario: Turning point is not over-expanded
- **WHEN** the dashboard presents industry turning point information
- **THEN** it MUST NOT require hog slaughter volume, pork output, slaughterhouse volume, feed price, hog-corn ratio, or hog-feed ratio in the first version

### Requirement: Fixed leading pork company universe
The system SHALL use a fixed first-version leading pork company list for cost and cash condition comparison.

#### Scenario: Company universe is defined
- **WHEN** the system builds the first-version leading pork company comparison
- **THEN** it MUST include Muyuan Foods, Wens Foodstuff, New Hope, Tianbang Food, Juxing Agriculture and Animal Husbandry, Tangrenshen, Dabeinong, and Zhengbang Technology

#### Scenario: Company universe is not configurable in first version
- **WHEN** the first-version dashboard is generated
- **THEN** it MUST NOT require users to add or remove leading pork companies through configuration

### Requirement: Cost and cash condition comparison
The system SHALL compare leading pork companies using disclosed cost ranges and raw cash condition metrics without deriving subjective cash safety labels in the first version.

#### Scenario: Cost comparison is generated
- **WHEN** the system presents cost comparison for leading pork companies
- **THEN** it MUST use company-disclosed cost ranges as the first display basis

#### Scenario: Cash condition comparison is generated
- **WHEN** the system presents cash condition comparison for leading pork companies
- **THEN** it MUST include monetary funds, short-term interest-bearing debt or debt due within one year, operating cash flow, and asset-liability ratio when available

#### Scenario: Cash safety labels are not generated
- **WHEN** the system presents first-version cash condition comparison
- **THEN** it MUST NOT generate derived labels such as safe, watch, or tight

### Requirement: Dashboard design document handoff
The system SHALL defer first-version page layout and visualization details to a separate Markdown dashboard design document before frontend implementation.

#### Scenario: Dashboard design is prepared
- **WHEN** the data scope and indicator specifications are accepted
- **THEN** the next stage MUST create a Markdown dashboard design document before implementing Vue pages or ECharts charts

### Requirement: Historical backfill and incremental refresh
The system SHALL support a cold-start historical backfill for each selected indicator and SHALL use scheduled incremental refreshes after the initial backfill is complete.

#### Scenario: Cold-start backfill is executed
- **WHEN** a selected indicator has no existing raw data
- **THEN** the ingestion process MUST query a configured historical lookback window before producing dashboard exports

#### Scenario: Incremental refresh is executed
- **WHEN** raw data already exists for a selected indicator
- **THEN** the ingestion process MUST query only the configured incremental update window unless a manual backfill is requested

#### Scenario: Raw data remains append-only
- **WHEN** historical backfill or incremental refresh writes raw data
- **THEN** the system MUST append new raw records or files without overwriting historical raw data
