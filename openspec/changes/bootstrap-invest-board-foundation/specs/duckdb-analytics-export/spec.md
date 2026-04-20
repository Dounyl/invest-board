## ADDED Requirements

### Requirement: Warehouse-first analytics flow
The system SHALL perform analytical transformations in DuckDB before producing any frontend-consumable dataset.

#### Scenario: Build chart dataset
- **WHEN** a chart dataset is requested
- **THEN** the data is computed from DuckDB marts rather than directly from raw files

### Requirement: Structured SQL layers
The system SHALL separate SQL assets into `sql/staging/`, `sql/marts/`, and `sql/checks/` to enforce normalization, aggregation, and quality checks.

#### Scenario: Add a new metric pipeline
- **WHEN** a developer introduces a new metric
- **THEN** they can place normalization, aggregation, and validation logic in dedicated SQL layers

### Requirement: Stable JSON export boundary
The system SHALL export chart-ready JSON files into `data/export/<domain>/` and SHALL keep a stable file contract for web consumption.

#### Scenario: Frontend reads exported payload
- **WHEN** the static web app requests `data/export/pork/timeseries.json`
- **THEN** the file exists and follows the agreed schema for chart rendering
