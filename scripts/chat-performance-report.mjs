import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const stages = [
  "validation",
  "gate",
  "context",
  "persist_input",
  "load_history",
  "analysis",
  "action",
  "localization",
  "persist_reply",
  "error",
];
const valid = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
function distribution(values) {
  const sorted = values.filter(valid).sort((a, b) => a - b);
  const percentile = (p) => (sorted.length ? sorted[Math.ceil(sorted.length * p) - 1] : null);
  return {
    samples: sorted.length,
    p50_ms: percentile(0.5),
    p95_ms: percentile(0.95),
    max_ms: sorted.at(-1) ?? null,
  };
}

// Reads only allowlisted numeric operational fields; never echoes raw log lines.
export function performanceReport(entries) {
  const requests = entries.filter(
    (row) =>
      row?.event === "chat_performance" &&
      row.version === 1 &&
      valid(row.total_ms) &&
      Number.isInteger(row.status) &&
      row.status >= 100 &&
      row.status <= 599,
  );
  const calls = requests.flatMap((row) =>
    Array.isArray(row.ai)
      ? row.ai.filter((call) => call && ["analysis", "localization"].includes(call.kind))
      : [],
  );
  const successful = requests.filter((row) => row.status >= 200 && row.status < 300);
  const tokens = Object.fromEntries(
    ["input_tokens", "output_tokens", "cached_tokens", "reasoning_tokens"].map((key) => {
      const known = calls
        .map((call) => call[key])
        .filter((value) => valid(value) && Number.isSafeInteger(value));
      return [
        key,
        {
          reported_calls: known.length,
          missing_calls: calls.length - known.length,
          total_reported: known.length ? known.reduce((sum, value) => sum + value, 0) : null,
        },
      ];
    }),
  );
  return {
    requests: requests.length,
    http_errors: requests.filter((row) => row.status >= 400).length,
    all_requests: distribution(requests.map((row) => row.total_ms)),
    successful_requests: distribution(successful.map((row) => row.total_ms)),
    stages: Object.fromEntries(
      stages.map((stage) => [stage, distribution(successful.map((row) => row.stages_ms?.[stage]))]),
    ),
    ai: {
      calls: calls.length,
      failed_calls: calls.filter((call) => call.ok === false).length,
      analysis: distribution(
        calls.filter((call) => call.kind === "analysis").map((call) => call.duration_ms),
      ),
      localization: distribution(
        calls.filter((call) => call.kind === "localization").map((call) => call.duration_ms),
      ),
      tokens,
    },
    notes: [
      "Server elapsed time, not mobile network latency or time-to-first-token.",
      "HTTP 200 also includes policy-denied replies; it is not proof of a completed conversation.",
      "Missing token usage is unknown, never zero. Reasoning tokens are a subset of output tokens; cached tokens are a subset of input tokens.",
      "No currency estimate: reconcile reported usage with the configured model and current provider pricing. Logs are not a billing ledger.",
    ],
  };
}

export function parsePerformanceLines(text) {
  return text.split(/\r?\n/).flatMap((line) => {
    try {
      const row = JSON.parse(line);
      return [typeof row?.event_message === "string" ? JSON.parse(row.event_message) : row];
    } catch {
      return [];
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) {
    console.error("Usage: node scripts/chat-performance-report.mjs <private-jsonl-log-file>");
    process.exitCode = 2;
  } else {
    try {
      const report = performanceReport(
        parsePerformanceLines(await readFile(process.argv[2], "utf8")),
      );
      console.log(JSON.stringify(report, null, 2));
      if (!report.requests) process.exitCode = 1;
    } catch {
      console.error("Cannot read performance log file.");
      process.exitCode = 1;
    }
  }
}
