## ADDED Requirements

### Requirement: Public read-only delivery
The system SHALL publish dashboard content as a public read-only static site and SHALL NOT require user authentication for viewing.

#### Scenario: Open dashboard as a visitor
- **WHEN** an unauthenticated visitor accesses the dashboard URL
- **THEN** the visitor can view charts and tables without sign-in

### Requirement: No write interface exposure
The system SHALL avoid exposing any public write API, admin endpoint, or mutable backend route in the dashboard surface.

#### Scenario: Inspect deployed surface
- **WHEN** the site is deployed
- **THEN** only static assets and read-only data files are publicly accessible

### Requirement: Data transparency markers
The system SHALL display data freshness and source notes on dashboard pages.

#### Scenario: Render dashboard header
- **WHEN** the homepage is loaded
- **THEN** it shows the last update timestamp and source disclaimer information
