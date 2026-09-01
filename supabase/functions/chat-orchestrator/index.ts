import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import {
  appointmentActionSummary,
  appointmentChoices,
  availabilityReply,
  buildSummary,
  cleanText,
  computeProgress,
  containsAcuteDanger,
  shouldEscalateSentiment,
  formatAppointment,
  isQuestionWorthRecording,
  normalizeLanguage,
  resolveAppointmentTarget,
  resolveConfiguredService,
  rescheduleMutationSucceeded,
  securityReply,
  stripInternalIdentifiers,
  validIsoDate,
  validTime,
  UUID_RE,
  type AppointmentRow,
  type ChatAnalysis,
  type QuickReply,
} from "./orchestrator.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5-mini";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

const serviceHeaders = {
  apikey: SERVICE_ROLE_KEY,
  authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "content-type": "application/json",
};

type JsonObject = Record<string, unknown>;
type ActionResult = {
  text: string;
  quickReplies?: QuickReply[];
  summary?: string | null;
  progress?: number;
  appointment?: JsonObject | null;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function errorMessage(error: unknown): string {
  return cleanText(error instanceof Error ? error.message : String(error), 500) || "unknown_error";
}

async function rest(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders, ...(init.headers ?? {}) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`database_${response.status}:${text.slice(0, 300)}`);
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function rpc(name: string, body: JsonObject): Promise<unknown> {
  return await rest(`rpc/${name}`, { method: "POST", body: JSON.stringify(body) });
}

async function selectRows<T extends JsonObject>(table: string, query: string): Promise<T[]> {
  const result = await rest(`${table}?${query}`, {
    headers: { accept: "application/json" },
  });
  return Array.isArray(result) ? (result as T[]) : [];
}

async function insertOne<T extends JsonObject>(table: string, body: JsonObject): Promise<T> {
  const result = await rest(table, {
    method: "POST",
    headers: { prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!Array.isArray(result) || !result[0]) throw new Error(`insert_${table}_returned_no_row`);
  return result[0] as T;
}

async function patchRows<T extends JsonObject>(
  table: string,
  query: string,
  body: JsonObject,
): Promise<T[]> {
  if (!Object.keys(body).length) return [];
  const result = await rest(`${table}?${query}`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  return Array.isArray(result) ? (result as T[]) : [];
}

function rpcUuid(value: unknown): string | null {
  if (typeof value === "string" && UUID_RE.test(value)) return value;
  if (value && typeof value === "object") {
    const object = value as JsonObject;
    for (const key of ["data", "id", "conversation_id"]) {
      const candidate = object[key];
      if (typeof candidate === "string" && UUID_RE.test(candidate)) return candidate;
    }
  }
  return null;
}

function responseText(data: JsonObject): string {
  if (typeof data.output_text === "string" && data.output_text.trim())
    return data.output_text.trim();
  const output = Array.isArray(data.output) ? data.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as JsonObject).content)
      ? ((item as JsonObject).content as unknown[])
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as JsonObject).text;
      if (typeof text === "string" && text.trim()) return text.trim();
    }
  }
  throw new Error("openai_empty_response");
}

async function openAIJson(
  name: string,
  instructions: string,
  input: string,
  schema: JsonObject,
  maxOutputTokens = 2_500,
): Promise<JsonObject> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY_missing");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      store: false,
      instructions,
      input,
      reasoning: { effort: "low" },
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name,
          strict: true,
          schema,
        },
      },
    }),
  });
  const data = (await response.json().catch(() => ({}))) as JsonObject;
  if (!response.ok) {
    const apiError =
      data.error && typeof data.error === "object"
        ? cleanText((data.error as JsonObject).message, 300)
        : "";
    throw new Error(`openai_${response.status}:${apiError || "request_failed"}`);
  }
  const parsed = JSON.parse(responseText(data));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("openai_invalid_json");
  return parsed as JsonObject;
}

const analysisSchema: JsonObject = {
  type: "object",
  additionalProperties: false,
  required: [
    "user_language",
    "intent",
    "customer_sentiment",
    "human_handoff",
    "human_handoff_reason",
    "name",
    "phone",
    "email",
    "postal_code",
    "address",
    "issue_type",
    "issue_description",
    "urgency",
    "preferred_contact_method",
    "appointment",
    "reply_de",
    "knowledge_supported",
    "quick_replies",
  ],
  properties: {
    user_language: { type: "string" },
    intent: { type: "string", enum: ["general", "booking", "cancel", "reschedule", "waitlist"] },
    customer_sentiment: { type: "string", enum: ["neutral", "frustrated", "angry"] },
    human_handoff: { type: "boolean" },
    human_handoff_reason: { type: "string" },
    name: { type: "string" },
    phone: { type: "string" },
    email: { type: "string" },
    postal_code: { type: "string" },
    address: { type: "string" },
    issue_type: { type: "string" },
    issue_description: { type: "string" },
    urgency: { type: "string", enum: ["low", "normal", "high", "emergency"] },
    preferred_contact_method: { type: "string", enum: ["phone", "email", "unknown"] },
    appointment: {
      type: "object",
      additionalProperties: false,
      required: [
        "requested",
        "date",
        "start_time",
        "service",
        "reason",
        "confirmed",
        "cancel_confirmed",
        "reschedule_confirmed",
        "rejected",
        "target_appointment_id",
      ],
      properties: {
        requested: { type: "boolean" },
        date: { type: "string" },
        start_time: { type: "string" },
        service: { type: "string" },
        reason: { type: "string" },
        confirmed: { type: "boolean" },
        cancel_confirmed: { type: "boolean" },
        reschedule_confirmed: { type: "boolean" },
        rejected: { type: "boolean" },
        target_appointment_id: { type: "string" },
      },
    },
    reply_de: { type: "string" },
    knowledge_supported: { type: "boolean" },
    quick_replies: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value"],
        properties: { label: { type: "string" }, value: { type: "string" } },
      },
    },
  },
};

