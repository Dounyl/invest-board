# Invest Board

一个基于 DuckDB 的轻量投资数据看板项目。

目标：
- 用 Python 定时采集多源数据（先从猪肉数据开始）
- 在本地分析库（DuckDB）完成清洗与聚合
- 导出 JSON 给静态网站做图表展示
- 全站公开只读，无登录系统

## 当前技术路线（MVP）

- 采集与处理: Python
- 分析存储: DuckDB
- 自动化: GitHub Actions
- 前端展示: Vite + Vue + ECharts（静态部署）

## 目录结构

```text
config/                  # 数据源、指标、图表配置
data/raw/                # 原始数据（只追加）
data/warehouse/          # DuckDB 主库
data/export/             # 前端消费 JSON
sql/staging/             # 标准化 SQL
sql/marts/               # 聚合统计 SQL
sql/checks/              # 数据质量检查 SQL
scripts/ingest/          # 抓取脚本
scripts/transform/       # 清洗建模脚本
scripts/export/          # 导出脚本
web/                     # 静态图表站
.github/workflows/       # CI/CD 与定时任务
openspec/                # OpenSpec 变更管理
```

## 开发顺序（建议）

1. 先打通猪肉数据闭环：ingest -> duckdb -> export -> chart
2. 再扩展美联储/美债/加密模块
3. 最后优化告警、重试、数据质量与快照

## OpenSpec 变更

已初始化变更：
- `openspec/changes/bootstrap-invest-board-foundation/`
- `openspec/changes/add-muyuan-pork-indicators/`

当前实现优先推进猪肉权益三段加仓决策看板。

## 本地运行

当前仓库提供一套可复现的 Node stub pipeline，用于打通 raw -> warehouse -> export -> web 闭环。真实授权数据源接入后，可替换 `scripts/ingest/` 下的 loader。

```bash
node scripts/ingest/pork_ingest.mjs
node scripts/transform/pork_transform.mjs
node scripts/export/pork_export.mjs
```

也可以直接启动每日周期任务。脚本启动后会先立即跑一次，之后每 24 小时自动跑一次；如果对应 raw 目录没有数据，采集脚本会自动冷启动回填，否则执行增量刷新。

```bash
scripts/run_pork_daily.cmd
```

只跑一次用于验证：

```bash
node scripts/run_pork_daily.mjs --once
```

如需调整周期，可设置 `PORK_DAILY_INTERVAL_HOURS`：

```bash
set PORK_DAILY_INTERVAL_HOURS=24
scripts/run_pork_daily.cmd
```

如需在不污染真实 `data/` 目录的情况下验证流程，可指定临时数据根目录：

```bash
set INVEST_BOARD_DATA_ROOT=web/dist/pork-verification
node scripts/run_pork_daily.mjs --once
```

前端本地构建：

```bash
cd web
npm install
npm run build
```

## GitHub Pages 部署

仓库已提供 `.github/workflows/pipeline.yml`。推送到 `main`、手动触发 workflow，或每日定时任务都会执行：

1. `node scripts/run_pork_daily.mjs --once`
2. 复制 `data/export/` 到 `web/public/data/export/`
3. `cd web && npm ci && npm run build`
4. 将 `web/dist` 发布到 GitHub Pages

workflow 会使用 GitHub Actions cache 保存 `data/raw` 和 `data/warehouse` 状态。首次运行没有缓存时会冷启动回填；后续定时运行恢复缓存后会执行增量刷新。

首次启用时，需要在 GitHub 仓库设置中进入 `Settings -> Pages`，将 `Build and deployment` 的来源设置为 `GitHub Actions`。

## 回滚方式

- 移除 `config/pork_decision_indicators.json`、`config/exports/pork_decision_dashboard.schema.json` 以及本次新增的 pork 指标配置。
- 移除 `scripts/ingest/pork_ingest.mjs`、`scripts/transform/pork_transform.mjs`、`scripts/export/pork_export.mjs` 和共享 helper。
- 移除新增的 `sql/staging/`、`sql/marts/`、`sql/checks/` pork SQL 文件。
- 移除 `web/` 下本次新增的 Vue/Vite 看板入口。
- 移除生成的 `data/export/pork/*.json` 和 `data/warehouse/pork_decision_dashboard.json`；`data/raw/` 历史文件按只追加规则保留或由人工确认后处理。
