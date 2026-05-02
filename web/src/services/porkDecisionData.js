const EXPORT_PATH = `${import.meta.env.BASE_URL}data/export/pork/decision-dashboard.json`;

export async function loadPorkDecisionDashboard() {
  const response = await fetch(EXPORT_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`无法读取导出数据：${EXPORT_PATH}`);
  }
  return response.json();
}

export function formatDateTime(value) {
  if (!value) return "暂无数据";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
