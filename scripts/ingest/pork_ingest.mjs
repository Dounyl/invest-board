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
const coldStartBegin = normalizeDate(process.env.PORK_BACKFILL_START_DATE ?? "2026-01-01");

const stockSource = {
  source_id: "eastmoney_daily_kline",
  source_name: "东方财富日 K 线公开接口",
  source_authority_level: "public_market_data",
  third_party_market_data: true
};

const moaSource = {
  source_id: "mara_pig_product_monthly",
  source_name: "农业农村部生猪产品月度数据",
  source_authority_level: "official",
  third_party_market_data: false
};

const financialSource = {
  source_id: "eastmoney_financial_reports",
  source_name: "东方财富结构化财务报表",
  source_authority_level: "public_financial_data",
  third_party_market_data: true
};

function normalizeDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date.toISOString().slice(0, 10);
}

function eastmoneySecid(stockCode) {
  const [code, exchange] = stockCode.split(".");
  if (exchange === "SZ") return `0.${code}`;
  if (exchange === "SH") return `1.${code}`;
  throw new Error(`Unsupported stock code exchange: ${stockCode}`);
}

function yyyymmdd(date) {
  return date.replaceAll("-", "");
}

async function fetchJson(url) {
  return retryFetch(url, {
    headers: {
      "accept": "application/json,text/plain,*/*",
      "user-agent": "invest-board/0.1 local data pipeline"
    },
    parse: (response) => response.json()
  });
}

async function fetchText(url) {
  return retryFetch(url, {
    allowNotFound: true,
    headers: {
      "accept": "text/html,application/xhtml+xml,*/*",
      "user-agent": "invest-board/0.1 local data pipeline"
    },
    parse: (response) => response.text()
  });
}

async function retryFetch(url, { allowNotFound = false, headers, parse }) {
  const attempts = Number(process.env.PORK_FETCH_ATTEMPTS ?? 3);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(process.env.PORK_FETCH_TIMEOUT_MS ?? 20000));
    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      if (allowNotFound && response.status === 404) return null;
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      return await parse(response);
    } catch (error) {
      lastError = error;
      console.warn(`[pork-ingest] fetch attempt ${attempt}/${attempts} failed: ${error.message}; url=${url}`);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`${lastError?.message ?? "fetch failed"}; url=${url}`);
}

async function fetchEastmoneyDailyKlines(company, beginDate) {
  const params = new URLSearchParams({
    secid: eastmoneySecid(company.stock_code),
    fields1: "f1,f2,f3,f4,f5,f6",
    fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
    klt: "101",
    fqt: "0",
    beg: yyyymmdd(beginDate),
    end: "20500101"
  });
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?${params}`;
  const payload = await fetchJson(url);
  const klines = payload.data?.klines ?? [];
  return klines.map((line) => {
    const [
      trade_date,
      open_price,
      close_price,
      high_price,
      low_price,
      volume,
      turnover,
      amplitude,
      pct_change,
      price_change,
      turnover_rate
    ] = line.split(",");
    return {
      real_data: true,
      indicator_id: "leading_pork_company_stock_performance",
      indicator_name: "头部猪企股价表现",
      unit: "percent",
      company_id: company.id,
      company_name: company.name,
      stock_code: company.stock_code,
      trade_date,
      open_price: Number(open_price),
      close_price: Number(close_price),
      high_price: Number(high_price),
      low_price: Number(low_price),
      volume: Number(volume),
      turnover: Number(turnover),
      amplitude: Number(amplitude),
      pct_change: Number(pct_change),
      price_change: Number(price_change),
      turnover_rate: Number(turnover_rate),
      generated_at: generatedAt,
      query_start_date: beginDate,
      source_url: url,
      ...stockSource
    };
  });
}

function latestRawDate(rawDir, dateField) {
  const dates = [];
  for (const filePath of listJsonlFiles(rawDir)) {
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (record.real_data === true && record[dateField]) dates.push(record[dateField]);
      } catch {
        // Ignore malformed historical raw lines; quality checks can flag them separately.
      }
    }
  }
  return dates.sort().at(-1) ?? null;
}

function latestRawPeriod(rawDir, periodField) {
  return latestRawDate(rawDir, periodField);
}

function writeJsonl(rawDir, records, mode) {
  if (!records.length) return null;
  const outFile = path.join(rawDir, `${isoCompact(now)}-${process.pid}-${mode}.jsonl`);
  if (!dryRun) {
    ensureDir(rawDir);
    fs.writeFileSync(outFile, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`, { flag: "wx" });
  }
  return path.relative(repoRoot, outFile).replaceAll("\\", "/");
}

function monthsSince(startDate) {
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const cursor = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const months = [];
  while (cursor <= end) {
    months.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function stripHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;|—/g, "")
    .trim();
}

