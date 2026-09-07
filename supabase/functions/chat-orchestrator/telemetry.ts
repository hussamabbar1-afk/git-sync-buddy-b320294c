// Request-local, allowlisted operational measurements only. Never accept customer
// text, identifiers, URLs, headers, or provider response objects in the log payload.
type Stage =
  | "validation"
  | "gate"
  | "context"
  | "persist_input"
  | "load_history"
  | "analysis"
  | "action"
  | "localization"
  | "persist_reply"
  | "error";
type Usage = {
  input_tokens?: unknown;
  output_tokens?: unknown;
  input_tokens_details?: { cached_tokens?: unknown };
  output_tokens_details?: { reasoning_tokens?: unknown };
};

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function createChatTelemetry(now: () => number = () => performance.now()) {
  const started = now();
  let previous = started;
  let stage: Stage = "validation";
  const stages: Partial<Record<Stage, number>> = {};
  const ai: {
    kind: "analysis" | "localization";
    duration_ms: number;
    ok: boolean;
    input_tokens: number | null;
    output_tokens: number | null;
    cached_tokens: number | null;
    reasoning_tokens: number | null;
  }[] = [];
  const elapsed = (from: number) => Math.max(0, Math.round(now() - from));
  function mark(next: Stage) {
    stages[stage] = (stages[stage] ?? 0) + elapsed(previous);
    previous = now();
    stage = next;
  }
  return {
    mark,
    startAI(kind: "analysis" | "localization") {
      const begin = now();
      let recorded = false;
      return (ok: boolean, usage?: Usage | null) => {
        if (recorded) return;
        recorded = true;
        ai.push({
          kind,
          duration_ms: elapsed(begin),
          ok,
          input_tokens: count(usage?.input_tokens),
          output_tokens: count(usage?.output_tokens),
          cached_tokens: count(usage?.input_tokens_details?.cached_tokens),
          reasoning_tokens: count(usage?.output_tokens_details?.reasoning_tokens),
        });
      };
    },
    finish(status: number) {
      mark(stage);
      return {
        event: "chat_performance",
        version: 1,
        status,
        total_ms: elapsed(started),
        stages_ms: { ...stages },
        ai: ai.map((call) => ({ ...call })),
      };
    },
  };
}

export type ChatTelemetry = ReturnType<typeof createChatTelemetry>;
