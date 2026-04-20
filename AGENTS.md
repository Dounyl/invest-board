# Agent Rules For Invest Board

本文件定义协作 Agent 的执行约束。

## 1. 工作范围

允许改动：
- `config/`
- `scripts/`
- `sql/`
- `web/`
- `.github/workflows/`
- `README.md`

谨慎改动：
- `openspec/`（仅在需求澄清或流程推进时）

## 2. 数据规则

- 原始数据必须先落到 `data/raw/<domain>/`
- `data/raw/` 采用只追加策略，不覆盖历史
- 禁止前端直接使用 raw 数据
- 前端仅可读取 `data/export/` 下 JSON

## 3. 安全规则

- 严禁提交任何密钥或账号信息
- 所有凭据放在 GitHub Secrets
- 公开站点保持只读，不引入登录或写接口

## 4. 质量规则

新增数据源时至少补充：
- 1 个 `sql/staging/*.sql`
- 1 个 `sql/marts/*.sql`
- 1 个 `sql/checks/*.sql`
- 1 个导出 JSON 定义（对应 `config/charts.yml`）

## 5. 提交流程

每次改动至少包含：
- 变更目的
- 影响范围
- 回滚方式

## 6. 默认优先级

1. 可复现
2. 可观测（有日志/错误信息）
3. 可恢复（失败可重试、可回滚）
4. 再做复杂优化
