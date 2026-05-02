## ADDED Requirements

### Requirement: DuckDB 优先的分析流程
系统 SHALL 在生成任何前端可消费数据集之前，先通过 DuckDB 完成分析转换。

#### Scenario: 构建图表数据集
- **WHEN** 图表数据集被请求生成
- **THEN** 数据 MUST 来自 DuckDB marts，而不是由前端直接读取 raw 文件计算

### Requirement: 分层 SQL 资产
系统 SHALL 将 SQL 资产拆分到 `sql/staging/`、`sql/marts/` 和 `sql/checks/`，分别承担标准化、聚合和质量检查职责。

#### Scenario: 新增指标流水线
- **WHEN** 开发者新增一个指标流水线
- **THEN** 标准化、聚合和校验逻辑 MUST 能分别放入对应的 SQL 分层目录

### Requirement: 稳定 JSON 导出边界
系统 SHALL 将图表可直接消费的 JSON 文件导出到 `data/export/<domain>/`，并保持稳定文件契约供前端读取。

#### Scenario: 前端读取导出载荷
- **WHEN** 静态前端请求 `data/export/pork/timeseries.json`
- **THEN** 该文件 MUST 存在，并且 MUST 符合约定 schema 以支持图表渲染
