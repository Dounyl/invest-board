#!/usr/bin/env node
import fs from "node:fs";
import { loadConfig, readJson, resolvePath, writeJson } from "../lib/porkDecisionConfig.mjs";

const config = loadConfig();
const martPath = resolvePath("data/warehouse/pork_decision_dashboard.json");
if (!fs.existsSync(martPath)) {
  throw new Error("Missing warehouse mart. Run `node scripts/transform/pork_transform.mjs` first.");
}

const dashboard = readJson("data/warehouse/pork_decision_dashboard.json");
writeJson("data/export/pork/decision-dashboard.json", dashboard);
writeJson("data/export/pork/overview.json", {
  schema_version: dashboard.schema_version,
  generated_at: dashboard.generated_at,
  sections: Object.fromEntries(Object.entries(dashboard.sections).map(([key, section]) => [key, {
    title: section.title,
    data_freshness: section.data_freshness,
    source_notes: section.source_notes
  }]))
});
writeJson("data/export/pork/timeseries.json", {
  schema_version: dashboard.schema_version,
  generated_at: dashboard.generated_at,
  sentiment_low: dashboard.sections.sentiment_low.series,
  industry_turning_point: dashboard.sections.industry_turning_point.series,
  industry_sample_monitoring: dashboard.sections.industry_turning_point.sample_series
});
writeJson("data/export/pork/rankings.json", {
  schema_version: dashboard.schema_version,
  generated_at: dashboard.generated_at,
  sector_sentiment: dashboard.sections.sector_sentiment_confirmation.sentiment,
  sector_price_series: dashboard.sections.sector_sentiment_confirmation.price_series,
  sector_sentiment_confirmation: dashboard.sections.sector_sentiment_confirmation.rows,
  leading_company_resilience: dashboard.sections.leading_company_resilience.rows
});

console.log(`[pork-export] wrote ${Object.values(config.exports).join(", ")}`);
