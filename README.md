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

当前进度：`0/4` artifacts。
先从 `proposal` 开始。

## 快速开始（占位）

后续会补充：
- Python 环境初始化命令
- 本地跑全链路命令
- 前端本地开发命令
- CI 环境变量说明
