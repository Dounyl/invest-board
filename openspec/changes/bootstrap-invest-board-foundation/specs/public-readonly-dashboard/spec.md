## ADDED Requirements

### Requirement: 公开只读交付
系统 SHALL 将看板内容发布为公开只读静态站点，并且 SHALL NOT 要求访问者登录后才能查看。

#### Scenario: 访客打开看板
- **WHEN** 未登录访客访问看板 URL
- **THEN** 访客 MUST 能直接查看图表和表格，无需登录

### Requirement: 不暴露写接口
系统 SHALL 避免在看板表面暴露任何公开写 API、管理端点或可变后端路由。

#### Scenario: 检查看板部署表面
- **WHEN** 站点完成部署
- **THEN** 公开访问面 MUST 仅包含静态资源和只读数据文件

### Requirement: 数据透明标记
系统 SHALL 在看板页面展示数据新鲜度和来源说明。

#### Scenario: 渲染看板页头
- **WHEN** 首页加载
- **THEN** 页面 MUST 显示最后更新时间和数据来源声明
