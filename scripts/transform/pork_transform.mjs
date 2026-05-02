#!/usr/bin/env node
import { loadConfig, readJsonlFiles, resolvePath, writeJson } from "../lib/porkDecisionConfig.mjs";

const config = loadConfig();
const records = readJsonlFiles(resolvePath("data/raw/pork")).filter((record) => record.real_data === true);

function latestBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const current = map.get(key);
    if (!current || String(item.generated_at) >= String(current.generated_at)) map.set(key, item);
  }
  return [...map.values()];
}

function latestTradeDateByCompany(items) {
  const map = new Map();
  for (const item of items) {
    const current = map.get(item.company_id);
    if (!current || String(item.trade_date) > String(current.trade_date)) map.set(item.company_id, item);
  }
  return [...map.values()].sort((left, right) => String(left.stock_code).localeCompare(String(right.stock_code)));
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function normalizedSentimentWeights(companies) {
  const configuredTotal = companies.reduce((sum, company) => sum + Number(company.sentiment_weight ?? 0), 0);
  const fallbackWeight = companies.length ? 1 / companies.length : 0;
  return new Map(companies.map((company) => [
    company.id,
    configuredTotal > 0 ? Number(company.sentiment_weight ?? 0) / configuredTotal : fallbackWeight
  ]));
}

function oneMonthPctChange(rows, lookbackSessions = 20) {
  const sorted = [...rows].sort((left, right) => String(left.trade_date).localeCompare(String(right.trade_date)));
  const latest = sorted.at(-1);
  if (!latest || sorted.length < 2) return null;
  const base = sorted[Math.max(0, sorted.length - 1 - lookbackSessions)];
  if (!base?.close_price) return null;
  return ((latest.close_price / base.close_price) - 1) * 100;
}

function sentimentLabel(score) {
  if (!Number.isFinite(score)) return "样本不足";
  if (score >= 3) return "偏积极";
  if (score <= -3) return "偏谨慎";
  return "中性震荡";
}

function byIndicator(id) {
  return records.filter((record) => record.indicator_id === id);
}

const generatedAt = new Date().toISOString();
const stock = latestBy(byIndicator("muyuan_stock_price"), (item) => `${item.company_id}:${item.trade_date}`)
  .sort((left, right) => String(left.trade_date).localeCompare(String(right.trade_date)));
const industry = latestBy([
  ...byIndicator("breeding_sow_inventory"),
  ...byIndicator("live_hog_ex_factory_price")
], (item) => `${item.indicator_id}:${item.period}`);
const thirdPartySowCapacity = latestBy(
  byIndicator("third_party_sow_capacity_monitoring"),
  (item) => `${item.provider}:${item.period}`
).sort((left, right) => {
  const byProvider = String(left.provider).localeCompare(String(right.provider));
  if (byProvider !== 0) return byProvider;
  return String(left.period).localeCompare(String(right.period));
});
const sectorHistory = latestBy(
  byIndicator("leading_pork_company_stock_performance"),
  (item) => `${item.company_id}:${item.trade_date}`
);
const sectorByCompany = groupBy(sectorHistory, (item) => item.company_id);
const sectorWeights = normalizedSentimentWeights(config.companies);
const sector = latestTradeDateByCompany(sectorHistory).map((item) => {
  const company = config.companies.find((configCompany) => configCompany.id === item.company_id);
  const sentimentWeight = sectorWeights.get(item.company_id) ?? 0;
  return {
    ...item,
    sentiment_weight: round(sentimentWeight, 4),
    one_month_pct_change: round(oneMonthPctChange(sectorByCompany.get(item.company_id) ?? [])),
    sentiment_role: company?.role ?? "peer"
  };
});
const sectorWithMomentum = sector.filter((item) => Number.isFinite(item.one_month_pct_change));
const availableWeight = sectorWithMomentum.reduce((sum, item) => sum + item.sentiment_weight, 0);
const sectorSentimentScore = availableWeight > 0
  ? sectorWithMomentum.reduce((sum, item) => sum + item.one_month_pct_change * item.sentiment_weight, 0) / availableWeight
  : null;
const positiveWeight = availableWeight > 0
  ? sectorWithMomentum
    .filter((item) => item.one_month_pct_change > 0)
    .reduce((sum, item) => sum + item.sentiment_weight, 0) / availableWeight
  : null;
const sectorPriceSeries = [...sectorByCompany.entries()].map(([companyId, rows]) => {
  const company = config.companies.find((configCompany) => configCompany.id === companyId);
  return {
    company_id: companyId,
    company_name: company?.name ?? rows.at(-1)?.company_name ?? companyId,
    stock_code: company?.stock_code ?? rows.at(-1)?.stock_code ?? null,
    rows: rows
      .filter((row) => Number.isFinite(row.close_price))
      .sort((left, right) => String(left.trade_date).localeCompare(String(right.trade_date)))
      .map((row) => ({
        trade_date: row.trade_date,
        close_price: row.close_price,
        pct_change: row.pct_change
      }))
  };
}).sort((left, right) => String(left.stock_code).localeCompare(String(right.stock_code)));
const costs = latestBy(byIndicator("leading_pork_company_cost_range"), (item) => `${item.company_id}:${item.report_period}`);
const cash = latestBy(byIndicator("leading_pork_company_cash_condition"), (item) => `${item.company_id}:${item.report_period}`);

const cashByCompany = new Map(cash.map((item) => [item.company_id, item]));
const costByCompany = new Map(costs.map((item) => [item.company_id, item]));
const resilienceCompanyIds = [...new Set([...costByCompany.keys(), ...cashByCompany.keys()])];
const resilience = resilienceCompanyIds.map((companyId) => {
  const company = config.companies.find((item) => item.id === companyId);
  const cost = costByCompany.get(companyId);
  const cashItem = cashByCompany.get(companyId);
  return {
    company_id: companyId,
    company_name: cost?.company_name ?? cashItem?.company_name ?? company?.name ?? companyId,
    report_period: cost?.report_period ?? cashItem?.report_period ?? null,
    cost_low: cost?.cost_low ?? null,
    cost_high: cost?.cost_high ?? null,
    monetary_funds: cashItem?.monetary_funds ?? null,
    short_term_interest_bearing_debt: cashItem?.short_term_interest_bearing_debt ?? null,
    operating_cash_flow: cashItem?.operating_cash_flow ?? null,
    asset_liability_ratio: cashItem?.asset_liability_ratio ?? null,
    disclosure_basis: [cost?.disclosure_basis, cashItem?.disclosure_basis].filter(Boolean).join("; "),
    source_id: [cost?.source_id, cashItem?.source_id].filter(Boolean).join(";"),
    generated_at: [cost?.generated_at, cashItem?.generated_at].filter(Boolean).sort().at(-1) ?? generatedAt
  };
});

const mart = {
  schema_version: "v1",
  generated_at: generatedAt,
  source_policy: config.source_policy,
  excluded_first_version_metrics: config.excluded_first_version_metrics,
  sections: {
    sentiment_low: {
      title: "情绪低点",
      description: "观察牧原股份股价是否进入低情绪区域。",
      data_freshness: stock.at(-1)?.generated_at ?? null,
      source_notes: "股票行情仅允许交易所页面或授权行情源。",
      series: stock
    },
    industry_turning_point: {
      title: "行业拐点",
      description: "用能繁母猪存栏作为供给领先指标，用全国生猪出场价格做价格确认。",
      data_freshness: [...industry, ...thirdPartySowCapacity].map((item) => item.generated_at).sort().at(-1) ?? null,
      source_notes: "官方存栏与价格数据用于主判断；第三方样本监测仅做高频辅助，不与官方绝对量混线。",
      sample_notes: "样本监测/第三方：上海钢联/Mysteel、卓创资讯、涌益咨询等公开转载口径，展示样本能繁母猪存栏月环比。",
      series: industry,
      sample_series: thirdPartySowCapacity
    },
    sector_sentiment_confirmation: {
      title: "板块情绪确认",
      description: "观察头部猪企股价表现是否从个股信号扩散到板块信号。",
      data_freshness: sector.map((item) => item.generated_at).sort().at(-1) ?? null,
      source_notes: "仅使用固定第一版头部猪企名单。",
      sentiment: {
        metric_name: "养殖板块加权情绪值",
        score: round(sectorSentimentScore),
        label: sentimentLabel(sectorSentimentScore),
        positive_weight: round(positiveWeight == null ? null : positiveWeight * 100),
        available_weight: round(availableWeight * 100),
        lookback_sessions: 20,
        formula: "Σ(标准化公司权重 × 近20交易日涨跌幅)",
        evaluation: "综合值为正代表样本股票近20交易日加权上涨、板块风险偏好改善；为负代表加权下跌、情绪偏谨慎。绝对值达到3个百分点以上时标记为偏积极或偏谨慎。",
        weights: config.companies.map((company) => ({
          company_id: company.id,
          company_name: company.name,
          stock_code: company.stock_code,
          weight: round(sectorWeights.get(company.id) * 100)
        }))
      },
      price_series: sectorPriceSeries,
      rows: sector
    },
    leading_company_resilience: {
      title: "头部猪企成本与现金状态对比",
      description: "展示披露成本区间和原始现金状态指标，不生成主观现金安全标签。",
      data_freshness: resilience.map((item) => item.generated_at).sort().at(-1) ?? null,
      source_notes: "财务与成本数据来自公司公告或定期报告，频率低于行情数据。",
      rows: resilience
    }
  }
};

writeJson("data/warehouse/pork_decision_dashboard.json", mart);
console.log(`[pork-transform] records=${records.length}, sections=${Object.keys(mart.sections).length}`);
console.log("[pork-transform] wrote data/warehouse/pork_decision_dashboard.json");
