-- 必填字段检查：任何导出记录都必须保留来源和生成时间。
SELECT
  indicator_id,
  COUNT(*) AS invalid_rows
FROM raw_pork_records
WHERE source_id IS NULL
   OR source_id = ''
   OR generated_at IS NULL
GROUP BY indicator_id
HAVING COUNT(*) > 0;
