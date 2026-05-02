## Purpose

Define the first version of the pork equity decision dashboard indicators, data source boundaries, company scope, and refresh behavior.

## Requirements

### Requirement: 三段加仓决策指标范围
系统 SHALL 围绕情绪低点、行业拐点和板块情绪确认三个投资决策阶段定义第一版猪肉权益看板。

#### Scenario: 推导第一版指标集合
- **WHEN** 系统定义第一版指标范围
- **THEN** 指标集合 MUST 包含牧原股价、全国能繁母猪存栏、全国生猪出场价格、头部猪企股价表现、头部猪企披露成本区间和头部猪企现金状态指标

#### Scenario: 排除非必要行业指标
- **WHEN** 系统定义第一版指标范围
- **THEN** 指标集合 MUST 排除商品猪销售均价、生猪出栏量、猪肉产量、屠宰量、饲料价格、猪粮比价、猪料比价和销售收入

### Requirement: 权威数据源边界
系统 SHALL 使用权威或官方授权来源采集第一版数据，并且 MUST NOT 使用第三方行情数据源采集股票价格。

#### Scenario: 选择股票价格来源
- **WHEN** 系统选择股票价格数据源
- **THEN** 数据源 MUST 是交易所页面或授权行情源，并且 MUST NOT 是第三方行情数据源

#### Scenario: 选择全国生猪出场价格来源
- **WHEN** 系统选择全国生猪出场价格来源
- **THEN** 第一来源 MUST 是国家发改委价格监测中心，因为它提供频率更高的周度数据

#### Scenario: 复核全国生猪价格
- **WHEN** 系统需要低频复核全国生猪价格
- **THEN** 系统 MAY 使用农业农村部月度猪产品信息作为交叉复核来源

### Requirement: 行业拐点指标
系统 SHALL 使用全国能繁母猪存栏代表官方领先供给指标，使用全国生猪出场价格代表价格确认指标，并使用第三方样本监测作为高频辅助。

#### Scenario: 展示行业拐点数据
- **WHEN** 看板展示行业拐点信息
- **THEN** 看板 MUST 同时展示全国能繁母猪存栏和全国生猪出场价格

#### Scenario: 展示第三方样本辅助
- **WHEN** 存在第三方样本能繁母猪或产能监测数据
- **THEN** 看板 MUST 将其作为样本监测或第三方口径单独展示
- **AND** 看板 MUST 标明其不属于官方绝对量口径

#### Scenario: 避免过度扩展拐点指标
- **WHEN** 看板展示行业拐点信息
- **THEN** 第一版 MUST NOT 要求生猪出栏量、猪肉产量、屠宰量、饲料价格、猪粮比价或猪料比价

### Requirement: 第三方样本产能监测
系统 SHALL 采集并导出第三方样本能繁母猪或产能监测数据，作为行业拐点的高频辅助信息。

#### Scenario: 标注第三方样本口径
- **WHEN** 系统写入第三方样本监测 raw 记录
- **THEN** 记录 MUST 包含 provider、provider_name、sample_scope、source_url、source_id、generated_at 和 unit 字段
- **AND** sample_scope MUST 明确包含第三方或样本监测含义

#### Scenario: 避免与官方口径混线
- **WHEN** 看板展示行业拐点信息
- **THEN** 第三方样本监测 MUST 使用独立图表或独立数据系列展示
- **AND** 第三方样本监测 MUST NOT 与官方能繁母猪存栏绝对量合并为同一条线

#### Scenario: 写入公开可验证数据
- **WHEN** 系统仅能获得公开转载或研报摘要数据
- **THEN** 系统 MAY 将带 source_url 的公开可验证样本记录写入 raw
- **AND** 系统 MUST NOT 为缺失月份生成合成样本数据

### Requirement: 固定头部猪企范围
系统 SHALL 使用固定的第一版头部猪企名单进行成本和现金状态对比。

#### Scenario: 定义公司范围
- **WHEN** 系统构建第一版头部猪企对比
- **THEN** 公司范围 MUST 包含牧原股份、温氏股份、新希望、天邦食品、巨星农牧、唐人神、大北农和正邦科技

