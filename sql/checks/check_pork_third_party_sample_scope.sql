-- 第三方样本监测必须明确标注样本口径，避免与官方绝对量混线。
SELECT
  indicator_id,
  COUNT(*) AS invalid_rows
FROM raw_pork_records
WHERE indicator_id = 'third_party_sow_capacity_monitoring'
  AND (
    provider IS NULL
    OR provider = ''
    OR sample_scope IS NULL
    OR sample_scope NOT LIKE '%第三方%'
    OR unit <> 'percent'
  )
GROUP BY indicator_id
HAVING COUNT(*) > 0;
