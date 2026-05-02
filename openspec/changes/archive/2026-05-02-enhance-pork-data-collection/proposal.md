## Why

当前看板已经能展示第一版猪肉权益决策指标，但行业拐点和板块情绪判断仍缺少高频辅助数据、可追溯的股票走势明细和更直观的财务压力口径。现在需要把这些已验证的页面调整沉淀为正式数据收集与展示能力，尤其要确保第三方样本监测与官方统计口径分离，避免误读。

## What Changes

- 新增第三方样本能繁母猪/产能监测采集，覆盖上海钢联/Mysteel、卓创资讯、涌益咨询等公开转载口径，并明确标注为“样本监测/第三方”。
- 行业拐点展示拆分为官方能繁母猪存栏、全国生猪出场价格和第三方样本月环比三类图表，不再把不同口径混成一条线。
- 板块情绪确认新增近 20 个交易日涨跌幅、固定公司权重、加权情绪值和公司今年以来价格走势明细。
- 头部猪企财务展示继续使用原始披露指标，但金额以中文常用的万、亿单位展示，并为后续现金覆盖短债等压力指标留出口径。
- 移除无决策价值的解释性面板，减少页面干扰。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `pork-equity-decision-indicators`: 扩展猪肉权益决策指标的数据收集、口径标注、板块情绪计算和看板展示要求。

## Impact

- 配置：`config/pork_decision_indicators.json`、`config/sources/pork.yml`、`config/charts.yml`
- 采集与转换：`scripts/ingest/pork_ingest.mjs`、`scripts/transform/pork_transform.mjs`、`scripts/export/pork_export.mjs`
- SQL：`sql/staging/stg_pork_industry_indicators.sql`、`sql/checks/*.sql`
- 前端：`web/src/pages/PorkDecisionDashboard.vue`、`web/src/styles.css`
- 导出数据：`data/export/pork/*.json`、`web/public/data/export/pork/*.json`
