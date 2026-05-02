# 技术归档

本文件归档 Invest Board 的技术路线、目录约定、本地运行方式和部署细节。README 仅保留项目定位、当前状态和后续计划。

## 技术路线

- 数据采集与处理：Node.js 脚本。
- 分析建模：本地文件与 SQL 分层。
- 前端展示：Vite + Vue + ECharts。
- 自动化：GitHub Actions。
- 发布方式：构建静态前端并部署到阿里云服务器。

## 目录结构

```text
config/                  # 数据源、指标、图表配置
data/raw/                # 原始数据，只追加
data/warehouse/          # 建模中间结果
data/export/             # 前端消费 JSON
sql/staging/             # 标准化 SQL
sql/marts/               # 聚合统计 SQL
sql/checks/              # 数据质量检查 SQL
scripts/ingest/          # 抓取脚本
scripts/transform/       # 清洗建模脚本
scripts/export/          # 导出脚本
web/                     # 静态图表站
.github/workflows/       # CI/CD 与部署任务
openspec/                # OpenSpec 变更管理
```

## 猪肉数据流水线

当前猪肉看板 pipeline 坚持真实数据优先：

- 股票行情通过公开行情接口冷启动抓取 2026-01-01 以来的日线数据。
- 农业农村部月度页面抓取能繁母猪存栏与生猪出场价格。
- 结构化财务报表抓取头部猪企现金状态。
- 第三方样本数据用于补充产能与行业监测信号。
- 后续运行会根据已有 raw 中的最新真实交易日、月份或报告期增量刷新。
- 尚未接入真实结构化适配器的数据源会写入 0 条并输出日志，不生成样例数据。

## 本地运行

手动跑完整猪肉数据链路：

```bash
node scripts/ingest/pork_ingest.mjs
node scripts/transform/pork_transform.mjs
node scripts/export/pork_export.mjs
```

只跑一次每日任务用于验证：

```bash
node scripts/run_pork_daily.mjs --once
```

启动每日周期任务：

```bash
scripts/run_pork_daily.cmd
```

调整周期：

```bash
set PORK_DAILY_INTERVAL_HOURS=24
scripts/run_pork_daily.cmd
```

使用临时数据根目录验证流程，避免污染真实 `data/`：

```bash
set INVEST_BOARD_DATA_ROOT=web/dist/pork-verification
node scripts/run_pork_daily.mjs --once
```

调整冷启动起始日期：

```bash
set PORK_BACKFILL_START_DATE=2026-01-01
node scripts/run_pork_daily.mjs --once
```

前端本地构建：

```bash
cd web
npm install
npm run build
```

## 阿里云部署

部署 workflow 位于 `.github/workflows/pipeline.yml`，当前名称为 `build-and-deploy-aliyun`。

触发方式：

- 推送到 `main`。
- 在 GitHub Actions 手动触发 `workflow_dispatch`。

流程：

1. 安装前端依赖。
2. 构建 `web/dist`。
3. 使用 GitHub Secrets 中的 SSH 凭据连接阿里云服务器。
4. 同步仓库代码到 `/opt/invest-board`，排除 `.git/`、`.github/`、`data/`、`web/node_modules/`、`web/dist/` 等目录。
5. 在服务器上执行 `node scripts/run_pork_daily.mjs --once`。
6. 将 `data/export/` 同步到 `/var/www/invest-board/data/export/`。
7. 将 `web/dist/` 发布到 `/var/www/invest-board/`。

## 历史说明

早期 README 曾记录 GitHub Pages 部署方案；当前已改为阿里云部署。若需要恢复 GitHub Pages，需要重新启用 Pages workflow、配置 Pages 来源，并确认数据刷新与 `data/export/` 发布路径。

## 回滚参考

如需整体回滚猪肉看板能力，可按功能边界移除：

- `config/pork_decision_indicators.json`、`config/exports/pork_decision_dashboard.schema.json` 以及相关 pork 指标配置。
- `scripts/ingest/pork_ingest.mjs`、`scripts/transform/pork_transform.mjs`、`scripts/export/pork_export.mjs` 和共享 helper。
- 新增的 `sql/staging/`、`sql/marts/`、`sql/checks/` pork SQL 文件。
- `web/` 下猪肉看板 Vue/Vite 入口。
- 生成的 `data/export/pork/*.json` 和 `data/warehouse/` 中对应结果；`data/raw/` 历史文件按只追加规则保留或由人工确认后处理。
