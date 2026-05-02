## Why

当前仓库缺少可执行的项目骨架与统一规范，无法稳定地把投资相关数据从采集、分析到公开展示串成一个可复用流程。需要先建立一个轻量、无自有服务器依赖的基础架构，以猪肉数据为 MVP，并保留扩展到美联储、美债和加密数据的路径。

## What Changes

- 建立面向多数据域的目录结构与配置约定，覆盖 `raw -> warehouse -> export -> web` 数据流。
- 定义并落地项目基础文档：`README.md`、`AGENTS.md`、`.gitignore`，统一协作与提交规范。
- 初始化静态看板技术路线约束：DuckDB 离线分析、JSON 导出、静态网站公开只读展示。
- 新增 CI 占位流程，明确后续定时采集、转换、导出的执行阶段。

## Capabilities

### New Capabilities

- `market-data-ingestion-layout`: 定义可扩展的数据源配置与原始数据落盘结构，支持按领域逐步接入。
- `duckdb-analytics-export`: 定义 DuckDB 分析层与导出层契约，支持为图表生成稳定 JSON 产物。
- `public-readonly-dashboard`: 定义公开只读看板的前端与发布边界，不引入登录与写接口。

### Modified Capabilities

无。

## Impact

- 影响代码范围：`config/`、`data/`、`sql/`、`scripts/`、`web/`、`.github/workflows/`。
- 影响文档范围：`README.md`、`AGENTS.md`、`.gitignore`。
- 影响系统：OpenSpec 变更工作流，以及后续 GitHub Actions 自动化流程。
- 依赖变化：后续实现阶段将引入 Python 依赖、DuckDB、Vite、Vue 和 ECharts。
- 回滚方式：删除本变更新增的基础目录、占位脚本、CI 配置和文档即可恢复到初始化前状态；当前阶段不涉及数据迁移。
