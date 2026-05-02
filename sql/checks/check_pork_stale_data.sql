-- 陈旧数据检查：低频财务数据允许较长窗口，行情与周度行业数据需要更高新鲜度。
SELECT
  indicator_id,
  MAX(CAST(generated_at AS TIMESTAMP)) AS latest_generated_at
FROM raw_pork_records
GROUP BY indicator_id;
