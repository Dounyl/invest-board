## ADDED Requirements

### Requirement: 按领域组织 raw 数据
系统 SHALL 将原始市场数据按领域组织到 `data/raw/<domain>/`，并以只追加方式保留历史快照。

#### Scenario: 保存猪肉 raw 快照
- **WHEN** 猪肉数据采集任务完成
- **THEN** 系统 MUST 在 `data/raw/pork/` 下写入新的 raw 文件，且 MUST NOT 删除或覆盖历史文件

### Requirement: 数据源配置契约
系统 SHALL 在 `config/sources/*.yml` 中定义每个数据源，并包含 `source_id`、`enabled`、`schedule`、`endpoints` 和 `storage` 字段。

#### Scenario: 加载数据源配置
- **WHEN** 新增一个 source config 文件
- **THEN** 采集层 MUST 能解析必填字段，并判断该数据源是否启用

### Requirement: 可扩展的多领域结构
系统 SHALL 在项目初始化阶段为 pork、fed、ust 和 crypto 预留一等领域路径。

#### Scenario: 新增未来 Fed 数据流水线
- **WHEN** 开发者开始实现 Fed 数据流水线
- **THEN** 仓库 SHOULD 已经包含 `config/sources/fed.yml` 和 `data/raw/fed/` 作为标准接入点
