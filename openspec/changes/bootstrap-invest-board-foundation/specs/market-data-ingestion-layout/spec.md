## ADDED Requirements

### Requirement: Domain-aligned raw data layout
The system SHALL organize raw market data by domain under `data/raw/<domain>/` and SHALL preserve historical snapshots as append-only data.

#### Scenario: Store pork raw snapshot
- **WHEN** an ingest job for pork data completes
- **THEN** the system writes new raw files under `data/raw/pork/` without deleting historical files

### Requirement: Source configuration contract
The system SHALL define each data source in `config/sources/*.yml` with `source_id`, `enabled`, `schedule`, `endpoints`, and `storage` fields.

#### Scenario: Load source configuration
- **WHEN** a new source config file is added
- **THEN** the ingest layer can parse required fields and determine whether the source is active

### Requirement: Expandable multi-domain structure
The system SHALL reserve first-class domain paths for pork, fed, ust, and crypto data from project initialization.

#### Scenario: Add future domain pipeline
- **WHEN** a developer starts implementing a Fed data pipeline
- **THEN** the repository already contains `config/sources/fed.yml` and `data/raw/fed/` as standard integration points
