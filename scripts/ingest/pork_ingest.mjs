#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ensureDir, isoCompact, listJsonlFiles, loadConfig, repoRoot, resolvePath } from "../lib/porkDecisionConfig.mjs";

const args = new Set(process.argv.slice(2));
const manualBackfill = args.has("--backfill");
const dryRun = args.has("--dry-run");
const now = new Date();
const generatedAt = now.toISOString();
const config = loadConfig();

function dateDaysAgo(days) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function baseRecord(indicator, extra = {}) {
  return {
    indicator_id: indicator.id,
    indicator_name: indicator.name,
    unit: indicator.unit,
    source_id: indicator.primary_source.source_id,
    source_name: indicator.primary_source.name,
    source_authority_level: indicator.primary_source.authority_level,
    generated_at: generatedAt,
    ...extra
  };
}

function sampleRecords(indicator, mode, windowDays) {
  const startDate = dateDaysAgo(windowDays);
  switch (indicator.id) {
    case "muyuan_stock_price":
      return [
        baseRecord(indicator, { trade_date: startDate, company_id: "muyuan", company_name: "牧原股份", stock_code: "002714.SZ", close_price: 38.20, pct_change: -1.8 }),
        baseRecord(indicator, { trade_date: dateDaysAgo(Math.max(windowDays - 3, 0)), company_id: "muyuan", company_name: "牧原股份", stock_code: "002714.SZ", close_price: 39.05, pct_change: 2.2 })
      ];
    case "breeding_sow_inventory":
      return [
        baseRecord(indicator, { period: startDate.slice(0, 7), value: 3992, disclosure_basis: "全国月度公开数据" }),
        baseRecord(indicator, { period: generatedAt.slice(0, 7), value: 3986, disclosure_basis: "全国月度公开数据" })
      ];
    case "live_hog_ex_factory_price":
      return [
        baseRecord(indicator, { period: startDate, value: 14.8, disclosure_basis: "周度价格监测" }),
        baseRecord(indicator, { period: dateDaysAgo(Math.max(windowDays - 7, 0)), value: 15.2, disclosure_basis: "周度价格监测" })
      ];
    case "leading_pork_company_stock_performance":
      return config.companies.map((company, index) => baseRecord(indicator, {
        trade_date: generatedAt.slice(0, 10),
        company_id: company.id,
        company_name: company.name,
        stock_code: company.stock_code,
        pct_change: Number(((index - 3) * 0.7).toFixed(2))
      }));
    case "leading_pork_company_cost_range":
      return config.companies.map((company, index) => baseRecord(indicator, {
        report_period: "2026Q1",
        company_id: company.id,
        company_name: company.name,
        cost_low: Number((13.2 + index * 0.25).toFixed(2)),
        cost_high: Number((14.1 + index * 0.25).toFixed(2)),
        disclosure_basis: "公司公告披露口径"
      }));
    case "leading_pork_company_cash_condition":
      return config.companies.map((company, index) => baseRecord(indicator, {
        report_period: "2026Q1",
        company_id: company.id,
        company_name: company.name,
        monetary_funds: 12000 - index * 650,
        short_term_interest_bearing_debt: 5200 + index * 280,
        operating_cash_flow: 900 - index * 120,
        asset_liability_ratio: Number((0.56 + index * 0.025).toFixed(3)),
        disclosure_basis: "公司定期报告披露口径"
      }));
    default:
      return [];
  }
}

const written = [];
for (const indicator of config.indicators) {
  const rawDir = resolvePath(indicator.raw_path);
  const existing = listJsonlFiles(rawDir);
  const mode = manualBackfill || existing.length === 0 ? "backfill" : "incremental";
  const windowDays = mode === "backfill" ? indicator.historical_backfill.lookback_days : indicator.incremental_refresh.lookback_days;
  const records = sampleRecords(indicator, mode, windowDays).map((record) => ({ ...record, ingest_mode: mode, query_start_date: dateDaysAgo(windowDays) }));
  const outFile = path.join(rawDir, `${isoCompact(now)}-${process.pid}-${mode}.jsonl`);
  console.log(`[pork-ingest] ${indicator.id}: mode=${mode}, records=${records.length}, window_days=${windowDays}`);
  if (!dryRun) {
    ensureDir(rawDir);
    fs.writeFileSync(outFile, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`, { flag: "wx" });
    written.push(path.relative(repoRoot, outFile).replaceAll("\\\\", "/"));
  }
}

console.log(`[pork-ingest] completed. files_written=${written.length}`);
if (written.length) console.log(JSON.stringify(written, null, 2));