#### Scenario: 第一版公司范围不可配置
- **WHEN** 第一版看板生成
- **THEN** 系统 MUST NOT 要求用户通过配置新增或删除头部猪企

### Requirement: 板块情绪加权参数
系统 SHALL 基于固定头部猪企名单计算板块情绪辅助参数，并公开计算口径。

#### Scenario: 计算公司月度动量
- **WHEN** 系统生成板块情绪确认数据
- **THEN** 每家公司记录 MUST 包含近 20 个交易日涨跌幅
- **AND** 每家公司记录 MUST 包含用于综合情绪计算的标准化权重

#### Scenario: 计算综合情绪值
- **WHEN** 系统生成板块情绪确认数据
- **THEN** 系统 MUST 输出加权情绪值、情绪标签、样本覆盖权重、上涨样本权重、公式和权重明细

#### Scenario: 展示公司价格走势
- **WHEN** 用户点击板块情绪确认表中的公司
- **THEN** 看板 MUST 展示该公司今年以来的收盘价走势
- **AND** 价格走势图 MUST 支持用户 hover 查看对应交易日的股价信息

### Requirement: 成本和现金状态对比
系统 SHALL 使用披露成本区间和原始现金状态指标比较头部猪企，并且第一版 MUST NOT 生成主观现金安全标签。

#### Scenario: 生成成本对比
- **WHEN** 系统展示头部猪企成本对比
- **THEN** 展示依据 MUST 优先使用公司披露成本区间

#### Scenario: 生成现金状态对比
- **WHEN** 系统展示头部猪企现金状态对比
- **THEN** 在数据可得时 MUST 包含货币资金、短期有息债务或一年内到期债务、经营现金流和资产负债率

#### Scenario: 格式化财务金额
- **WHEN** 页面展示货币资金、短期有息债务或经营现金流
- **THEN** 页面 MUST 使用万或亿等中文常用单位格式化金额

#### Scenario: 不生成现金安全标签
- **WHEN** 系统展示第一版现金状态对比
- **THEN** 系统 MUST NOT 生成安全、观察或紧张等派生标签

### Requirement: 财务金额可读性
系统 SHALL 以中文常用金额单位展示头部猪企财务金额字段，同时保留原始数据字段用于导出和追溯。

#### Scenario: 展示中文金额单位
- **WHEN** 看板展示货币资金、短期有息债务或经营现金流
- **THEN** 页面 MUST 将大额数值格式化为万或亿等中文常用单位

#### Scenario: 保留原始财务指标
- **WHEN** 系统导出头部猪企现金状态数据
- **THEN** 导出记录 MUST 保留货币资金、短期有息债务、经营现金流和资产负债率原始数值

### Requirement: 看板设计文档交接
系统 SHALL 在前端实现之前，将第一版页面布局和可视化细节延后到独立 Markdown 看板设计文档中定义。

#### Scenario: 准备看板设计
- **WHEN** 数据范围和指标规格被接受
- **THEN** 下一阶段 MUST 先创建 Markdown 看板设计文档，再实现 Vue 页面或 ECharts 图表

### Requirement: 历史回填和增量刷新
系统 SHALL 为每个选定指标支持冷启动历史回填，并在初始回填完成后使用定时增量刷新。

#### Scenario: 执行冷启动回填
- **WHEN** 某个选定指标没有既有 raw 数据
- **THEN** 采集流程 MUST 按配置的历史回看窗口查询数据，再生成看板导出

#### Scenario: 执行增量刷新
- **WHEN** 某个选定指标已有 raw 数据
- **THEN** 采集流程 MUST 仅按配置的增量更新窗口查询数据，除非手动请求回填

#### Scenario: raw 数据保持只追加
- **WHEN** 历史回填或增量刷新写入 raw 数据
- **THEN** 系统 MUST 追加新的 raw 记录或文件，且 MUST NOT 覆盖历史 raw 数据

#### Scenario: 第三方样本去重追加
- **WHEN** 第三方样本监测采集器写入 provider 和 period 已存在的记录
- **THEN** 增量采集 MUST 跳过该重复记录，除非用户手动请求回填
