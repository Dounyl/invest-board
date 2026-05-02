<template>
  <main class="dashboard-shell">
    <section class="hero-panel">
      <p class="eyebrow">Pork Equity Decision Board</p>
      <h1>猪肉权益三段加仓决策看板</h1>
      <p class="hero-copy">围绕情绪低点、行业拐点、板块情绪确认和头部猪企韧性，保留第一版真正影响动作的指标。</p>
      <div class="hero-meta">
        <span>生成时间：{{ formatDateTime(dashboard?.generated_at) }}</span>
        <span>行情源：交易所页面或授权行情源</span>
      </div>
    </section>

    <section v-if="error" class="notice-panel">
      {{ error }}。请先运行数据导出流程生成 <code>data/export/pork/decision-dashboard.json</code>。
    </section>

    <section v-else-if="!dashboard" class="notice-panel">正在读取导出数据...</section>

    <template v-else>
      <section class="grid-layout">
        <article class="decision-card chart-card">
          <div class="card-heading">
            <p>第一段</p>
            <h2>{{ dashboard.sections.sentiment_low.title }}</h2>
            <span>{{ dashboard.sections.sentiment_low.source_notes }}</span>
          </div>
          <div ref="sentimentChart" class="chart-box"></div>
        </article>

        <article class="decision-card chart-card">
          <div class="card-heading">
            <p>第二段</p>
            <h2>{{ dashboard.sections.industry_turning_point.title }}</h2>
            <span>{{ dashboard.sections.industry_turning_point.source_notes }}</span>
          </div>
          <div ref="turningChart" class="chart-box"></div>
        </article>
      </section>

      <section class="decision-card">
        <div class="card-heading horizontal">
          <div>
            <p>第三段</p>
            <h2>{{ dashboard.sections.sector_sentiment_confirmation.title }}</h2>
          </div>
          <span>更新时间：{{ formatDateTime(dashboard.sections.sector_sentiment_confirmation.data_freshness) }}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>公司</th>
                <th>股票代码</th>
                <th>交易日</th>
                <th>涨跌幅</th>
                <th>来源</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in dashboard.sections.sector_sentiment_confirmation.rows" :key="row.company_id">
                <td>{{ row.company_name }}</td>
                <td>{{ row.stock_code }}</td>
                <td>{{ row.trade_date }}</td>
                <td>{{ row.pct_change }}%</td>
                <td>{{ row.source_name }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="decision-card">
        <div class="card-heading horizontal">
          <div>
            <p>头部猪企对比</p>
            <h2>{{ dashboard.sections.leading_company_resilience.title }}</h2>
          </div>
          <span>{{ dashboard.sections.leading_company_resilience.source_notes }}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>公司</th>
                <th>报告期</th>
                <th>成本区间</th>
                <th>货币资金</th>
                <th>短期有息债务</th>
                <th>经营现金流</th>
                <th>资产负债率</th>
                <th>披露口径</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in dashboard.sections.leading_company_resilience.rows" :key="row.company_id">
                <td>{{ row.company_name }}</td>
                <td>{{ row.report_period }}</td>
                <td>{{ row.cost_low }} - {{ row.cost_high }}</td>
                <td>{{ row.monetary_funds }}</td>
                <td>{{ row.short_term_interest_bearing_debt }}</td>
                <td>{{ row.operating_cash_flow }}</td>
                <td>{{ Math.round(row.asset_liability_ratio * 1000) / 10 }}%</td>
                <td>{{ row.disclosure_basis }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="transparency-panel">
        <h2>数据透明度</h2>
        <p>第一版不展示非必要行业指标，只保留与三段加仓动作直接相关的数据。</p>
        <p>财务与成本数据更新频率低于行情数据，页面仅展示原始披露指标，不生成派生现金标签。</p>
      </section>
    </template>
  </main>
</template>

<script setup>
import * as echarts from "echarts";
import { nextTick, onMounted, ref } from "vue";
import { formatDateTime, loadPorkDecisionDashboard } from "../services/porkDecisionData";

const dashboard = ref(null);
const error = ref("");
const sentimentChart = ref(null);
const turningChart = ref(null);

function renderCharts() {
  const sentimentRows = dashboard.value.sections.sentiment_low.series ?? [];
  const industryRows = dashboard.value.sections.industry_turning_point.series ?? [];
  const sowRows = industryRows.filter((row) => row.indicator_id === "breeding_sow_inventory");
  const priceRows = industryRows.filter((row) => row.indicator_id === "live_hog_ex_factory_price");

  echarts.init(sentimentChart.value).setOption({
    grid: { left: 42, right: 18, top: 28, bottom: 34 },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: sentimentRows.map((row) => row.trade_date) },
    yAxis: { type: "value", name: "元" },
    series: [{ name: "牧原股价", type: "line", smooth: true, data: sentimentRows.map((row) => row.close_price) }]
  });

  echarts.init(turningChart.value).setOption({
    grid: { left: 48, right: 48, top: 36, bottom: 34 },
    tooltip: { trigger: "axis" },
    legend: { data: ["能繁母猪存栏", "生猪出场价格"] },
    xAxis: { type: "category", data: [...new Set(industryRows.map((row) => row.period))] },
    yAxis: [{ type: "value" }, { type: "value" }],
    series: [
      { name: "能繁母猪存栏", type: "line", smooth: true, data: sowRows.map((row) => row.value) },
      { name: "生猪出场价格", type: "line", smooth: true, yAxisIndex: 1, data: priceRows.map((row) => row.value) }
    ]
  });
}

onMounted(async () => {
  try {
    dashboard.value = await loadPorkDecisionDashboard();
    await nextTick();
    renderCharts();
  } catch (currentError) {
    error.value = currentError.message;
  }
});
</script>