function asAnalysis(value: JsonObject): ChatAnalysis {
  const appointment =
    value.appointment && typeof value.appointment === "object"
      ? (value.appointment as JsonObject)
      : {};
  const intent = ["general", "booking", "cancel", "reschedule", "waitlist"].includes(
    String(value.intent),
  )
    ? (String(value.intent) as ChatAnalysis["intent"])
    : "general";
  const urgency = ["low", "normal", "high", "emergency"].includes(String(value.urgency))
    ? (String(value.urgency) as ChatAnalysis["urgency"])
    : "normal";
  const sentiment = ["neutral", "frustrated", "angry"].includes(String(value.customer_sentiment))
    ? (String(value.customer_sentiment) as ChatAnalysis["customer_sentiment"])
    : "neutral";
  const contact = ["phone", "email", "unknown"].includes(String(value.preferred_contact_method))
    ? (String(value.preferred_contact_method) as ChatAnalysis["preferred_contact_method"])
    : "unknown";
  const quickReplies = Array.isArray(value.quick_replies)
    ? value.quick_replies
        .flatMap((entry): QuickReply[] => {
          if (!entry || typeof entry !== "object") return [];
          const object = entry as JsonObject;
          const label = cleanText(object.label, 120);
          const replyValue = cleanText(object.value, 500);
          return label && replyValue ? [{ label, value: replyValue }] : [];
        })
        .slice(0, 6)
    : [];
  return {
    user_language: normalizeLanguage(value.user_language),
    intent,
    customer_sentiment: sentiment,
    human_handoff: value.human_handoff === true,
    human_handoff_reason: cleanText(value.human_handoff_reason, 300),
    name: cleanText(value.name, 120),
    phone: cleanText(value.phone, 80),
    email: cleanText(value.email, 160).toLowerCase(),
    postal_code: cleanText(value.postal_code, 30),
    address: cleanText(value.address, 240),
    issue_type: cleanText(value.issue_type, 120),
    issue_description: cleanText(value.issue_description, 600),
    urgency,
    preferred_contact_method: contact,
    appointment: {
      requested: appointment.requested === true,
      date: cleanText(appointment.date, 20),
      start_time: cleanText(appointment.start_time, 20),
      service: cleanText(appointment.service, 200),
      reason: cleanText(appointment.reason, 500),
      confirmed: appointment.confirmed === true,
      cancel_confirmed: appointment.cancel_confirmed === true,
      reschedule_confirmed: appointment.reschedule_confirmed === true,
      rejected: appointment.rejected === true,
      target_appointment_id: cleanText(appointment.target_appointment_id, 80),
    },
    reply_de: cleanText(value.reply_de, 4_000),
    knowledge_supported: value.knowledge_supported === true,
    quick_replies: quickReplies,
  };
}

async function analyzeChat(args: {
  message: string;
  history: JsonObject[];
  context: JsonObject;
  lead: JsonObject | null;
  appointments: AppointmentRow[];
  knowledge: JsonObject;
  terminology: JsonObject;
}): Promise<ChatAnalysis> {
  const context = args.context;
  const company =
    context.company && typeof context.company === "object" ? (context.company as JsonObject) : {};
  const agent =
    context.agent && typeof context.agent === "object" ? (context.agent as JsonObject) : {};
  const now = new Intl.DateTimeFormat("sv-SE", {
    timeZone: cleanText(company.timezone, 80) || "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  const history = args.history
    .slice()
    .reverse()
    .map((entry) => ({
      role: entry.role,
      content: cleanText(entry.customer_visible_content || entry.content, 2_000),
    }));
  const input = JSON.stringify({
    reference_datetime: now,
    timezone: cleanText(company.timezone, 80) || "Europe/Berlin",
    current_message: args.message,
    conversation_history: history,
    current_lead_state: args.lead ?? {},
    future_appointments: args.appointments,
    company,
    agent,
    services: Array.isArray(context.services) ? context.services : [],
    service_areas: Array.isArray(context.service_areas) ? context.service_areas : [],
    opening_hours: Array.isArray(context.opening_hours) ? context.opening_hours : [],
    business_closures: Array.isArray(context.business_closures) ? context.business_closures : [],
    relevant_knowledge: Array.isArray(args.knowledge.items) ? args.knowledge.items : [],
    relevant_terminology: Array.isArray(args.terminology.items) ? args.terminology.items : [],
  }).slice(0, 45_000);
  const instructions = `Du bist der strukturierte Dialog- und Extraktionskern von ZunftEcho für einen deutschen Handwerksbetrieb.
Analysiere hauptsächlich current_message; nutze den Verlauf nur für ausstehende Bestätigungen und bereits genannte Daten.
Gib interne Kategorien und reply_de immer auf Deutsch zurück. Erkenne user_language als ISO-639-1-Code.
intent: booking für neue Terminwünsche, cancel für Absagen, reschedule für Verschiebungen, waitlist nur bei ausdrücklicher Wartelistenbitte, sonst general.
customer_sentiment ist angry nur bei klar erkennbarer starker Verärgerung, wiederholten Beschwerden oder ausdrücklicher Eskalation. Ein dringendes technisches Problem allein ist neutral oder frustrated. frustrated löst keine automatische Übergabe aus.
Setze Bestätigungsfelder nur bei einer eindeutigen Bestätigung des zuletzt angebotenen Vorgangs. Das Wort "buchen" in einem neuen Wunsch ist keine Bestätigung.
target_appointment_id darf nur exakt eine ID aus future_appointments sein; sonst leer lassen. Erfinde niemals IDs.
appointment.service darf nur exakt der Name einer konfigurierten Dienstleistung sein; sonst leer. Erfinde keine Leistungen, Termine, Preise oder Unternehmensdaten.
human_handoff nur bei ausdrücklicher Bitte um einen Menschen oder akuter Gefahr. Ein dringender Heizungsausfall allein ist kein automatischer Handoff.
reply_de ist nur für normale Informationsantworten maßgeblich. Bei Terminaktionen überschreibt das Backend den Text deterministisch.
Nutze strukturierte Unternehmensdaten vor Wissensbasis. Wenn eine Information nicht vorliegt, sage das ehrlich und nutze die Fallback-Nachricht des Agenten.
knowledge_supported ist true, wenn reply_de durch strukturierte Unternehmensdaten, Wissensbasis, Terminologie oder Gesprächsverlauf sachlich belegt ist.`;
  return asAnalysis(
    await openAIJson("zunftecho_chat_analysis", instructions, input, analysisSchema),
  );
}

async function localize(language: string, result: ActionResult): Promise<ActionResult> {
  if (language === "de") return result;
  const schema: JsonObject = {
    type: "object",
    additionalProperties: false,
    required: ["message", "summary", "quick_replies"],
    properties: {
      message: { type: "string" },
      summary: { type: "string" },
      quick_replies: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "value"],
          properties: { label: { type: "string" }, value: { type: "string" } },
        },
      },
    },
  };
  const translated = await openAIJson(
    "zunftecho_localized_reply",
    `Übersetze die Kundennachricht, die Zusammenfassung und alle Quick Replies natürlich in die Sprache ${language}. Bewahre Daten, Uhrzeiten, Telefonnummern, E-Mail-Adressen und Fakten exakt. Gib niemals interne IDs, UUIDs, Datenbankschlüssel oder technische Metadaten aus. Füge nichts hinzu.`,
    JSON.stringify({
      message: result.text,
      summary: result.summary ?? "",
      quick_replies: result.quickReplies ?? [],
    }),
    schema,
    1_200,
  );
  const quickReplies = Array.isArray(translated.quick_replies)
    ? translated.quick_replies
        .flatMap((entry): QuickReply[] => {
          if (!entry || typeof entry !== "object") return [];
          const item = entry as JsonObject;
          const label = cleanText(item.label, 120);
          const value = cleanText(item.value, 500);
          return label && value ? [{ label, value }] : [];
        })
        .slice(0, 6)
    : result.quickReplies;
  return {
    ...result,
    text: cleanText(translated.message, 4_000) || result.text,
    summary: cleanText(translated.summary, 2_000) || result.summary,
    quickReplies,
  };
}

