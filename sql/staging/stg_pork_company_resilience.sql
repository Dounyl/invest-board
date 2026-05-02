-- 标准化头部猪企成本区间与现金状态披露。
CREATE OR REPLACE VIEW stg_pork_company_resilience AS
SELECT
  CAST(report_period AS VARCHAR) AS report_period,
  CAST(company_id AS VARCHAR) AS company_id,
  CAST(company_name AS VARCHAR) AS company_name,
  CAST(indicator_id AS VARCHAR) AS indicator_id,
  CAST(cost_low AS DOUBLE) AS cost_low,
  CAST(cost_high AS DOUBLE) AS cost_high,
  CAST(monetary_funds AS DOUBLE) AS monetary_funds,
  CAST(short_term_interest_bearing_debt AS DOUBLE) AS short_term_interest_bearing_debt,
  CAST(operating_cash_flow AS DOUBLE) AS operating_cash_flow,
  CAST(asset_liability_ratio AS DOUBLE) AS asset_liability_ratio,
  CAST(disclosure_basis AS VARCHAR) AS disclosure_basis,
  CAST(source_id AS VARCHAR) AS source_id,
  CAST(source_name AS VARCHAR) AS source_name,
  CAST(generated_at AS TIMESTAMP) AS generated_at,
  CAST(raw_file AS VARCHAR) AS raw_file
FROM raw_pork_records
WHERE indicator_id IN ('leading_pork_company_cost_range', 'leading_pork_company_cash_condition');
