export type QuickReply = { label: string; value: string };

export type AppointmentAnalysis = {
  requested: boolean;
  date: string;
  start_time: string;
  service: string;
  reason: string;
  confirmed: boolean;
  cancel_confirmed: boolean;
  reschedule_confirmed: boolean;
  rejected: boolean;
  target_appointment_id: string;
};

export type ChatAnalysis = {
  user_language: string;
  intent: "general" | "booking" | "cancel" | "reschedule" | "waitlist";
  human_handoff: boolean;
  human_handoff_reason: string;
  name: string;
  phone: string;
  email: string;
  postal_code: string;
  address: string;
  issue_type: string;
  issue_description: string;
  urgency: "low" | "normal" | "high" | "emergency";
  preferred_contact_method: "phone" | "email" | "unknown";
  appointment: AppointmentAnalysis;
  reply_de: string;
  knowledge_supported: boolean;
  quick_replies: QuickReply[];
};

export type AppointmentRow = {
  id: string;
  appointment_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  service_type?: string | null;
  status?: string | null;
  lead_id?: string | null;
  conversation_id?: string | null;
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function cleanText(value: unknown, max = 2_000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function normalizeLanguage(value: unknown, fallback = "de"): string {
  const code = cleanText(value, 8).toLowerCase().split(/[-_]/)[0] ?? "";
  return /^[a-z]{2}$/.test(code) ? code : fallback;
}

export function validIsoDate(value: unknown): string | null {
  const text = cleanText(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? null : text;
}

export function validTime(value: unknown): string | null {
  const match = cleanText(value, 12).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function normalized(value: unknown): string {
  return cleanText(value, 2_000)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveConfiguredService(
  candidate: unknown,
  services: Array<{ name?: unknown; description?: unknown }>,
): string | null {
  const input = normalized(candidate);
  if (!input) return null;
  const exact = services.find((service) => normalized(service.name) === input);
  if (exact) return cleanText(exact.name, 200);

  const inputTokens = new Set(input.split(" ").filter((token) => token.length > 2));
  let best: { name: string; score: number } | null = null;
  for (const service of services) {
    const name = cleanText(service.name, 200);
    if (!name) continue;
    const haystack = normalized(`${name} ${cleanText(service.description, 600)}`);
    const tokens = new Set(haystack.split(" ").filter((token) => token.length > 2));
    let overlap = 0;
    for (const token of inputTokens) if (tokens.has(token)) overlap += 1;
    const score = overlap / Math.max(1, inputTokens.size);
    if (score >= 0.5 && (!best || score > best.score)) best = { name, score };
  }
  return best?.name ?? null;
}

export function resolveAppointmentTarget(
  requestedId: unknown,
  appointments: AppointmentRow[],
): AppointmentRow | null {
  const id = cleanText(requestedId, 80);
  if (id && UUID_RE.test(id)) {
    const exact = appointments.find((appointment) => appointment.id === id);
    if (exact) return exact;
  }
  return appointments.length === 1 ? (appointments[0] ?? null) : null;
}

export function rescheduleMutationSucceeded(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  // The current atomic RPC returns `updated`; keep accepting the earlier
  // `rescheduled` contract so a rolling deployment remains backward compatible.
  return result.updated === true || result.rescheduled === true;
}

export function formatAppointment(appointment: AppointmentRow): string {
  const date = validIsoDate(appointment.appointment_date);
  const formattedDate = date ? date.split("-").reverse().join(".") : "Datum offen";
  const time = validTime(appointment.start_time)?.slice(0, 5) ?? "Uhrzeit offen";
  const service = cleanText(appointment.service_type, 120) || "Termin";
  return `${formattedDate} · ${time} Uhr · ${service}`;
}

export function appointmentChoices(
  appointments: AppointmentRow[],
  action: "absagen" | "verschieben",
): QuickReply[] {
  return appointments.slice(0, 6).map((appointment) => ({
    label: formatAppointment(appointment).slice(0, 120),
    value:
      `Ich möchte den Termin ${formatAppointment(appointment)} ${action}. Termin-ID: ${appointment.id}`.slice(
        0,
        500,
      ),
  }));
}

export function containsAcuteDanger(message: unknown): boolean {
  const value = cleanText(message, 4_000).normalize("NFKC").toLocaleLowerCase();
  const negations = [
    "kein gasgeruch",
    "keinen gasgeruch",
    "rieche kein gas",
    "no gas smell",
    "no gas leak",
    "لا توجد رائحة غاز",
  ];
  if (negations.some((term) => value.includes(term))) return false;
  return [
    "gasgeruch",
    "gasleck",
    "riecht nach gas",
    "rieche gas",
    "ich rieche gas",
    "brandgefahr",
    "es brennt",
    "starker rauch",
    "stromschlag",
    "stromgefahr",
    "unkontrollierter wasseraustritt",
    "starker wasseraustritt",
    "rohrbruch",
    "gas smell",
    "gas leak",
    "on fire",
    "electrical hazard",
    "burst pipe",
    "رائحة غاز",
    "تسرب غاز",
    "حريق",
    "خطر كهربائي",
    "انفجار أنبوب",
    "gaz kokusu",
    "gaz kaçağı",
    "zapach gazu",
    "утечка газа",
    "odeur de gaz",
    "fuga de gas",
  ].some((term) => value.includes(term));
}

export function securityReply(reason: unknown): string {
  switch (cleanText(reason, 80)) {
    case "message_too_long":
      return "Ihre Nachricht ist zu lang. Bitte kürzen Sie sie und versuchen Sie es erneut.";
    case "rate_limited":
      return "Zu viele Anfragen in kurzer Zeit. Bitte versuchen Sie es später erneut.";
    case "invalid_widget":
    case "widget_disabled":
    case "origin_not_allowed":
    case "origin_not_configured":
      return "Der Chat ist derzeit nicht verfügbar.";
    default:
      return "Die Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.";
  }
}

export function availabilityReply(reason: unknown): string {
  switch (cleanText(reason, 80)) {
    case "business_closed":
    case "closed_day":
      return "An diesem Tag ist der Betrieb geschlossen. Bitte wählen Sie einen anderen Werktag.";
    case "outside_opening_hours":
      return "Diese Uhrzeit liegt außerhalb der Öffnungszeiten. Bitte wählen Sie eine andere Uhrzeit.";
    case "minimum_notice":
      return "Dieser Termin liegt zu kurzfristig. Bitte wählen Sie einen späteren Zeitpunkt.";
    case "conflict":
    case "conflict_race":
      return "Dieser Termin ist leider nicht mehr verfügbar. Bitte wählen Sie einen anderen Zeitpunkt oder lassen Sie sich auf die Warteliste setzen.";
    case "service_not_found":
      return "Bitte wählen Sie eine der angebotenen Dienstleistungen aus.";
    case "service_booking_disabled":
      return "Für diese Dienstleistung ist keine direkte Online-Terminbuchung möglich. Ich kann Ihre Anfrage an einen Mitarbeiter weitergeben.";
    default:
      return "Der gewünschte Termin konnte nicht geprüft werden. Bitte versuchen Sie einen anderen Zeitpunkt.";
  }
}

export function computeProgress(lead: Record<string, unknown>, analysis: ChatAnalysis): number {
  const has = (...values: unknown[]) => values.some((value) => cleanText(value, 500).length > 0);
  let score = 10;
  if (has(analysis.issue_description, analysis.issue_type, lead.issue_description, lead.issue_type))
    score += 20;
  if (has(analysis.name, lead.name)) score += 15;
  if (has(analysis.phone, lead.phone, analysis.email, lead.email)) score += 20;
  if (has(analysis.postal_code, analysis.address, lead.postal_code, lead.address)) score += 15;
  if (has(analysis.appointment.service, lead.pending_service_type)) score += 10;
  if (has(analysis.appointment.date, lead.pending_appointment_date)) score += 5;
  if (has(analysis.appointment.start_time, lead.pending_start_time)) score += 5;
  return Math.min(100, score);
}

export function buildSummary(
  lead: Record<string, unknown>,
  appointment?: Record<string, unknown> | null,
): string | null {
  const lines: string[] = [];
  const issue = cleanText(lead.issue_description, 400) || cleanText(lead.issue_type, 120);
  if (issue) lines.push(`Anliegen: ${issue}`);
  const name = cleanText(lead.name, 120);
  if (name) lines.push(`Name: ${name}`);
  const contact = cleanText(lead.phone, 80) || cleanText(lead.email, 160);
  if (contact) lines.push(`Kontakt: ${contact}`);
  const location = cleanText(lead.address, 240) || cleanText(lead.postal_code, 30);
  if (location) lines.push(`Einsatzort: ${location}`);
  if (appointment) {
    const date = validIsoDate(appointment.appointment_date ?? appointment.date);
    const time = validTime(appointment.start_time)?.slice(0, 5);
    const service = cleanText(appointment.service_type ?? appointment.service, 160);
    if (date || time || service) {
      lines.push(
        `Termin: ${[date ? date.split("-").reverse().join(".") : "", time ? `${time} Uhr` : "", service].filter(Boolean).join(" · ")}`,
      );
    }
  }
  return lines.length >= 2 ? lines.join("\n").slice(0, 2_000) : null;
}

export function isQuestionWorthRecording(message: unknown): boolean {
  const value = cleanText(message, 4_000);
  if (value.length < 8) return false;
  if (
    /^(hallo|hi|hey|guten tag|guten morgen|guten abend|danke|vielen dank|tsch(ü|u)ss|ok|okay)[!. ]*$/i.test(
      value,
    )
  ) {
    return false;
  }
  return (
    /\?$/.test(value) ||
    /^(was|wie|wann|wo|warum|wieso|welche|kann|können|habt|haben|bietet|bieten|gibt|ist|sind|kostet|kosten|macht|machen)\b/i.test(
      value,
    )
  );
}