function sanitizeActionResult(result: ActionResult): ActionResult {
  const quickReplies = result.quickReplies
    ?.map((reply) => ({
      label: stripInternalIdentifiers(reply.label).slice(0, 120),
      value: stripInternalIdentifiers(reply.value).slice(0, 500),
    }))
    .filter((reply) => reply.label && reply.value)
    .slice(0, 6);
  return {
    ...result,
    text:
      stripInternalIdentifiers(result.text) ||
      "Ihre Anfrage wurde verarbeitet. Bitte wählen Sie den nächsten Schritt aus.",
    summary: result.summary ? stripInternalIdentifiers(result.summary) : result.summary,
    quickReplies,
  };
}

function leadFields(analysis: ChatAnalysis): JsonObject {
  const fields: JsonObject = { customer_language: analysis.user_language };
  for (const [key, value] of Object.entries({
    name: analysis.name,
    phone: analysis.phone,
    email: analysis.email,
    postal_code: analysis.postal_code,
    address: analysis.address,
    issue_type: analysis.issue_type,
    issue_description: analysis.issue_description,
  }))
    if (value) fields[key] = value;
  if (analysis.preferred_contact_method !== "unknown") {
    fields.preferred_contact_method = analysis.preferred_contact_method;
  }
  fields.urgency = analysis.urgency;
  fields.priority =
    analysis.urgency === "emergency" ? "urgent" : analysis.urgency === "high" ? "high" : "normal";
  return fields;
}

async function upsertLead(
  existing: JsonObject | null,
  companyId: string,
  conversationId: string,
  analysis: ChatAnalysis,
): Promise<JsonObject> {
  const fields = leadFields(analysis);
  if (existing?.id) {
    const rows = await patchRows<JsonObject>(
      "leads",
      `id=eq.${encodeURIComponent(String(existing.id))}`,
      fields,
    );
    return { ...existing, ...(rows[0] ?? fields) };
  }
  return await insertOne<JsonObject>("leads", {
    company_id: companyId,
    conversation_id: conversationId,
    source: "chat_widget",
    status: "new",
    ...fields,
  });
}

function serviceQuickReplies(context: JsonObject): QuickReply[] {
  const services = Array.isArray(context.services) ? context.services : [];
  return services.slice(0, 6).flatMap((entry): QuickReply[] => {
    if (!entry || typeof entry !== "object") return [];
    const name = cleanText((entry as JsonObject).name, 120);
    return name ? [{ label: name, value: `Ich benötige ${name}.` }] : [];
  });
}

function slotQuickReplies(value: unknown, service: string): QuickReply[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const slots = Array.isArray((value as JsonObject).slots)
    ? ((value as JsonObject).slots as unknown[])
    : [];
  return slots.slice(0, 6).flatMap((entry): QuickReply[] => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const slot = entry as JsonObject;
    const date = validIsoDate(slot.date);
    const time = validTime(slot.start_time);
    if (!date || !time) return [];
    const parsed = new Date(`${date}T12:00:00Z`);
    const labelDate = Number.isNaN(parsed.getTime())
      ? date.split("-").reverse().join(".")
      : new Intl.DateTimeFormat("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
          timeZone: "UTC",
        }).format(parsed);
    return [
      {
        label: `${labelDate} · ${time.slice(0, 5)} Uhr`,
        value: `Ich wähle für ${service} den ${date.split("-").reverse().join(".")} um ${time.slice(0, 5)} Uhr.`,
      },
    ];
  });
}

