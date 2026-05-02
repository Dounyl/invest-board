## 1. Project Foundation

- [ ] 1.1 初始化 Python 依赖文件，选择 `requirements.txt` 或 `pyproject.toml` 支持采集、转换和导出脚本运行。
- [ ] 1.2 在 `scripts/ingest/`、`scripts/transform/`、`scripts/export/` 下新增可执行入口。
- [ ] 1.3 对照 `README.md` 和 `AGENTS.md` 校验仓库目录结构与协作约束。

## 2. Ingestion Layer (Pork MVP)

- [ ] 2.1 实现 `scripts/ingest/pork_ingest.py`，支持采集猪肉相关数据并以只追加方式写入 raw 文件。
- [ ] 2.2 实现 `config/sources/pork.yml` 的数据源配置加载逻辑。
- [ ] 2.3 为采集流程增加日志和瞬时请求失败的重试行为。

## 3. DuckDB Transform and Quality

- [ ] 3.1 在 `sql/staging/` 中创建猪肉数据源标准化 SQL。
- [ ] 3.2 在 `sql/marts/` 中创建面向图表的聚合 SQL。
- [ ] 3.3 在 `sql/checks/` 中创建数据质量检查 SQL，覆盖空值、重复值和日期连续性。
- [ ] 3.4 实现转换 runner，按 staging、marts、checks 顺序执行 SQL。

## 4. Export Contract and Dashboard Consumption

- [ ] 4.1 实现 JSON 导出脚本，将稳定载荷写入 `data/export/pork/`。
- [ ] 4.2 定义并记录 `overview.json`、`timeseries.json`、`rankings.json` 的 JSON schema。
- [ ] 4.3 搭建 `web/` 应用，使用 Vite、Vue、ECharts，并提供只读数据服务抽象。
- [ ] 4.4 实现第一版猪肉看板页面，展示更新时间和数据来源声明。

## 5. Automation and Delivery

- [ ] 5.1 将 `.github/workflows/pipeline.yml` 中的占位步骤替换为真实的采集、转换和导出命令。
- [ ] 5.2 配置 GitHub Secrets 使用方式，并在缺少必要凭据时快速失败。
- [ ] 5.3 增加静态站发布步骤。
- [ ] 5.4 在 `README.md` 中补充本地运行、CI 运行和回滚的 runbook。
