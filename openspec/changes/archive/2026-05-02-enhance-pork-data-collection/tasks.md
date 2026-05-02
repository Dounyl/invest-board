## 1. 数据配置与来源

- [x] 1.1 在 `config/pork_decision_indicators.json` 增加第三方样本能繁母猪/产能监测指标和固定公司情绪权重
- [x] 1.2 在 `config/sources/pork.yml` 增加公开研报或第三方样本数据转载来源，并注明样本监测/第三方口径
- [x] 1.3 更新 `config/charts.yml`，将行业拐点图表定义为官方指标与第三方样本监测的多 panel 展示

## 2. 采集、转换与导出

- [x] 2.1 在 `scripts/ingest/pork_ingest.mjs` 增加第三方样本监测采集器，写入 provider、sample_scope、source_url 等字段
- [x] 2.2 确保第三方样本采集按 provider+period 去重追加，手动回填除外
- [x] 2.3 在 `scripts/transform/pork_transform.mjs` 输出行业拐点 `sample_series`
- [x] 2.4 在转换层计算近 20 个交易日涨跌幅、公司权重、板块加权情绪值和公司价格走势序列
- [x] 2.5 在 `scripts/export/pork_export.mjs` 将样本监测、板块情绪摘要和公司价格走势写入导出 JSON

## 3. SQL 质量检查

- [x] 3.1 更新 `sql/staging/stg_pork_industry_indicators.sql`，纳入第三方样本监测字段
- [x] 3.2 新增 SQL check，要求第三方样本监测记录必须包含 provider、sample_scope 和 percent 单位

## 4. 前端展示

- [x] 4.1 将行业拐点图拆分为官方能繁母猪存栏、生猪出场价格和第三方样本月环比三张图
- [x] 4.2 在板块情绪确认区域展示加权情绪值、计算口径、权重和样本覆盖信息
- [x] 4.3 将板块情绪表按情绪权重降序排列，并支持点击公司查看今年以来价格走势
- [x] 4.4 优化公司走势交互，去掉密集空心点，并支持 hover 查看当天股价信息
- [x] 4.5 将头部猪企财务金额格式化为万、亿等中文常用单位
- [x] 4.6 移除无决策价值的数据透明度面板

## 5. 验证

- [x] 5.1 运行 `node scripts/ingest/pork_ingest.mjs`，确认第三方样本 raw 文件追加成功
- [x] 5.2 运行 `node scripts/transform/pork_transform.mjs` 和 `node scripts/export/pork_export.mjs`，确认导出包含新字段
- [x] 5.3 同步 `data/export/pork/*.json` 到 `web/public/data/export/pork/` 以供本地页面验证
- [x] 5.4 运行 `npm run build`，确认前端构建通过