async function routeAction(args: {
  widgetKey: string;
  message: string;
  context: JsonObject;
  analysis: ChatAnalysis;
  lead: JsonObject;
  appointments: AppointmentRow[];
}): Promise<ActionResult> {
  const { analysis, context, lead, appointments, widgetKey, message } = args;
  const leadId = cleanText(lead.id, 80);
  const conversationId = cleanText(lead.conversation_id, 80);
  const services = Array.isArray(context.services)
    ? (context.services as Array<{ name?: unknown; description?: unknown }>)
    : [];
  const resolvedService = resolveConfiguredService(
    analysis.appointment.service || lead.pending_service_type || lead.issue_type,
    services,
  );
  const requestedDate = validIsoDate(analysis.appointment.date);
  const requestedTime = validTime(analysis.appointment.start_time);

  if (analysis.intent === "cancel") {
    if (!appointments.length)
      return {
        text: "Ich habe keinen zukünftigen Termin gefunden, den ich absagen könnte.",
        progress: computeProgress(lead, analysis),
      };
    const storedTarget = cleanText(lead.cancellation_target_appointment_id, 80);
    const target = resolveAppointmentTarget(
      analysis.appointment.target_appointment_id || storedTarget,
      appointments,
      {
        date: analysis.appointment.date,
        start_time: analysis.appointment.start_time,
        service: analysis.appointment.service,
      },
    );
    if (!target) {
      return {
        text: "Welchen Termin möchten Sie absagen?",
        quickReplies: appointmentChoices(appointments, "absagen"),
        progress: computeProgress(lead, analysis),
      };
    }
    if (analysis.appointment.rejected) {
      await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, {
        cancellation_selection_pending: false,
        cancellation_target_appointment_id: null,
      });
      return {
        text: "Alles klar. Der Termin bleibt bestehen.",
        summary: appointmentActionSummary({
          status: "Unverändert",
          appointment: target,
          nextStep: "Der Termin bleibt wie geplant bestehen.",
        }),
        progress: computeProgress(lead, analysis),
      };
    }
    if (!analysis.appointment.cancel_confirmed || storedTarget !== target.id) {
      await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, {
        cancellation_selection_pending: true,
        cancellation_target_appointment_id: target.id,
      });
      return {
        text: `Möchten Sie den Termin ${formatAppointment(target)} wirklich verbindlich absagen?`,
        quickReplies: [
          {
            label: "Ja, Termin absagen",
            value: "Ja, bitte diesen Termin verbindlich absagen.",
          },
          { label: "Nein, behalten", value: "Nein, der Termin soll bestehen bleiben." },
        ],
        summary: appointmentActionSummary({
          status: "Bestätigung ausstehend",
          appointment: target,
          nextStep: "Absage bestätigen oder den Termin behalten.",
        }),
        progress: computeProgress(lead, analysis),
      };
    }
    const cancelled = (await rpc("cancel_appointment_atomic", {
      p_widget_key: widgetKey,
      p_appointment_id: target.id,
    })) as JsonObject;
    if (cancelled?.cancelled === true) {
      await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, {
        cancellation_selection_pending: false,
        cancellation_target_appointment_id: null,
      });
      return {
        text: `Der Termin ${formatAppointment(target)} wurde abgesagt.`,
        summary: appointmentActionSummary({
          status: "Abgesagt",
          appointment: target,
          nextStep: "Es ist nichts weiter erforderlich.",
        }),
        progress: 100,
      };
    }
    return {
      text: "Der Termin konnte nicht abgesagt werden. Ich habe die Anfrage zur Prüfung vorgemerkt.",
      progress: computeProgress(lead, analysis),
    };
  }

  if (analysis.intent === "reschedule") {
    if (!appointments.length)
      return {
        text: "Ich habe keinen zukünftigen Termin gefunden, den ich verschieben könnte.",
        progress: computeProgress(lead, analysis),
      };
    const storedTarget = cleanText(lead.reschedule_target_appointment_id, 80);
    const target = resolveAppointmentTarget(
      analysis.appointment.target_appointment_id || storedTarget,
      appointments,
      {
        date: analysis.appointment.date,
        start_time: analysis.appointment.start_time,
        service: analysis.appointment.service,
      },
    );
    if (!target) {
      return {
        text: "Welchen Termin möchten Sie verschieben?",
        quickReplies: appointmentChoices(appointments, "verschieben"),
        progress: computeProgress(lead, analysis),
      };
    }
    if (analysis.appointment.rejected) {
      await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, {
        reschedule_selection_pending: false,
        reschedule_target_appointment_id: null,
        reschedule_new_date: null,
        reschedule_new_start_time: null,
        reschedule_confirmation_received: false,
      });
      return {
        text: "Alles klar. Der bestehende Termin bleibt unverändert.",
        summary: appointmentActionSummary({
          status: "Unverändert",
          appointment: target,
          nextStep: "Der Termin bleibt wie geplant bestehen.",
        }),
        progress: computeProgress(lead, analysis),
      };
    }
    const newDate = requestedDate ?? validIsoDate(lead.reschedule_new_date);
    const newTime = requestedTime ?? validTime(lead.reschedule_new_start_time);
    if (!newDate || !newTime) {
      await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, {
        reschedule_selection_pending: true,
        reschedule_target_appointment_id: target.id,
      });
      return {
        text: "Auf welches neue Datum und welche Uhrzeit möchten Sie den Termin verschieben?",
        summary: appointmentActionSummary({
          status: "Neuer Zeitpunkt erforderlich",
          appointment: target,
          nextStep: "Bitte nennen Sie das gewünschte neue Datum und die Uhrzeit.",
        }),
        progress: computeProgress(lead, analysis),
      };
    }
    const service = cleanText(target.service_type, 200) || resolvedService;
    const storedDate = validIsoDate(lead.reschedule_new_date);
    const storedTime = validTime(lead.reschedule_new_start_time);
    const storedMatches =
      storedTarget === target.id && storedDate === newDate && storedTime === newTime;
    if (analysis.appointment.reschedule_confirmed && storedMatches) {
      const moved = (await rpc("reschedule_appointment_if_available", {
        p_widget_key: widgetKey,
        p_appointment_id: target.id,
        p_new_date: newDate,
        p_new_start_time: newTime,
        p_service_name: service,
      })) as JsonObject;
      if (rescheduleMutationSucceeded(moved)) {
        await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, {
          reschedule_selection_pending: false,
          reschedule_target_appointment_id: null,
          reschedule_new_date: null,
          reschedule_new_start_time: null,
          reschedule_confirmation_received: false,
        });
        return {
          text: `Der Termin wurde auf den ${newDate.split("-").reverse().join(".")} um ${newTime.slice(0, 5)} Uhr verschoben.`,
          summary: appointmentActionSummary({
            status: "Verbindlich verschoben",
            previousAppointment: target,
            appointment: { ...target, appointment_date: newDate, start_time: newTime },
            nextStep: "Der neue Termin ist bestätigt.",
          }),
          progress: 100,
          appointment: { ...target, appointment_date: newDate, start_time: newTime },
        };
      }
      return { text: availabilityReply(moved?.reason), progress: computeProgress(lead, analysis) };
    }
    const checked = (await rpc("check_booking_slot", {
      p_widget_key: widgetKey,
      p_service_name: service,
      p_date: newDate,
      p_start_time: newTime,
      p_exclude_appointment_id: target.id,
    })) as JsonObject;
    if (checked?.available !== true)
      return {
        text: availabilityReply(checked?.reason),
        progress: computeProgress(lead, analysis),
      };
    await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, {
      reschedule_selection_pending: true,
      reschedule_target_appointment_id: target.id,
      reschedule_new_date: newDate,
      reschedule_new_start_time: newTime,
      reschedule_confirmation_received: false,
    });
    return {
      text: `Der neue Termin am ${newDate.split("-").reverse().join(".")} um ${newTime.slice(0, 5)} Uhr ist verfügbar. Soll ich die Verschiebung verbindlich durchführen?`,
      quickReplies: [
        {
          label: "Verschiebung bestätigen",
          value: `Ja, bitte auf den ${newDate.split("-").reverse().join(".")} um ${newTime.slice(0, 5)} Uhr verschieben.`,
        },
        { label: "Abbrechen", value: "Nein, der bestehende Termin soll unverändert bleiben." },
      ],
      summary: appointmentActionSummary({
        status: "Bestätigung ausstehend",
        previousAppointment: target,
        appointment: { ...target, appointment_date: newDate, start_time: newTime },
        nextStep: "Verschiebung bestätigen oder abbrechen.",
      }),
      progress: Math.max(85, computeProgress(lead, analysis)),
    };
  }

  if (analysis.intent === "waitlist") {
    const date =
      requestedDate ??
      validIsoDate(lead.draft_appointment_date) ??
      validIsoDate(lead.pending_appointment_date);
    const time =
      requestedTime ?? validTime(lead.draft_start_time) ?? validTime(lead.pending_start_time);
    if (!resolvedService || !date) {
      return {
        text:
          !resolvedService && !date
            ? "Bitte nennen Sie die gewünschte Dienstleistung und den gewünschten Tag für die Warteliste."
            : !resolvedService
              ? "Für welche Dienstleistung möchten Sie auf die Warteliste?"
              : "Für welchen Tag möchten Sie auf die Warteliste?",
        quickReplies: !resolvedService ? serviceQuickReplies(context) : undefined,
        progress: computeProgress(lead, analysis),
      };
    }
    const waitlist = (await rpc("add_to_waitlist_backend", {
      p_widget_key: widgetKey,
      p_lead_id: leadId || null,
      p_conversation_id: conversationId || null,
      p_service_name: resolvedService,
      p_date_from: date,
      p_date_to: date,
      p_time_from: time,
      p_time_to: null,
      p_customer_name: cleanText(lead.name, 120) || null,
      p_phone: cleanText(lead.phone, 80) || null,
      p_email: cleanText(lead.email, 160) || null,
      p_postal_code: cleanText(lead.postal_code, 30) || null,
      p_address: cleanText(lead.address, 240) || null,
      p_notes: message.slice(0, 1_000),
    })) as JsonObject;
    const when = `${date.split("-").reverse().join(".")}${time ? ` um ${time.slice(0, 5)} Uhr` : ""}`;
    return {
      text:
        waitlist?.already_exists === true
          ? `Sie stehen für ${resolvedService} am ${when} bereits auf der Warteliste. Wir melden uns, sobald ein passender Termin frei wird.`
          : `Ich habe Sie für ${resolvedService} am ${when} auf die Warteliste gesetzt. Wir melden uns, sobald ein passender Termin frei wird.`,
      summary: appointmentActionSummary({
        status:
          waitlist?.already_exists === true ? "Bereits auf der Warteliste" : "Warteliste bestätigt",
        appointment: {
          id: "",
          appointment_date: date,
          start_time: time,
          service_type: resolvedService,
        },
        nextStep: "Wir melden uns, sobald ein passender Termin frei wird.",
      }),
      progress: Math.max(80, computeProgress(lead, analysis)),
    };
  }

  if (analysis.intent === "booking" || analysis.appointment.requested) {
    const date =
      requestedDate ??
      validIsoDate(lead.draft_appointment_date) ??
      validIsoDate(lead.pending_appointment_date);
    const time =
      requestedTime ?? validTime(lead.draft_start_time) ?? validTime(lead.pending_start_time);
    const reason =
      analysis.appointment.reason ||
      cleanText(lead.appointment_reason, 500) ||
      analysis.issue_description;
    const draft: JsonObject = {};
    if (date) draft.draft_appointment_date = date;
    if (time) draft.draft_start_time = time;
    if (resolvedService) draft.pending_service_type = resolvedService;
    if (reason) draft.appointment_reason = reason;
    if (Object.keys(draft).length)
      await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, draft);

    if (context.company && typeof context.company === "object") {
      const bookingCompany = context.company as JsonObject;
      if (bookingCompany.dynamic_booking_enabled === true && resolvedService && (!date || !time)) {
        const available = await rpc("get_next_available_slots", {
          p_widget_key: widgetKey,
          p_service_name: resolvedService,
          p_from_date: date || null,
          p_days: Number(bookingCompany.booking_window_days ?? 62),
          p_limit: 8,
        });
        const replies = slotQuickReplies(available, resolvedService);
        if (replies.length) {
          return {
            text: "Diese Termine sind aktuell frei. Bitte wählen Sie den passenden Zeitpunkt:",
            quickReplies: replies,
            progress: computeProgress(lead, analysis),
          };
        }
        return {
          text: "Im freigegebenen Zeitraum ist aktuell kein freier Online-Termin verfügbar. Ich kann Ihre Anfrage an einen Mitarbeiter weitergeben oder Sie auf die Warteliste setzen.",
          quickReplies: [
            {
              label: "Mitarbeiter kontaktieren",
              value: "Bitte geben Sie meine Anfrage an einen Mitarbeiter weiter.",
            },
            {
              label: "Auf Warteliste",
              value: `Bitte setzen Sie mich für ${resolvedService} auf die Warteliste.`,
            },
          ],
          progress: computeProgress(lead, analysis),
        };
      }
    }

    const missing: string[] = [];
    if (!resolvedService) missing.push("Dienstleistung");
    if (!reason) missing.push("Anliegen");
    if (!date) missing.push("Datum");
    if (!time) missing.push("Uhrzeit");
    if (!cleanText(lead.name, 120)) missing.push("Name");
    if (!cleanText(lead.phone, 80)) missing.push("Telefonnummer");
    if (!cleanText(lead.address, 240) && !cleanText(lead.postal_code, 30))
      missing.push("Einsatzort oder Postleitzahl");
    if (missing.length) {
      return {
        text: `Für die Terminanfrage benötige ich noch: ${missing.join(", ")}.`,
        quickReplies: !resolvedService ? serviceQuickReplies(context) : undefined,
        progress: computeProgress(lead, analysis),
      };
    }
    if (!resolvedService || !date || !time || !reason) {
      throw new Error("booking_validation_invariant_failed");
    }

    const pendingDate = validIsoDate(lead.pending_appointment_date);
    const pendingTime = validTime(lead.pending_start_time);
    const pendingService = cleanText(lead.pending_service_type, 200);
    const pendingMatches =
      pendingDate === date && pendingTime === time && pendingService === resolvedService;
    if (analysis.appointment.confirmed && pendingMatches) {
      const created = (await rpc("create_appointment_if_available", {
        p_widget_key: widgetKey,
        p_lead_id: leadId || null,
        p_conversation_id: conversationId || null,
        p_service_name: resolvedService,
        p_date: date,
        p_start_time: time,
        p_customer_name: cleanText(lead.name, 120) || null,
        p_phone: cleanText(lead.phone, 80) || null,
        p_email: cleanText(lead.email, 160) || null,
        p_address: cleanText(lead.address, 240) || null,
        p_postal_code: cleanText(lead.postal_code, 30) || null,
        p_notes: reason,
      })) as JsonObject;
      if (created?.created === true) {
        await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, {
          pending_appointment_date: null,
          pending_start_time: null,
          pending_service_type: null,
          draft_appointment_date: null,
          draft_start_time: null,
          booking_confirmation_received: false,
          status: "qualified",
        });
        return {
          text: `Ihr Termin für ${resolvedService} am ${date.split("-").reverse().join(".")} um ${time.slice(0, 5)} Uhr ist bestätigt.`,
          summary: appointmentActionSummary({
            status: "Verbindlich bestätigt",
            appointment: {
              id: "",
              appointment_date: date,
              start_time: time,
              end_time: cleanText(created.end_time, 20),
              service_type: resolvedService,
            },
            nextStep: "Der Betrieb meldet sich, falls weitere Informationen erforderlich sind.",
          }),
          progress: 100,
          appointment: {
            appointment_date: date,
            start_time: time,
            end_time: created.end_time,
            service_type: resolvedService,
          },
        };
      }
      return {
        text: availabilityReply(created?.reason),
        quickReplies: [
          {
            label: "Auf Warteliste setzen",
            value: `Bitte setzen Sie mich für ${resolvedService} am ${date.split("-").reverse().join(".")} um ${time.slice(0, 5)} Uhr auf die Warteliste.`,
          },
        ],
        progress: computeProgress(lead, analysis),
      };
    }

    const checked = (await rpc("check_booking_slot", {
      p_widget_key: widgetKey,
      p_service_name: resolvedService,
      p_date: date,
      p_start_time: time,
      p_exclude_appointment_id: null,
    })) as JsonObject;
    if (checked?.available !== true) {
      return {
        text: availabilityReply(checked?.reason),
        quickReplies: [
          {
            label: "Auf Warteliste setzen",
            value: `Bitte setzen Sie mich für ${resolvedService} am ${date.split("-").reverse().join(".")} um ${time.slice(0, 5)} Uhr auf die Warteliste.`,
          },
        ],
        progress: computeProgress(lead, analysis),
      };
    }
    await patchRows("leads", `id=eq.${encodeURIComponent(leadId)}`, {
      pending_appointment_date: date,
      pending_start_time: time,
      pending_service_type: resolvedService,
      booking_confirmation_received: false,
    });
    return {
      text: `Der Termin für ${resolvedService} am ${date.split("-").reverse().join(".")} um ${time.slice(0, 5)} Uhr ist verfügbar. Soll ich ihn verbindlich buchen?`,
      quickReplies: [
        {
          label: "Verbindlich buchen",
          value: `Ja, bitte den Termin für ${resolvedService} am ${date.split("-").reverse().join(".")} um ${time.slice(0, 5)} Uhr verbindlich buchen.`,
        },
        { label: "Anderen Termin wählen", value: "Ich möchte einen anderen Termin wählen." },
      ],
      summary: appointmentActionSummary({
        status: "Bestätigung ausstehend",
        appointment: {
          id: "",
          appointment_date: date,
          start_time: time,
          service_type: resolvedService,
        },
        nextStep: "Termin verbindlich buchen oder einen anderen Zeitpunkt wählen.",
      }),
      progress: Math.max(90, computeProgress(lead, analysis)),
    };
  }

  return {
    text:
      analysis.reply_de ||
      cleanText((context.agent as JsonObject | undefined)?.fallback_message, 4_000) ||
      "Vielen Dank für Ihre Nachricht. Ein Mitarbeiter meldet sich bei Ihnen.",
    quickReplies: analysis.quick_replies,
    progress: computeProgress(lead, analysis),
  };
}

