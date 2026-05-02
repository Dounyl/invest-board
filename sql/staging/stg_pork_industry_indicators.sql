-- 标准化能繁母猪存栏、全国生猪出场价格与第三方样本监测。
CREATE OR REPLACE VIEW stg_pork_industry_indicators AS
SELECT
  CAST(period AS VARCHAR) AS period,
  CAST(indicator_id AS VARCHAR) AS indicator_id,
  CAST(indicator_name AS VARCHAR) AS indicator_name,
  CAST(value AS DOUBLE) AS value,
  CAST(unit AS VARCHAR) AS unit,
  CAST(provider AS VARCHAR) AS provider,
  CAST(provider_name AS VARCHAR) AS provider_name,
  CAST(sample_scope AS VARCHAR) AS sample_scope,
  CAST(source_id AS VARCHAR) AS source_id,
  CAST(source_name AS VARCHAR) AS source_name,
  CAST(generated_at AS TIMESTAMP) AS generated_at,
  CAST(raw_file AS VARCHAR) AS raw_file
FROM raw_pork_records
WHERE indicator_id IN ('breeding_sow_inventory', 'live_hog_ex_factory_price', 'third_party_sow_capacity_monitoring');
