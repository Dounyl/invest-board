# 猪肉权益三段加仓决策看板设计

## 目标

第一版看板只服务一个问题：牧原股份与猪肉养殖板块是否进入可分批加仓的观察区间。页面按动作组织，而不是按数据源组织。

## 信息架构

### 1. 情绪低点

目的：观察牧原股份是否已经进入低情绪区域。

字段：
- `trade_date`
- `stock_code`
- `close_price`
- `pct_change`
- `source_id`
- `generated_at`

展示：
- 牧原股价时间序列
- 最近交易日价格和更新时间
- 来源说明：交易所页面或授权行情源

### 2. 行业拐点

目的：用供给领先指标和价格确认指标共同判断周期是否开始变化。

字段：
- 全国能繁母猪存栏：`period`、`value`、`unit`、`source_id`
- 全国生猪出场价格：`period`、`value`、`unit`、`source_id`
- `generated_at`

展示：
- 能繁母猪存栏趋势
- 生猪出场价格趋势
- 二者的最近数据期和来源

### 3. 板块情绪确认

目的：观察头部猪企股价表现是否从个股信号扩散到板块信号。

字段：
- `trade_date`
- `company_id`
- `company_name`
- `stock_code`
- `pct_change`
- `source_id`
- `generated_at`

展示：
- 头部猪企涨跌幅表格
- 只展示固定第一版公司名单

### 4. 头部猪企成本与现金状态对比

目的：比较谁更能扛过周期低谷，但不生成主观安全标签。

字段：
- 成本：`company_id`、`company_name`、`cost_low`、`cost_high`、`report_period`、`disclosure_basis`
- 现金状态：`monetary_funds`、`short_term_interest_bearing_debt`、`operating_cash_flow`、`asset_liability_ratio`、`report_period`
- 来源：`source_id`、`generated_at`

展示：
- 成本区间表格
- 现金状态表格
- 低频财务数据提示

## 第一版排除指标

第一版不展示商品猪销售均价、生猪出栏量、猪肉产量、屠宰量、饲料价格、猪粮比价、猪料比价和销售收入。

## 数据透明度

每个分区必须展示：
- 最新数据期
- 生成时间
- 来源名称
- 低频财务数据提示（如适用）

## JSON 契约

第一版主载荷为 `data/export/pork/decision-dashboard.json`，同时可派生：
- `data/export/pork/overview.json`
- `data/export/pork/timeseries.json`
- `data/export/pork/rankings.json`

## 回滚

回滚时移除新增指标配置、raw 子路径、SQL、导出 JSON 和前端入口即可。raw 历史数据不覆盖、不重写。
