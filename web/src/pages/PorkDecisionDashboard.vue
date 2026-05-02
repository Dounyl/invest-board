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
        <article class="decision-card chart-card sentiment-card">
          <div class="card-heading">
            <p>第一段</p>
            <h2>{{ dashboard.sections.sentiment_low.title }}</h2>
            <span>{{ dashboard.sections.sentiment_low.source_notes }}</span>
          </div>
          <div ref="sentimentChart" class="chart-box"></div>
        </article>

        <article class="decision-card chart-card industry-card">
          <div class="card-heading">
            <p>第二段</p>
            <h2>{{ dashboard.sections.industry_turning_point.title }}</h2>
            <span>{{ dashboard.sections.industry_turning_point.source_notes }}</span>
          </div>
          <div class="chart-stack">
            <div ref="turningSowChart" class="chart-box compact"></div>
            <div ref="turningPriceChart" class="chart-box compact"></div>
            <div ref="thirdPartySampleChart" class="chart-box compact"></div>
          </div>
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
        <div class="sentiment-summary">
          <div class="sentiment-score">
            <span>{{ sectorSentiment.metric_name }}</span>
            <strong>{{ formatSignedPercent(sectorSentiment.score) }}</strong>
            <em>{{ sectorSentiment.label }}</em>
          </div>
          <div class="sentiment-notes">
            <p>{{ sectorSentiment.evaluation }}</p>
            <p>评估口径：{{ sectorSentiment.formula }}；样本覆盖权重 {{ formatPlainPercent(sectorSentiment.available_weight) }}，上涨样本权重 {{ formatPlainPercent(sectorSentiment.positive_weight) }}。</p>
            <p>权重：{{ formatWeights(sectorSentiment.weights) }}</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>公司</th>
                <th>股票代码</th>
                <th>交易日</th>
                <th>当日涨跌幅</th>
                <th>一个月涨跌幅</th>
                <th>情绪权重</th>
                <th>来源</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in sortedSectorRows" :key="row.company_id">
                <td>
                  <button
                    class="company-link"
                    type="button"
                    :class="{ active: selectedSectorCompanyId === row.company_id }"
                    @click="selectSectorCompany(row.company_id)"
                  >
                    {{ row.company_name }}
                  </button>
                </td>
                <td>{{ row.stock_code }}</td>
                <td>{{ row.trade_date }}</td>
                <td>{{ formatSignedPercent(row.pct_change) }}</td>
                <td>{{ formatSignedPercent(row.one_month_pct_change) }}</td>
                <td>{{ formatPlainPercent(row.sentiment_weight * 100) }}</td>
                <td>{{ row.source_name }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="sector-price-panel">
          <div class="sector-price-heading">
            <div>
              <p>公司走势</p>
              <h3>{{ selectedSectorCompany?.company_name ?? "选择公司" }} 今年以来股价</h3>
            </div>
            <span>{{ selectedSectorCompany?.stock_code ?? "点击表格公司查看" }}</span>
          </div>
          <div
            class="sector-price-frame"
            @mousemove="showSectorPriceTooltip"
            @mouseleave="hideSectorPriceTooltip"
          >
            <div ref="sectorPriceChart" class="chart-box sector-price-chart"></div>
            <div
              v-if="sectorPriceTooltip.show"
              class="sector-price-tooltip"
              :style="{ left: `${sectorPriceTooltip.x}px`, top: `${sectorPriceTooltip.y}px` }"
            >
              <strong>{{ sectorPriceTooltip.title }}</strong>
              <span>收盘价：{{ sectorPriceTooltip.price }} 元</span>
              <span>当日涨跌幅：{{ sectorPriceTooltip.change }}</span>
            </div>
          </div>
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
                <td>{{ formatChineseAmount(row.monetary_funds) }}</td>
                <td>{{ formatChineseAmount(row.short_term_interest_bearing_debt) }}</td>
                <td>{{ formatChineseAmount(row.operating_cash_flow) }}</td>
                <td>{{ Math.round(row.asset_liability_ratio * 1000) / 10 }}%</td>
                <td>{{ row.disclosure_basis }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup>
import * as echarts from "echarts";
import { computed, nextTick, onMounted, ref } from "vue";
import { formatDateTime, loadPorkDecisionDashboard } from "../services/porkDecisionData";

const dashboard = ref(null);
const error = ref("");
const sentimentChart = ref(null);
const turningSowChart = ref(null);
const turningPriceChart = ref(null);
const thirdPartySampleChart = ref(null);
const sectorPriceChart = ref(null);
const sectorPriceChartInstance = ref(null);
const selectedSectorCompanyId = ref("");
const sectorPriceTooltip = ref({
  show: false,
  x: 0,
  y: 0,
  title: "",
  price: "",
  change: ""
});
const sectorSentiment = computed(() => dashboard.value?.sections?.sector_sentiment_confirmation?.sentiment ?? {
  metric_name: "养殖板块加权情绪值",
  score: null,
  label: "暂无",
  available_weight: null,
  positive_weight: null,
  formula: "Σ(标准化公司权重 × 近20交易日涨跌幅)",
  evaluation: "等待转换流程生成板块情绪参数。",
  weights: []
});
const sortedSectorRows = computed(() => {
  const rows = dashboard.value?.sections?.sector_sentiment_confirmation?.rows ?? [];
  return [...rows].sort((left, right) => {
    const byWeight = Number(right.sentiment_weight ?? 0) - Number(left.sentiment_weight ?? 0);
    if (byWeight !== 0) return byWeight;
    return String(left.stock_code).localeCompare(String(right.stock_code));
  });
});
const selectedSectorCompany = computed(() => {
  const series = dashboard.value?.sections?.sector_sentiment_confirmation?.price_series ?? [];
  return series.find((item) => item.company_id === selectedSectorCompanyId.value) ?? series[0] ?? null;
});

function renderCharts() {
  const sentimentRows = dashboard.value.sections.sentiment_low.series ?? [];
  const industryRows = dashboard.value.sections.industry_turning_point.series ?? [];
  const sampleRows = dashboard.value.sections.industry_turning_point.sample_series ?? [];
  const sowRows = industryRows
    .filter((row) => row.indicator_id === "breeding_sow_inventory")
    .sort((current, next) => current.period.localeCompare(next.period));
  const priceRows = industryRows
    .filter((row) => row.indicator_id === "live_hog_ex_factory_price")
    .sort((current, next) => current.period.localeCompare(next.period));
  const sowTarget = 3900;
  const sowWarning = {
    redLow: sowTarget * 0.85,
    yellowLow: sowTarget * 0.92,
    greenHigh: sowTarget * 1.05,
    yellowHigh: sowTarget * 1.1
  };

  echarts.init(sentimentChart.value).setOption({
    grid: { left: 42, right: 18, top: 28, bottom: 34 },
    tooltip: {
      trigger: "axis",
      triggerOn: "mousemove|click",
      confine: true,
      axisPointer: { type: "line", snap: true },
      formatter(params) {
        const point = Array.isArray(params) ? params[0] : params;
        const row = point?.data?.row ?? tooltipRow(sentimentRows, point, "trade_date");
        if (!row) return "";
        return [
          `牧原股份 ${row.trade_date}`,
          `收盘价：${formatPrice(row.close_price)} 元`,
          `当日涨跌幅：${formatSignedPercent(row.pct_change)}`
        ].join("<br/>");
      }
    },
    xAxis: { type: "category", data: sentimentRows.map((row) => row.trade_date), axisLabel: { hideOverlap: true } },
    yAxis: { type: "value", name: "元" },
    series: [
      {
        name: "牧原股价",
        type: "line",
        smooth: true,
        data: sentimentRows.map((row) => ({ value: row.close_price, row })),
        showSymbol: false,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: { color: "#4f76f6" },
        lineStyle: { color: "#4f76f6", width: 2.2 }
      }
    ]
  });

  echarts.init(turningSowChart.value).setOption({
    grid: { left: 56, right: 18, top: 58, bottom: 30 },
    tooltip: { trigger: "axis" },
    title: { text: "能繁母猪存栏预警", left: 0, top: 0, textStyle: { color: "#17211a", fontSize: 13 } },
    xAxis: {
      type: "category",
      data: sowRows.map((row) => row.period),
      splitLine: { show: false }
    },
    yAxis: {
      type: "value",
      min: ({ min }) => Math.min(Math.floor(min / 100) * 100, 3200),
      max: ({ max }) => Math.max(Math.ceil(max / 100) * 100, 4400),
      name: "万头",
      nameLocation: "end",
      nameGap: 18,
      nameTextStyle: { align: "right", color: "#657164", fontWeight: 700 },
      splitLine: { show: false }
    },
    series: [
      {
        name: "能繁母猪存栏",
        type: "line",
        smooth: true,
        data: sowRows.map((row) => row.value),
        markArea: {
          silent: true,
          label: { color: "#506052", fontSize: 11 },
          data: [
            [
              { name: "红色预警 <85%", yAxis: 3200, itemStyle: { color: "rgba(180, 83, 36, 0.12)" } },
              { yAxis: sowWarning.redLow }
            ],
            [
              { name: "黄色预警 85%-92%", yAxis: sowWarning.redLow, itemStyle: { color: "rgba(217, 159, 53, 0.14)" } },
              { yAxis: sowWarning.yellowLow }
            ],
            [
              { name: "绿色正常 92%-105%", yAxis: sowWarning.yellowLow, itemStyle: { color: "rgba(56, 102, 65, 0.12)" } },
              { yAxis: sowWarning.greenHigh }
            ],
            [
              { name: "黄色预警 105%-110%", yAxis: sowWarning.greenHigh, itemStyle: { color: "rgba(217, 159, 53, 0.14)" } },
              { yAxis: sowWarning.yellowHigh }
            ],
            [
              { name: "红色预警 >110%", yAxis: sowWarning.yellowHigh, itemStyle: { color: "rgba(180, 83, 36, 0.12)" } },
              { yAxis: 4400 }
            ]
          ]
        },
        markLine: {
          silent: true,
          symbol: "none",
          label: { formatter: "{b}", color: "#17211a" },
          lineStyle: { type: "dashed", width: 1.2 },
          data: [
            { name: "目标 3900万头", yAxis: sowTarget, lineStyle: { color: "#17211a", width: 1.6 } },
            { name: "85%", yAxis: sowWarning.redLow, lineStyle: { color: "#b45324" } },
            { name: "92%", yAxis: sowWarning.yellowLow, lineStyle: { color: "#d99f35" } },
            { name: "105%", yAxis: sowWarning.greenHigh, lineStyle: { color: "#386641" } },
            { name: "110%", yAxis: sowWarning.yellowHigh, lineStyle: { color: "#b45324" } }
          ]
        }
      }
    ]
  });

  echarts.init(turningPriceChart.value).setOption({
    grid: { left: 56, right: 18, top: 44, bottom: 30 },
    tooltip: { trigger: "axis" },
    title: { text: "生猪出场价格", left: 0, top: 0, textStyle: { color: "#17211a", fontSize: 13 } },
    xAxis: {
      type: "category",
      data: priceRows.map((row) => row.period),
      splitLine: { show: false }
    },
    yAxis: {
      type: "value",
      name: "元/公斤",
      nameLocation: "end",
      nameGap: 18,
      nameTextStyle: { align: "right", color: "#657164", fontWeight: 700 },
      splitLine: { show: false }
    },
    series: [
      {
        name: "生猪出场价格",
        type: "line",
        smooth: true,
        data: priceRows.map((row) => row.value),
        itemStyle: { color: "#8ac253" },
        lineStyle: { color: "#8ac253", width: 2 }
      }
    ]
  });

  const samplePeriods = [...new Set(sampleRows.map((row) => row.period))].sort();
  const sampleProviders = [...new Set(sampleRows.map((row) => row.provider))].sort();
  echarts.init(thirdPartySampleChart.value).setOption({
    grid: { left: 56, right: 18, top: 48, bottom: 30 },
    tooltip: { trigger: "axis" },
    legend: {
      top: 0,
      right: 0,
      itemGap: 12,
      textStyle: { color: "#657164", fontSize: 11 }
    },
    title: { text: "样本监测/第三方：能繁母猪月环比", left: 0, top: 0, textStyle: { color: "#17211a", fontSize: 13 } },
    xAxis: {
      type: "category",
      data: samplePeriods,
      splitLine: { show: false }
    },
    yAxis: {
      type: "value",
      name: "%",
      nameLocation: "end",
      nameGap: 14,
      splitLine: { show: false }
    },
    series: sampleProviders.map((provider) => ({
      name: provider,
      type: "line",
      smooth: true,
      data: samplePeriods.map((period) => sampleRows.find((row) => row.provider === provider && row.period === period)?.value ?? null)
    }))
  });

  selectedSectorCompanyId.value = sortedSectorRows.value[0]?.company_id ?? "";
  renderSectorPriceChart();
}

function renderSectorPriceChart() {
  if (!sectorPriceChart.value || !selectedSectorCompany.value) return;
  const rows = selectedSectorCompany.value.rows ?? [];
  if (!sectorPriceChartInstance.value) sectorPriceChartInstance.value = echarts.init(sectorPriceChart.value);
  const priceValues = rows.map((row) => row.close_price).filter(Number.isFinite);
  const maxPrice = Math.max(...priceValues);
  const pricePadding = Math.max(maxPrice * 0.12, 0.5);
  sectorPriceChartInstance.value.clear();
  sectorPriceChartInstance.value.setOption(
    {
      grid: { left: 52, right: 18, top: 28, bottom: 34 },
      tooltip: {
        show: false
      },
      xAxis: {
        type: "category",
        data: rows.map((row) => row.trade_date),
        axisLabel: { hideOverlap: true }
      },
      yAxis: {
        type: "value",
        name: "元",
        nameLocation: "end",
        nameGap: 14,
        min: 0,
        max: Math.ceil((maxPrice + pricePadding) * 10) / 10
      },
      series: [
        {
          name: selectedSectorCompany.value.company_name,
          type: "line",
          smooth: true,
          data: rows.map((row) => ({ value: row.close_price, row })),
          showSymbol: false,
          symbol: "circle",
          symbolSize: 8,
          emphasis: { focus: "series", scale: true },
          itemStyle: { color: "#386641" },
          lineStyle: { color: "#386641", width: 2.2 }
        }
      ]
    },
    { replaceMerge: ["tooltip", "xAxis", "yAxis", "series"] }
  );
}

function showSectorPriceTooltip(event) {
  const rows = selectedSectorCompany.value?.rows ?? [];
  if (!rows.length) return;
  const frame = event.currentTarget;
  const rect = frame.getBoundingClientRect();
  const plotLeft = 52;
  const plotRight = 18;
  const plotWidth = Math.max(rect.width - plotLeft - plotRight, 1);
  const localX = Math.min(Math.max(event.clientX - rect.left - plotLeft, 0), plotWidth);
  const index = Math.min(rows.length - 1, Math.max(0, Math.round((localX / plotWidth) * (rows.length - 1))));
  const row = rows[index];
  const tooltipWidth = 180;
  const x = Math.min(Math.max(event.clientX - rect.left + 14, 8), rect.width - tooltipWidth - 8);
  const y = Math.max(event.clientY - rect.top - 18, 8);
  sectorPriceTooltip.value = {
    show: true,
    x,
    y,
    title: `${selectedSectorCompany.value.company_name} ${row.trade_date}`,
    price: formatPrice(row.close_price),
    change: formatSignedPercent(row.pct_change)
  };
}

function hideSectorPriceTooltip() {
  sectorPriceTooltip.value.show = false;
}

async function selectSectorCompany(companyId) {
  selectedSectorCompanyId.value = companyId;
  hideSectorPriceTooltip();
  await nextTick();
  renderSectorPriceChart();
}

function formatSignedPercent(value) {
  if (!Number.isFinite(value)) return "暂无";
  const rounded = Math.round(value * 100) / 100;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function tooltipRow(rows, point, dateKey = "trade_date") {
  if (!point) return null;
  const dataIndex = Number(point.dataIndex ?? point.dataIndexInside);
  if (Number.isInteger(dataIndex) && rows[dataIndex]) return rows[dataIndex];
  if (point.axisValue != null) return rows.find((row) => String(row[dateKey]) === String(point.axisValue)) ?? null;
  if (point.axisValueLabel != null) return rows.find((row) => String(row[dateKey]) === String(point.axisValueLabel)) ?? null;
  if (point.name != null) return rows.find((row) => String(row[dateKey]) === String(point.name)) ?? null;
  return null;
}

function formatPlainPercent(value) {
  if (!Number.isFinite(value)) return "暂无";
  return `${Math.round(value * 100) / 100}%`;
}

function formatPrice(value) {
  if (!Number.isFinite(value)) return "暂无";
  return `${Math.round(value * 100) / 100}`;
}

function formatChineseAmount(value) {
  if (!Number.isFinite(value)) return "暂无";
  const sign = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  if (absValue >= 100000000) return `${sign}${Math.round((absValue / 100000000) * 100) / 100}亿`;
  if (absValue >= 10000) return `${sign}${Math.round((absValue / 10000) * 100) / 100}万`;
  return `${Math.round(value * 100) / 100}`;
}

function formatWeights(weights = []) {
  if (!weights.length) return "暂无";
  return weights.map((item) => `${item.company_name}${item.weight}%`).join("、");
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
