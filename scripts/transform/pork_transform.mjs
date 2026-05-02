#!/usr/bin/env node
import { loadConfig, readJsonlFiles, resolvePath, writeJson } from "../lib/porkDecisionConfig.mjs";

const config = loadConfig();
const records = readJsonlFiles(resolvePath("data/raw/pork"));

function latestBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    const current = map.get(key);
    if (!current || String(item.generated_at) >= String(current.generated_at)) map.set(key, item);
  }
  return [...map.values()];
}

function byIndicator(id) {
  return records.filter((record) => record.indicator_id === id);
}

const generatedAt = new Date().toISOString();
const stock = latestBy(byIndicator("muyuan_stock_price"), (item) => `${item.company_id}:${item.trade_date}`);
const industry = latestBy([
  ...byIndicator("breeding_sow_inventory"),
  ...byIndicator("live_hog_ex_factory_price")
], (item) => `${item.indicator_id}:${item.period}`);
const sector = latestBy(byIndicator("leading_pork_company_stock_performance"), (item) => `${item.company_id}:${item.trade_date}`);
const costs = latestBy(byIndicator("leading_pork_company_cost_range"), (item) => `${item.company_id}:${item.report_period}`);
const cash = latestBy(byIndicator("leading_pork_company_cash_condition"), (item) => `${item.company_id}:${item.report_period}`);

const cashByCompany = new Map(cash.map((item) => [item.company_id, item]));
const resilience = costs.map((cost) => ({
  company_id: cost.company_id,
  company_name: cost.company_name,
  report_period: cost.report_period,
  cost_low: cost.cost_low,
  cost_high: cost.cost_high,
  monetary_funds: cashByCompany.get(cost.company_id)?.monetary_funds ?? null,
  short_term_interest_bearing_debt: cashByCompany.get(cost.company_id)?.short_term_interest_bearing_debt ?? null,
  operating_cash_flow: cashByCompany.get(cost.company_id)?.operating_cash_flow ?? null,
  asset_liability_ratio: cashByCompany.get(cost.company_id)?.asset_liability_ratio ?? null,
  disclosure_basis: cost.disclosure_basis,
  source_id: [cost.source_id, cashByCompany.get(cost.company_id)?.source_id].filter(Boolean).join(";"),
  generated_at: [cost.generated_at, cashByCompany.get(cost.company_id)?.generated_at].filter(Boolean).sort().at(-1) ?? generatedAt
}));

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
      data_freshness: industry.map((item) => item.generated_at).sort().at(-1) ?? null,
      source_notes: "全国生猪出场价格第一来源为国家发改委价格监测中心；农业农村部月度数据可做复核。",
      series: industry
    },
    sector_sentiment_confirmation: {
      title: "板块情绪确认",
      description: "观察头部猪企股价表现是否从个股信号扩散到板块信号。",
      data_freshness: sector.map((item) => item.generated_at).sort().at(-1) ?? null,
      source_notes: "仅使用固定第一版头部猪企名单。",
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
