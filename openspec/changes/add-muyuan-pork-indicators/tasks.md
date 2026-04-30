## 1. Indicator Scope And Sources

- [ ] 1.1 Define first-version indicator configuration for Muyuan stock price, national breeding sow inventory, national live hog ex-factory price, leading pork company stock performance, disclosed cost ranges, and cash condition metrics
- [ ] 1.2 Define the fixed first-version leading pork company list: 牧原股份、温氏股份、新希望、天邦食品、巨星农牧、唐人神、大北农、正邦科技
- [ ] 1.3 Document authoritative source choices, including NDRC price monitoring center as the first source for national live hog ex-factory price
- [ ] 1.4 Confirm stock price ingestion uses exchange pages or authorized market data sources and does not use third-party market data sources
- [ ] 1.5 Define historical backfill lookback windows and scheduled incremental update windows for each selected indicator

## 2. Dashboard Design Document

- [ ] 2.1 Create `dashboard-design.md` for the first-version three-stage decision dashboard
- [ ] 2.2 Specify dashboard sections for sentiment low, industry turning point, sector sentiment confirmation, and leading pork company safety comparison
- [ ] 2.3 Specify the first-version chart/table fields and explicitly exclude non-essential industry metrics
- [ ] 2.4 Specify data freshness, source attribution, and low-frequency financial data warnings

## 3. Data Pipeline Contracts

- [ ] 3.1 Define raw data landing paths for stock, industry, announcement, cost, and financial data
- [ ] 3.2 Define DuckDB staging and mart table contracts for the selected indicators
- [ ] 3.3 Define export JSON contracts for dashboard consumption
- [ ] 3.4 Ensure exported data preserves source, report period, disclosure口径, and generated timestamp

## 4. Implementation

- [ ] 4.1 Implement or stub source loaders for the selected authoritative sources
- [ ] 4.2 Implement cold-start backfill behavior when no raw data exists
- [ ] 4.3 Implement scheduled incremental refresh behavior after initial raw data exists
- [ ] 4.4 Implement transform logic for the first-version indicator set
- [ ] 4.5 Implement export logic for the dashboard JSON payloads
- [ ] 4.6 Implement quality checks for required fields, duplicate periods, source presence, stale data, and append-only raw writes

## 5. Dashboard Integration

- [ ] 5.1 Add read-only frontend data service for the new export JSON payloads
- [ ] 5.2 Implement the first-version dashboard according to `dashboard-design.md`
- [ ] 5.3 Display source attribution and update timestamps for every dashboard section
- [ ] 5.4 Verify the dashboard does not show excluded first-version metrics or derived cash safety labels

## 6. Verification And Rollback

- [ ] 6.1 Add sample data fixtures for local verification
- [ ] 6.2 Verify cold-start backfill from empty raw data through export
- [ ] 6.3 Verify incremental refresh from existing raw data through export
- [ ] 6.4 Run frontend build or preview verification after dashboard integration
- [ ] 6.5 Document rollback by removing the new indicator configuration, pipeline outputs, and dashboard entry
