## 1. Project Foundation

- [ ] 1.1 Initialize Python dependency files (`requirements.txt` or `pyproject.toml`) for ingest/transform/export scripts
- [ ] 1.2 Add script entrypoints in `scripts/ingest/`, `scripts/transform/`, and `scripts/export/`
- [ ] 1.3 Validate repository layout against `README.md` and `AGENTS.md` constraints

## 2. Ingestion Layer (Pork MVP)

- [ ] 2.1 Implement `scripts/ingest/pork_ingest.py` to fetch pork data and write append-only raw files
- [ ] 2.2 Implement source-config loading from `config/sources/pork.yml`
- [ ] 2.3 Add ingest logging and retry behavior for transient request failures

## 3. DuckDB Transform and Quality

- [ ] 3.1 Create staging SQL for pork source normalization in `sql/staging/`
- [ ] 3.2 Create marts SQL for chart-facing aggregates in `sql/marts/`
- [ ] 3.3 Create data quality checks in `sql/checks/` (nulls, duplicates, date continuity)
- [ ] 3.4 Implement transform runners to execute staging, marts, and checks in order

## 4. Export Contract and Dashboard Consumption

- [ ] 4.1 Implement JSON export script to write stable payloads under `data/export/pork/`
- [ ] 4.2 Define and document JSON schema for `overview.json`, `timeseries.json`, and `rankings.json`
- [ ] 4.3 Scaffold `web/` app with Vite + Vue + ECharts and read-only data service abstraction
- [ ] 4.4 Build initial pork dashboard page with timestamp and source disclaimer

## 5. Automation and Delivery

- [ ] 5.1 Replace placeholder steps in `.github/workflows/pipeline.yml` with real ingest/transform/export commands
- [ ] 5.2 Configure CI secrets usage and fail-fast behavior for missing credentials
- [ ] 5.3 Add deployment step for static site publishing
- [ ] 5.4 Add basic runbook section in `README.md` for local run, CI run, and rollback
