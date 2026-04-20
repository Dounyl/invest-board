## Context

该变更用于建立 Invest Board 的第一版工程基础，当前仓库缺少统一目录约定、数据流契约与协作约束，导致后续实现无法并行推进。项目约束为无自有服务器、公开只读访问、优先静态部署，MVP 先覆盖猪肉数据，但架构需可扩展至美联储、美债和加密数据。

## Goals / Non-Goals

**Goals:**
- 建立可扩展的目录结构，明确 `raw -> warehouse -> export -> web` 数据路径。
- 建立文档与协作规则，统一 Agent 行为与提交边界。
- 定义静态公开看板的实现边界，避免引入账号系统和动态写接口。
- 为后续自动化（定时采集、转换、导出、发布）预留标准入口。

**Non-Goals:**
- 不在本变更内实现具体抓取逻辑和完整图表页面。
- 不引入后端 API 服务或数据库在线写入接口。
- 不解决数据源授权与业务口径争议，仅定义技术骨架。

## Decisions

### Decision 1: 采用 DuckDB 离线分析 + JSON 导出
- Rationale: 满足轻量部署与快速统计，避免在线数据库运维；JSON 可直接供静态前端消费。
- Alternatives considered:
  - 纯 CSV 直接前端读取：简单但聚合逻辑分散，难保证一致性。
  - 托管数据库 + API：扩展性高但超出当前“无服务器”目标复杂度。

### Decision 2: 目录按能力分层而非按脚本零散组织
- Rationale: 将配置、原始数据、SQL、导出、前端分层，便于多数据域扩展与责任划分。
- Alternatives considered:
  - 按脚本文件堆叠：起步快但后期维护困难，数据契约不清晰。

### Decision 3: 前端采用静态站路线并保持公开只读
- Rationale: 符合公开展示目标，降低安全与运维成本。
- Alternatives considered:
  - 加登录后台：可控性更高，但增加权限和审计成本，与当前目标冲突。

### Decision 4: 通过 AGENTS.md 固化协作边界
- Rationale: 让人机协作在数据安全、路径约束、质量门禁上保持一致。
- Alternatives considered:
  - 仅口头约定：容易漂移，执行不稳定。

## Risks / Trade-offs

- [Risk] 导出 JSON 口径与 DuckDB 查询不一致 → Mitigation: 每个 mart 对应一个导出定义，并在 checks 中加入一致性校验。
- [Risk] 多数据域扩展后目录膨胀 → Mitigation: 统一 `config/sources/*.yml` 与 `data/raw/<domain>/` 命名规范。
- [Risk] 静态站无法满足未来交互需求 → Mitigation: 当前保留 `web/src/services` 抽象层，后续可平滑接 API。
- [Risk] CI 定时任务失败不可见 → Mitigation: 在后续实现中增加失败通知与重试策略。

## Migration Plan

1. 保持当前基础结构提交到主干，作为后续实现基线。
2. 在实现阶段逐步替换占位脚本和工作流步骤，不改变目录契约。
3. 若回滚，删除新增目录和文档即可恢复到初始化状态，无数据迁移影响。

## Open Questions

- 猪肉数据的首选权威数据源与更新频率最终值。
- 导出 JSON 是否需要版本字段和兼容策略（如 `schema_version`）。
- 静态站托管平台最终选择（CloudBase Hosting 或 COS）。
