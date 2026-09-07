import assert from "node:assert/strict";
import { performanceReport, parsePerformanceLines } from "./chat-performance-report.mjs";

Deno.test("performance report: empty logs do not imply zero latency or zero cost", () => {
  const report = performanceReport([]);
  assert.equal(report.requests, 0);
  assert.equal(report.all_requests.p95_ms, null);
  assert.equal(report.ai.tokens.input_tokens.total_reported, null);
});
Deno.test("performance report: percentiles separate failed requests and missing usage", () => {
  const report = performanceReport(
    [100, 200, 900].map((total_ms, index) => ({
      event: "chat_performance",
      version: 1,
      status: index === 2 ? 503 : 200,
      total_ms,
      stages_ms: { analysis: 50 },
      ai: [
        {
          kind: "analysis",
          duration_ms: 50,
          ok: index !== 2,
          input_tokens: index === 0 ? 400 : null,
        },
      ],
    })),
  );
  assert.equal(report.requests, 3);
  assert.equal(report.http_errors, 1);
  assert.equal(report.all_requests.p95_ms, 900);
  assert.equal(report.successful_requests.p95_ms, 200);
  assert.deepEqual(report.ai.tokens.input_tokens, {
    reported_calls: 1,
    missing_calls: 2,
    total_reported: 400,
  });
});
Deno.test("performance report: ignores unrelated logs and never copies private fields", () => {
  const entries = parsePerformanceLines(
    "not json\n" +
      JSON.stringify({
        event_message: JSON.stringify({
          event: "chat_performance",
          version: 1,
          status: 200,
          total_ms: 100,
          secret: "private-address",
          stages_ms: { "private-address": 50 },
          ai: [{ kind: "private-address", duration_ms: 50 }],
        }),
      }),
  );
  const report = performanceReport([...entries, { event: "other", total_ms: 1 }, null]);
  assert.equal(report.requests, 1);
  assert.equal(report.ai.calls, 0);
  assert.doesNotMatch(JSON.stringify(report), /private-address/);
});
