-- 标准化牧原与头部猪企股价 raw 数据。
CREATE OR REPLACE VIEW stg_pork_stock_prices AS
SELECT
  CAST(trade_date AS DATE) AS trade_date,
  CAST(company_id AS VARCHAR) AS company_id,
  CAST(company_name AS VARCHAR) AS company_name,
  CAST(stock_code AS VARCHAR) AS stock_code,
  CAST(close_price AS DOUBLE) AS close_price,
  CAST(pct_change AS DOUBLE) AS pct_change,
  CAST(source_id AS VARCHAR) AS source_id,
  CAST(source_name AS VARCHAR) AS source_name,
  CAST(generated_at AS TIMESTAMP) AS generated_at,
  CAST(raw_file AS VARCHAR) AS raw_file
FROM raw_pork_records
WHERE indicator_id IN ('muyuan_stock_price', 'leading_pork_company_stock_performance');