function firstNumber(value) {
  const match = String(value).replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseMoaRows(html, period, sourceUrl) {
  const rows = [];
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const rowMatch of rowMatches) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => stripHtml(cell[1]));
    if (cells.length < 3) continue;
    const [, label, value, mom, yoy] = cells;
    if (label.includes("能繁母猪存栏")) {
      rows.push({
        real_data: true,
        indicator_id: "breeding_sow_inventory",
        indicator_name: "全国能繁母猪存栏",
        unit: "ten_thousand_head",
        period,
        value: firstNumber(value),
        mom,
        yoy,
        disclosure_basis: label,
        generated_at: generatedAt,
        source_url: sourceUrl,
        ...moaSource
      });
    }
    if (label.includes("全国生猪出场价格")) {
      rows.push({
        real_data: true,
        indicator_id: "live_hog_ex_factory_price",
        indicator_name: "全国生猪出场价格",
        unit: "cny_per_kg",
        period,
        value: firstNumber(value),
        mom,
        yoy,
        disclosure_basis: label,
        generated_at: generatedAt,
        source_url: sourceUrl,
        ...moaSource
      });
    }
  }
  return rows.filter((row) => Number.isFinite(row.value));
}

async function fetchMoaMonthlyRows(beginDate) {
  const rows = [];
  for (const period of monthsSince(beginDate)) {
    const [year, month] = period.split("-");
    const url = `https://www.moa.gov.cn/ztzl/szcpxx/jdsj/${year}/${year}${month}/`;
    const html = await fetchText(url);
    if (!html) continue;
    rows.push(...parseMoaRows(html, period, url));
  }
  return rows;
}

async function fetchEastmoneyFinancialReport(reportName, stockCode) {
  const securityCode = stockCode.split(".")[0];
  const params = new URLSearchParams({
    reportName,
    columns: "ALL",
    filter: `(SECURITY_CODE="${securityCode}")`,
    pageSize: "20",
    pageNumber: "1",
    sortColumns: "REPORT_DATE",
    sortTypes: "-1"
  });
  const url = `https://datacenter-web.eastmoney.com/api/data/v1/get?${params}`;
  const payload = await fetchJson(url);
  return (payload.result?.data ?? []).map((record) => ({ ...record, source_url: url }));
}

