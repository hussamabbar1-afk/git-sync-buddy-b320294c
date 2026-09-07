import assert from "node:assert/strict";
import { createChatTelemetry } from "../supabase/functions/chat-orchestrator/telemetry.ts";

Deno.test("telemetry: separates stages and retains provider token counts", () => {
  let time = 0;
  const metric = createChatTelemetry(() => time);
  time = 10;
  metric.mark("analysis");
  const record = metric.startAI("analysis");
  time = 150;
  record(true, {
    input_tokens: 500,
    output_tokens: 100,
    input_tokens_details: { cached_tokens: 200 },
    output_tokens_details: { reasoning_tokens: 20 },
  });
  metric.mark("persist_reply");
  time = 170;
  const result = metric.finish(200);
  assert.equal(result.total_ms, 170);
  assert.deepEqual(result.stages_ms, { validation: 10, analysis: 140, persist_reply: 20 });
  assert.deepEqual(result.ai[0], {
    kind: "analysis",
    duration_ms: 140,
    ok: true,
    input_tokens: 500,
    output_tokens: 100,
    cached_tokens: 200,
    reasoning_tokens: 20,
  });
});

Deno.test("telemetry: unknown usage is null, not a fabricated zero", () => {
  const metric = createChatTelemetry(() => 0);
  metric.startAI("analysis")(false);
  metric.startAI("localization")(true, {
    input_tokens: -1,
    output_tokens: "900",
    input_tokens_details: { cached_tokens: Infinity },
  });
  for (const call of metric.finish(503).ai) {
    assert.equal(call.input_tokens, null);
    assert.equal(call.output_tokens, null);
    assert.equal(call.cached_tokens, null);
  }
});

Deno.test("telemetry: request state is isolated and log fields exclude private payloads", () => {
  const first = createChatTelemetry(() => 0);
  const second = createChatTelemetry(() => 0);
  const record = first.startAI("analysis");
  record(true, {
    input_tokens: 12,
    customer: "private@example.test",
    output_text: "Secret address",
    input_tokens_details: { cached_tokens: 0, secret: "token-secret" },
  });
  record(false);
  const snapshot = first.finish(200);
  assert.equal(snapshot.ai.length, 1);
  assert.equal(second.finish(200).ai.length, 0);
  assert.doesNotMatch(JSON.stringify(snapshot), /private@|Secret address|token-secret/);
  snapshot.ai[0].input_tokens = 999;
  assert.equal(first.finish(200).ai[0].input_tokens, 12);
});
