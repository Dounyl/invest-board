-- 重复期间检查：同一指标、实体、期间不应出现重复规范化记录。
SELECT
  indicator_id,
  COALESCE(company_id, 'market') AS entity_id,
  COALESCE(trade_date, period, report_period) AS data_period,
  COUNT(*) AS duplicate_count
FROM raw_pork_records
GROUP BY indicator_id, COALESCE(company_id, 'market'), COALESCE(trade_date, period, report_period)
HAVING COUNT(*) > 1;
