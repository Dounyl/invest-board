-- 第一版猪肉权益三段加仓决策 mart。
CREATE OR REPLACE VIEW mart_pork_decision_dashboard AS
SELECT
  'sentiment_low' AS section_id,
  '牧原股价' AS section_name,
  MAX(generated_at) AS generated_at,
  COUNT(*) AS record_count
FROM stg_pork_stock_prices
WHERE indicator_id = 'muyuan_stock_price'
UNION ALL
SELECT
  'industry_turning_point' AS section_id,
  '行业拐点' AS section_name,
  MAX(generated_at) AS generated_at,
  COUNT(*) AS record_count
FROM stg_pork_industry_indicators
UNION ALL
SELECT
  'sector_sentiment_confirmation' AS section_id,
  '板块情绪确认' AS section_name,
  MAX(generated_at) AS generated_at,
  COUNT(*) AS record_count
FROM stg_pork_stock_prices
WHERE indicator_id = 'leading_pork_company_stock_performance'
UNION ALL
SELECT
  'leading_company_resilience' AS section_id,
  '头部猪企成本与现金状态' AS section_name,
  MAX(generated_at) AS generated_at,
  COUNT(*) AS record_count
FROM stg_pork_company_resilience;
