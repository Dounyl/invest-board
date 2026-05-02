#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const args = new Set(process.argv.slice(2));
const intervalHours = Number(process.env.PORK_DAILY_INTERVAL_HOURS ?? 24);
const runOnce = args.has("--once");
const skipImmediate = args.has("--skip-immediate");
const intervalMs = intervalHours * 60 * 60 * 1000;

const pipeline = [
  ["scripts/ingest/pork_ingest.mjs", "采集"],
  ["scripts/transform/pork_transform.mjs", "转换"],
  ["scripts/export/pork_export.mjs", "导出"]
];

function timestamp() {
  return new Date().toISOString();
}

function runNodeScript(scriptPath, label) {
  return new Promise((resolve, reject) => {
    console.log(`[pork-daily] ${timestamp()} start ${label}: ${scriptPath}`);
    const child = spawn(process.execPath, [scriptPath], {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        console.log(`[pork-daily] ${timestamp()} done ${label}`);
        resolve();
      } else {
        reject(new Error(`${label} failed with exit code ${code}`));
      }
    });
  });
}

async function runPipeline() {
  console.log(`[pork-daily] ${timestamp()} pipeline started`);
  for (const [scriptPath, label] of pipeline) {
    await runNodeScript(scriptPath, label);
  }
  console.log(`[pork-daily] ${timestamp()} pipeline completed`);
}

function scheduleNextRun() {
  const nextRunAt = new Date(Date.now() + intervalMs);
  console.log(`[pork-daily] next run at ${nextRunAt.toISOString()} (interval_hours=${intervalHours})`);
  setTimeout(async () => {
    try {
      await runPipeline();
    } catch (error) {
      console.error(`[pork-daily] ${timestamp()} pipeline failed:`, error.message);
    } finally {
      scheduleNextRun();
    }
  }, intervalMs);
}

process.on("SIGINT", () => {
  console.log("\n[pork-daily] stopped by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[pork-daily] stopped");
  process.exit(0);
});

if (!Number.isFinite(intervalHours) || intervalHours <= 0) {
  throw new Error("PORK_DAILY_INTERVAL_HOURS must be a positive number.");
}

if (runOnce) {
  await runPipeline();
} else {
  if (!skipImmediate) {
    try {
      await runPipeline();
    } catch (error) {
      console.error(`[pork-daily] ${timestamp()} initial pipeline failed:`, error.message);
    }
  }
  scheduleNextRun();
}