function reportPeriod(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${date.getUTCFullYear()}Q${quarter}`;
}

function shortInterestBearingDebt(balance) {
  const value = [
    balance.SHORT_LOAN,
    balance.NONCURRENT_LIAB_1YEAR,
    balance.SHORT_BOND_PAYABLE,
    balance.SHORT_FIN_PAYABLE
  ].filter((value) => Number.isFinite(Number(value))).reduce((sum, value) => sum + Number(value), 0);
  return Number(value.toFixed(2));
}

function assetLiabilityRatio(balance) {
  if (Number.isFinite(Number(balance.DEBT_ASSET_RATIO))) return Number(balance.DEBT_ASSET_RATIO) / 100;
  if (Number.isFinite(Number(balance.TOTAL_LIABILITIES)) && Number.isFinite(Number(balance.TOTAL_ASSETS)) && Number(balance.TOTAL_ASSETS) !== 0) {
    return Number((Number(balance.TOTAL_LIABILITIES) / Number(balance.TOTAL_ASSETS)).toFixed(6));
  }
  return null;
}

async function fetchFinancialConditionRows(company, beginDate) {
  const [balances, cashflows] = await Promise.all([
    fetchEastmoneyFinancialReport("RPT_F10_FINANCE_GBALANCE", company.stock_code),
    fetchEastmoneyFinancialReport("RPT_DMSK_FN_CASHFLOW", company.stock_code)
  ]);
  const cashflowByDate = new Map(cashflows.map((record) => [String(record.REPORT_DATE).slice(0, 10), record]));
  return balances
    .filter((balance) => String(balance.REPORT_DATE).slice(0, 10) >= beginDate)
    .map((balance) => {
      const reportDate = String(balance.REPORT_DATE).slice(0, 10);
      const cashflow = cashflowByDate.get(reportDate);
      return {
        real_data: true,
        indicator_id: "leading_pork_company_cash_condition",
        indicator_name: "头部猪企现金状态",
        unit: "mixed",
        report_period: reportPeriod(balance.REPORT_DATE),
        report_date: reportDate,
        company_id: company.id,
        company_name: company.name,
        stock_code: company.stock_code,
        monetary_funds: balance.MONETARYFUNDS ?? null,
        short_term_interest_bearing_debt: shortInterestBearingDebt(balance),
        operating_cash_flow: cashflow?.NETCASH_OPERATE ?? null,
        asset_liability_ratio: assetLiabilityRatio(balance),
        disclosure_basis: `${reportPeriod(balance.REPORT_DATE)} structured financial statements`,
        generated_at: generatedAt,
        source_url: balance.source_url,
        cashflow_source_url: cashflow?.source_url ?? null,
        ...financialSource
      };
    });
}

async function ingestStockPrices(indicator) {
  const rawDir = resolvePath(indicator.raw_path);
  const latest = manualBackfill ? null : latestRawDate(rawDir, "trade_date");
  const mode = latest ? "incremental" : "backfill";
  const beginDate = latest ?? coldStartBegin;
  const records = (await fetchEastmoneyDailyKlines(config.companies.find((company) => company.id === "muyuan"), beginDate))
    .map((record) => ({
      ...record,
      indicator_id: indicator.id,
      indicator_name: indicator.name,
      unit: indicator.unit,
      ingest_mode: mode
    }));
  const written = writeJsonl(rawDir, records, mode);
  console.log(`[pork-ingest] ${indicator.id}: mode=${mode}, source=${stockSource.source_id}, records=${records.length}, begin=${beginDate}`);
  return written ? [written] : [];
}

async function ingestMoaIndicator(indicator) {
  const rawDir = resolvePath(indicator.raw_path);
  const latest = manualBackfill ? null : latestRawPeriod(rawDir, "period");
  const mode = latest ? "incremental" : "backfill";
  const beginDate = latest ? `${latest}-01` : coldStartBegin;
  const records = (await fetchMoaMonthlyRows(beginDate))
    .filter((record) => record.indicator_id === indicator.id)
    .map((record) => ({
      ...record,
      indicator_name: indicator.name,
      unit: indicator.unit,
      ingest_mode: mode,
      query_start_date: beginDate
    }));
  const written = writeJsonl(rawDir, records, mode);
  console.log(`[pork-ingest] ${indicator.id}: mode=${mode}, source=${moaSource.source_id}, records=${records.length}, begin=${beginDate}`);
  return written ? [written] : [];
}

async function ingestSectorStockPerformance(indicator) {
  const rawDir = resolvePath(indicator.raw_path);
  const latest = manualBackfill ? null : latestRawDate(rawDir, "trade_date");
  const mode = latest ? "incremental" : "backfill";
  const beginDate = latest ?? coldStartBegin;
  const batches = await Promise.all(config.companies.map((company) => fetchEastmoneyDailyKlines(company, beginDate)));
  const records = batches.flat().map((record) => ({
    ...record,
    indicator_id: indicator.id,
    indicator_name: indicator.name,
    unit: indicator.unit,
    ingest_mode: mode
  }));
  const written = writeJsonl(rawDir, records, mode);
  console.log(`[pork-ingest] ${indicator.id}: mode=${mode}, source=${stockSource.source_id}, companies=${config.companies.length}, records=${records.length}, begin=${beginDate}`);
  return written ? [written] : [];
}

async function ingestFinancialCondition(indicator) {
  const rawDir = resolvePath(indicator.raw_path);
  const latest = manualBackfill ? null : latestRawPeriod(rawDir, "report_date");
  const mode = latest ? "incremental" : "backfill";
  const beginDate = latest ?? coldStartBegin;
  const batches = await Promise.all(config.companies.map((company) => fetchFinancialConditionRows(company, beginDate)));
  const records = batches.flat().map((record) => ({
    ...record,
    indicator_id: indicator.id,
    indicator_name: indicator.name,
    unit: indicator.unit,
    ingest_mode: mode,
    query_start_date: beginDate
  }));
  const written = writeJsonl(rawDir, records, mode);
  console.log(`[pork-ingest] ${indicator.id}: mode=${mode}, source=${financialSource.source_id}, companies=${config.companies.length}, records=${records.length}, begin=${beginDate}`);
  return written ? [written] : [];
}

function skipUnsupportedRealOnly(indicator) {
  console.log(`[pork-ingest] ${indicator.id}: records=0, reason=real source adapter not implemented; no synthetic data written`);
  return [];
}

async function runIndicator(indicator, task) {
  try {
    return await task();
  } catch (error) {
    console.error(`[pork-ingest] ${indicator.id}: records=0, reason=source adapter failed; error=${error.message}`);
    console.error("[pork-ingest] source failure is non-fatal; no synthetic data written");
    return [];
  }
}

const written = [];
for (const indicator of config.indicators) {
  if (indicator.id === "muyuan_stock_price") {
    written.push(...await runIndicator(indicator, () => ingestStockPrices(indicator)));
  } else if (indicator.id === "breeding_sow_inventory" || indicator.id === "live_hog_ex_factory_price") {
    written.push(...await runIndicator(indicator, () => ingestMoaIndicator(indicator)));
  } else if (indicator.id === "leading_pork_company_stock_performance") {
    written.push(...await runIndicator(indicator, () => ingestSectorStockPerformance(indicator)));
  } else if (indicator.id === "leading_pork_company_cash_condition") {
    written.push(...await runIndicator(indicator, () => ingestFinancialCondition(indicator)));
  } else {
    written.push(...skipUnsupportedRealOnly(indicator));
  }
}

console.log(`[pork-ingest] completed. files_written=${written.length}`);
if (written.length) console.log(JSON.stringify(written, null, 2));
