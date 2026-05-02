import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "..", "..");

export function resolvePath(relativePath) {
  const normalizedPath = relativePath.replaceAll("\\", "/");
  if (process.env.INVEST_BOARD_DATA_ROOT && normalizedPath.startsWith("data/")) {
    return path.join(repoRoot, process.env.INVEST_BOARD_DATA_ROOT, normalizedPath.slice("data/".length));
  }
  return path.join(repoRoot, relativePath);
}

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(resolvePath(relativePath), "utf8"));
}

export function loadConfig() {
  return readJson("config/pork_decision_indicators.json");
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function isoCompact(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function listJsonlFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) return listJsonlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".jsonl") ? [fullPath] : [];
  });
}

export function readJsonlFiles(dirPath) {
  return listJsonlFiles(dirPath).flatMap((filePath) => {
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
    return lines.map((line) => ({ ...JSON.parse(line), raw_file: path.relative(repoRoot, filePath).replaceAll("\\\\", "/") }));
  });
}

export function writeJson(relativePath, value) {
  const fullPath = resolvePath(relativePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