async function saveAssistant(
  conversationId: string,
  internalText: string,
  customerText: string,
  language: string,
): Promise<string> {
  const row = await insertOne<JsonObject>("messages", {
    conversation_id: conversationId,
    role: "assistant",
    content: internalText,
    source_channel: "widget",
  });
  const id = cleanText(row.id, 80);
  if (id) {
    await rpc("finalize_assistant_delivery", {
      p_message_id: id,
      p_customer_content: customerText,
      p_customer_language: language,
      p_staff_translation: language === "de" ? null : internalText,
    });
  }
  return id;
}

async function logFailure(companyId: string | null, conversationId: string | null, error: unknown) {
  try {
    await insertOne("workflow_errors", {
      company_id: companyId,
      conversation_id: conversationId,
      source: "chat-orchestrator",
      error_code: "edge_function_failure",
      error_message: errorMessage(error),
      error_payload: { model: OPENAI_MODEL },
    });
  } catch {
    // Avoid masking the original failure.
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method === "GET") {
    return jsonResponse({
      ok: true,
      service: "chat-orchestrator",
      model: OPENAI_MODEL,
      openai_configured: Boolean(OPENAI_API_KEY),
    });
  }
  if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  let companyId: string | null = null;
  let conversationId: string | null = null;
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("supabase_runtime_not_configured");
    const body = (await request.json().catch(() => null)) as JsonObject | null;
    if (!body) return jsonResponse({ error: "invalid_json" }, 400);
    const widgetKey = cleanText(body.widget_key, 80);
    const message = cleanText(body.message, 20_000);
    const suppliedConversationId = cleanText(body.conversation_id, 80);
    if (!UUID_RE.test(widgetKey) || !message)
      return jsonResponse({ error: "invalid_request" }, 400);
    if (suppliedConversationId && !UUID_RE.test(suppliedConversationId))
      return jsonResponse({ error: "invalid_conversation_id" }, 400);

    const origin = cleanText(body.origin || request.headers.get("origin"), 2_000);
    const clientHash = cleanText(
      body.client_id || request.headers.get("x-forwarded-for") || "anonymous",
      2_000,
    );
    const gate = (await rpc("consume_widget_request", {
      p_widget_key: widgetKey,
      p_client_hash: clientHash,
      p_origin: origin || null,
      p_message_length: message.length,
    })) as JsonObject;
    if (gate?.allowed !== true) {
      return jsonResponse({
        message: securityReply(gate?.reason),
        conversation_id: null,
        assistant_message_id: null,
        language: "de",
        quick_replies: [],
        progress_percent: null,
        summary: null,
      });
    }

    const [contextRaw, conversationRaw] = await Promise.all([
      rpc("get_chatbot_context", { p_widget_key: widgetKey }),
      rpc("get_or_create_conversation", {
        p_widget_key: widgetKey,
        p_conversation_id: suppliedConversationId || null,
      }),
    ]);
    const context = contextRaw && typeof contextRaw === "object" ? (contextRaw as JsonObject) : {};
    const company =
      context.company && typeof context.company === "object" ? (context.company as JsonObject) : {};
    const agent =
      context.agent && typeof context.agent === "object" ? (context.agent as JsonObject) : {};
    companyId = cleanText(company.id, 80) || null;
    conversationId = rpcUuid(conversationRaw);
    if (!companyId || !conversationId) throw new Error("chat_context_unavailable");

    const bookingConfig = await selectRows<JsonObject>(
      "companies",
      `id=eq.${encodeURIComponent(companyId)}&select=dynamic_booking_enabled,booking_window_days&limit=1`,
    );
    if (bookingConfig[0]) Object.assign(company, bookingConfig[0]);

    await Promise.all([
      rpc("set_conversation_context", {
        p_widget_key: widgetKey,
        p_conversation_id: conversationId,
        p_page_url: cleanText(body.page_url, 2_000) || null,
        p_page_title: cleanText(body.page_title, 500) || null,
        p_referrer: cleanText(body.referrer, 2_000) || null,
        p_utm_source: cleanText(body.utm_source, 300) || null,
        p_utm_medium: cleanText(body.utm_medium, 300) || null,
        p_utm_campaign: cleanText(body.utm_campaign, 300) || null,
        p_utm_content: cleanText(body.utm_content, 300) || null,
        p_utm_term: cleanText(body.utm_term, 300) || null,
      }),
      insertOne("messages", {
        conversation_id: conversationId,
        role: "user",
        content: message,
        source_channel: "widget",
      }),
    ]);

    const conversationRows = await selectRows<JsonObject>(
      "conversations",
      `id=eq.${encodeURIComponent(conversationId)}&select=id,status,handoff_reason,customer_language&limit=1`,
    );
    if (conversationRows[0]?.status === "needs_human") {
      const internal =
        "Ihre Anfrage wurde bereits an einen Mitarbeiter weitergegeben. Weitere Nachrichten werden gespeichert; ein Mitarbeiter übernimmt die weitere Bearbeitung.";
      const messageId = await saveAssistant(
        conversationId,
        internal,
        internal,
        normalizeLanguage(conversationRows[0].customer_language),
      );
      return jsonResponse({
        message: internal,
        conversation_id: conversationId,
        assistant_message_id: messageId,
        language: normalizeLanguage(conversationRows[0].customer_language),
        quick_replies: [],
        progress_percent: null,
        summary: null,
      });
    }

    const leadQuery = `conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&order=created_at.desc&limit=1`;
    const appointmentQuery = `company_id=eq.${encodeURIComponent(companyId)}&status=neq.cancelled&appointment_date=gte.${new Date().toISOString().slice(0, 10)}&select=id,appointment_date,start_time,end_time,service_type,status,lead_id,conversation_id&order=appointment_date.asc,start_time.asc&limit=20`;
    const [history, leadRows, allAppointments, knowledgeRaw, terminologyRaw] = await Promise.all([
      selectRows<JsonObject>(
        "messages",
        `conversation_id=eq.${encodeURIComponent(conversationId)}&select=role,content,customer_visible_content,created_at&order=created_at.desc&limit=20`,
      ),
      selectRows<JsonObject>("leads", leadQuery),
      selectRows<JsonObject>("appointments", appointmentQuery),
      rpc("search_chatbot_knowledge", { p_widget_key: widgetKey, p_query: message, p_limit: 5 }),
      rpc("search_chatbot_terminology", { p_widget_key: widgetKey, p_query: message, p_limit: 5 }),
    ]);
    const existingLead = leadRows[0] ?? null;
    const relevantAppointments = (allAppointments as AppointmentRow[]).filter(
      (appointment) =>
        (existingLead?.id && appointment.lead_id === existingLead.id) ||
        appointment.conversation_id === conversationId,
    );
    const knowledge =
      knowledgeRaw && typeof knowledgeRaw === "object" ? (knowledgeRaw as JsonObject) : {};
    const terminology =
      terminologyRaw && typeof terminologyRaw === "object" ? (terminologyRaw as JsonObject) : {};
    const analysis = await analyzeChat({
      message,
      history,
      context,
      lead: existingLead,
      appointments: relevantAppointments,
      knowledge,
      terminology,
    });
    let lead = await upsertLead(existingLead, companyId, conversationId, analysis);
    const suppliedLocation =
      body.location && typeof body.location === "object" && !Array.isArray(body.location)
        ? (body.location as JsonObject)
        : null;
    if (suppliedLocation) {
      const locationAddress = cleanText(suppliedLocation.address, 500);
      const locationSource =
        suppliedLocation.source === "browser_geolocation" ? "browser_geolocation" : "manual";
      const latitude = Number(suppliedLocation.latitude);
      const longitude = Number(suppliedLocation.longitude);
      const validCoordinates =
        locationSource === "browser_geolocation" &&
        Number.isFinite(latitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        Number.isFinite(longitude) &&
        longitude >= -180 &&
        longitude <= 180;
      if (locationAddress) {
        const locationPatch: JsonObject = {
          address: locationAddress,
          location_source: locationSource,
          location_confirmed_at: new Date().toISOString(),
          ...(validCoordinates ? { latitude, longitude } : { latitude: null, longitude: null }),
        };
        const updated = await patchRows<JsonObject>(
          "leads",
          `id=eq.${encodeURIComponent(cleanText(lead.id, 80))}`,
          locationPatch,
        );
        lead = { ...lead, ...(updated[0] ?? locationPatch) };
      }
    }

    const danger = containsAcuteDanger(message) || analysis.urgency === "emergency";
    const angryCustomer = shouldEscalateSentiment(analysis.customer_sentiment);
    let internalResult: ActionResult;
    if (
      danger ||
      ((analysis.human_handoff || angryCustomer) && agent.human_handoff_enabled !== false)
    ) {
      const reason = danger
        ? "Akute Gefahr"
        : angryCustomer
          ? "Verärgerter Kunde – sofortige Rückmeldung empfohlen"
          : analysis.human_handoff_reason || "Kunde verlangt Mitarbeiter";
      await Promise.all([
        patchRows("conversations", `id=eq.${encodeURIComponent(conversationId)}`, {
          status: "needs_human",
          handoff_requested_at: new Date().toISOString(),
          handoff_reason: reason,
          customer_language: analysis.user_language,
        }),
        patchRows("leads", `id=eq.${encodeURIComponent(cleanText(lead.id, 80))}`, {
          human_handoff_pending: true,
          human_handoff_reason: reason,
          priority: danger ? "urgent" : "high",
        }),
      ]);
      internalResult = {
        text: danger
          ? "Akute Gefahr: Halten Sie Abstand und verlassen Sie den Gefahrenbereich. Betätigen Sie bei Gasgeruch keine elektrischen Schalter und vermeiden Sie offene Flammen oder Funken. Rufen Sie bei unmittelbarer Gefahr 112, andernfalls den zuständigen Versorger oder Notdienst – möglichst von draußen. Ihre Anfrage wurde zusätzlich dringend an einen Mitarbeiter weitergegeben."
          : "Ich habe Ihre Anfrage an einen Mitarbeiter weitergegeben. Ein Mitarbeiter übernimmt die weitere Bearbeitung.",
        progress: computeProgress(lead, analysis),
      };
    } else {
      internalResult = await routeAction({
        widgetKey,
        message,
        context,
        analysis,
        lead,
        appointments: relevantAppointments,
      });
      if (
        analysis.intent === "general" &&
        Number(knowledge.count ?? 0) === 0 &&
        Number(terminology.count ?? 0) === 0 &&
        isQuestionWorthRecording(message)
      ) {
        await rpc("record_knowledge_gap", {
          p_widget_key: widgetKey,
          p_question: message,
          p_conversation_id: conversationId,
        });
      }
    }

    const refreshed = await selectRows<JsonObject>("leads", leadQuery);
    lead = refreshed[0] ?? lead;
    internalResult.summary =
      internalResult.summary ?? buildSummary(lead, internalResult.appointment);
    internalResult = sanitizeActionResult(internalResult);
    const supportedLanguages = Array.isArray(agent.supported_languages)
      ? agent.supported_languages.map((value) => normalizeLanguage(value)).filter(Boolean)
      : ["de"];
    const configuredLanguage = normalizeLanguage(agent.language);
    const customerLanguage =
      agent.auto_detect_language !== false && supportedLanguages.includes(analysis.user_language)
        ? analysis.user_language
        : supportedLanguages.includes(configuredLanguage)
          ? configuredLanguage
          : (supportedLanguages[0] ?? "de");
    let customerResult = internalResult;
    if (customerLanguage !== "de") {
      try {
        customerResult = await localize(customerLanguage, internalResult);
      } catch {
        customerResult = internalResult;
      }
    }
    customerResult = sanitizeActionResult(customerResult);
    const assistantMessageId = await saveAssistant(
      conversationId,
      internalResult.text,
      customerResult.text,
      customerLanguage,
    );
    await patchRows("conversations", `id=eq.${encodeURIComponent(conversationId)}`, {
      customer_language: customerLanguage,
      detected_language: analysis.user_language,
      preferred_language: customerLanguage,
    });
    return jsonResponse({
      message: customerResult.text,
      conversation_id: conversationId,
      assistant_message_id: assistantMessageId || null,
      language: customerLanguage,
      quick_replies: customerResult.quickReplies ?? [],
      progress_percent: customerResult.progress ?? null,
      summary: customerResult.summary ?? null,
    });
  } catch (error) {
    console.error("chat-orchestrator", errorMessage(error));
    await logFailure(companyId, conversationId, error);
    return jsonResponse({ error: "temporary_failure" }, 503);
  }
});
