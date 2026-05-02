## Context

该变更用于建立 Invest Board 的第一版工程基础。当前仓库缺少统一目录约定、数据流契约与协作约束，导致后续数据源、SQL、导出和前端实现难以并行推进。

项目约束是无自有服务器、公开只读访问、优先静态部署。MVP 先覆盖猪肉数据，但目录和契约需要预留扩展到美联储、美债和加密数据的路径。

## Goals / Non-Goals

**Goals:**

- 建立可扩展的目录结构，明确 `raw -> warehouse -> export -> web` 数据路径。
- 建立文档与协作规则，统一 Agent 行为、数据安全和提交边界。
- 定义静态公开看板的实现边界，避免引入账号系统和动态写接口。
- 为后续自动化采集、转换、导出和发布预留标准入口。

**Non-Goals:**

- 不在本变更内实现具体抓取逻辑和完整图表页面。
- 不引入后端 API 服务或在线数据库写入接口。
- 不解决数据源授权与业务口径争议，仅定义技术骨架。

## Decisions

### Decision 1: 采用 DuckDB 离线分析 + JSON 导出

Rationale: 该路线满足轻量部署和快速统计需求，避免在线数据库运维；导出的 JSON 可以直接供静态前端消费，并且更容易做版本化与回滚。

Alternatives considered:
- 纯 CSV 直接前端读取：起步简单，但聚合逻辑会分散到前端，难以保证口径一致。
- 托管数据库 + API：扩展性更高，但超出当前无服务器目标，安全与运维成本也更高。

### Decision 2: 目录按数据流能力分层，而不是按脚本零散组织

Rationale: 将配置、原始数据、SQL、导出和前端分层，可以让新增数据域时复用同一套路径与职责边界。

Alternatives considered:
- 按脚本文件堆叠：起步快，但后期维护困难，数据契约不清晰。
- 按单个业务主题聚合所有文件：短期直观，但多数据域扩展后容易互相污染。

### Decision 3: 前端采用静态站路线并保持公开只读

Rationale: 当前目标是公开展示投资观察面板，静态站能降低安全和运维成本，也符合禁止公开写接口的约束。

Alternatives considered:
- 加登录后台：权限可控性更强，但会引入认证、审计和密钥管理成本，与当前阶段目标冲突。
- 提供动态 API：交互能力更强，但会扩大攻击面并增加部署复杂度。

### Decision 4: 通过 `AGENTS.md` 固化协作边界

Rationale: 数据目录、凭据处理、前端读取边界和质量门禁都需要稳定约束，写入 `AGENTS.md` 可以让后续人机协作更一致。

Alternatives considered:
- 仅口头约定：容易漂移，执行不稳定。
- 分散写入多个 README：上下文割裂，Agent 执行时容易遗漏。

## Risks / Trade-offs

- [Risk] 导出 JSON 口径与 DuckDB 查询不一致 -> Mitigation: 每个 mart 对应一个导出定义，并在 `sql/checks/` 中加入一致性校验。
- [Risk] 多数据域扩展后目录膨胀 -> Mitigation: 统一 `config/sources/*.yml` 与 `data/raw/<domain>/` 命名规范。
- [Risk] 静态站无法满足未来交互需求 -> Mitigation: 当前保留 `web/src/services` 抽象层，后续可平滑接入 API。
- [Risk] CI 定时任务失败不可见 -> Mitigation: 后续实现中增加日志、失败提示和可重试入口。

## Migration Plan

1. 将当前基础结构提交到主干，作为后续实现基线。
2. 在实现阶段逐步替换占位脚本和工作流步骤，不改变目录契约。
3. 若需要回滚，删除新增目录、占位文件和文档即可恢复到初始化状态，无数据迁移影响。

## Open Questions

- 猪肉数据的首选权威数据源与更新频率最终值。
- 导出 JSON 是否需要版本字段和兼容策略，例如 `schema_version`。
- 静态站托管平台最终选择 CloudBase Hosting、COS 或其他静态托管方案。
