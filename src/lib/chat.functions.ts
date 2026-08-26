import { z } from "zod";

const FALLBACK_CHAT_ENDPOINT =
  "https://srufegisweghdswdsdxb.supabase.co/functions/v1/chat-orchestrator";
const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT || FALLBACK_CHAT_ENDPOINT;

const optionalText = z.string().trim().min(1).max(2000).optional();

const schema = z.object({
  widget_key: z.string().uuid(),
  message: z.string().trim().min(1).max(20_000),
  conversation_id: z.string().uuid().optional(),
  // Optional host-page metadata captured by widget-loader v2.
  client_id: optionalText,
  origin: optionalText,
  page_url: optionalText,
  page_title: optionalText,
  referrer: optionalText,
  utm_source: optionalText,
  utm_medium: optionalText,
  utm_campaign: optionalText,
  utm_content: optionalText,
  utm_term: optionalText,
});

const metadataKeys = [
  "client_id",
  "origin",
  "page_url",
  "page_title",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type QuickReply = { label: string; value: string };

function normalizeQuickReplies(...sources: unknown[]): QuickReply[] {
  const replies: QuickReply[] = [];

  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (const item of source) {
      let label = "";
      let value = "";

      if (typeof item === "string") {
        label = item.trim();
        value = label;
      } else if (item && typeof item === "object") {
        const entry = item as Record<string, unknown>;
        const rawLabel = entry["label"] ?? entry["title"] ?? entry["time"] ?? entry["start"];
        const rawValue = entry["value"] ?? entry["message"] ?? rawLabel;
        label = typeof rawLabel === "string" ? rawLabel.trim() : "";
        value = typeof rawValue === "string" ? rawValue.trim() : "";
      }

      if (!label || !value || label.length > 120 || value.length > 500) continue;
      if (replies.some((reply) => reply.label === label)) continue;
      replies.push({ label, value });
      if (replies.length === 6) return replies;
    }
  }

  return replies;
}

export async function sendChatMessage(input: unknown) {
  const data = schema.parse(input);

  // Keep the public widget contract stable while the backend remains replaceable.
  const body: Record<string, string> = {
    widget_key: data.widget_key,
    message: data.message,
  };
  if (data.conversation_id) body["conversation_id"] = data.conversation_id;
  for (const key of metadataKeys) {
    const value = data[key];
    if (value) body[key] = value;
  }

  const res = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Chat-Backend antwortete mit Status ${res.status}`);
  }

  const text = await res.text();
  if (!text.trim()) {
    throw new Error("Ungültige Antwort vom Chat-Backend: Leere Antwort erhalten.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    raw = { message: text };
  }

  let payload: unknown;
  if (Array.isArray(raw)) {
    payload = raw.find((item) => {
      if (typeof item === "string") return item.trim().length > 0;
      if (item && typeof item === "object") {
        const candidate = item as Record<string, unknown>;
        return ["message", "output", "text", "reply"].some(
          (key) =>
            typeof candidate[key] === "string" && candidate[key].toString().trim().length > 0,
        );
      }
      return false;
    });
  } else {
    payload = raw;
  }

  if (typeof payload === "string") {
    payload = { message: payload };
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Ungültige Antwort vom Chat-Backend: Keine verwertbare Nachricht gefunden.");
  }

  const responseBody = payload as {
    message?: unknown;
    output?: unknown;
    text?: unknown;
    reply?: unknown;
    conversation_id?: unknown;
    assistant_message_id?: unknown;
    language?: unknown;
    quick_replies?: unknown;
    suggested_replies?: unknown;
    appointment_slots?: unknown;
    progress_percent?: unknown;
    progress?: unknown;
    summary?: unknown;
  };

  const supportedFields = ["message", "output", "text", "reply"] as const;
  const messageText = supportedFields
    .map((key) => responseBody[key])
    .find((value) => typeof value === "string" && value.trim().length > 0);

  if (typeof messageText !== "string") {
    throw new Error("Ungültige Antwort vom Chat-Backend: Keine verwertbare Nachricht gefunden.");
  }

  const rawProgress = responseBody.progress_percent ?? responseBody.progress;
  const progress =
    typeof rawProgress === "number" && Number.isFinite(rawProgress)
      ? Math.max(0, Math.min(100, Math.round(rawProgress)))
      : null;

  return {
    message: messageText,
    conversation_id:
      typeof responseBody.conversation_id === "string" ? responseBody.conversation_id : null,
    // Present from prepared v11 onwards; live v3 omits these.
    assistant_message_id:
      typeof responseBody.assistant_message_id === "string"
        ? responseBody.assistant_message_id
        : null,
    language: typeof responseBody.language === "string" ? responseBody.language : null,
    quick_replies: normalizeQuickReplies(
      responseBody.quick_replies,
      responseBody.suggested_replies,
      responseBody.appointment_slots,
    ),
    progress_percent: progress,
    summary:
      typeof responseBody.summary === "string" && responseBody.summary.trim()
        ? responseBody.summary.trim().slice(0, 2000)
        : null,
  };
}
