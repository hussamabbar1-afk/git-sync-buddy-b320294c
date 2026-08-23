// Shared CRM helpers: safe JSON access, German labels and formatting.

export type JsonRecord = Record<string, unknown>;

export function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function optionalNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.toUpperCase() === "EMPTY") return null;
  return text;
}

export function bool(value: unknown): boolean {
  return value === true;
}

export function stringArray(value: unknown): string[] {
  return asArray(value)
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

export function customerName(name: string | null | undefined) {
  return str(name) ?? "Unbekannter Kunde";
}

export const leadStatusOptions = [
  "new",
  "qualified",
  "contacted",
  "quote_sent",
  "won",
  "lost",
  "archived",
] as const;

export const leadPriorityOptions = ["low", "normal", "high", "urgent"] as const;

export function leadStatusLabel(status: string | null | undefined) {
  switch ((status ?? "").toLowerCase()) {
    case "new":
      return "Neu";
    case "qualified":
      return "Qualifiziert";
    case "contacted":
      return "Kontaktiert";
    case "quote_sent":
      return "Angebot gesendet";
    case "won":
      return "Gewonnen";
    case "lost":
      return "Verloren";
    case "archived":
      return "Archiviert";
    default:
      return str(status) ?? "—";
  }
}

export function priorityLabel(priority: string | null | undefined) {
  switch ((priority ?? "").toLowerCase()) {
    case "low":
      return "Niedrig";
    case "normal":
      return "Normal";
    case "high":
      return "Hoch";
    case "urgent":
      return "Dringend";
    default:
      return str(priority) ?? "—";
  }
}

export function temperatureLabel(temperature: string | null | undefined) {
  switch ((temperature ?? "").toLowerCase()) {
    case "hot":
      return "Heiß";
    case "warm":
      return "Warm";
    case "cold":
      return "Kalt";
    default:
      return str(temperature) ?? "—";
  }
}

export function urgencyLabel(urgency: string | null | undefined) {
  switch ((urgency ?? "").toLowerCase()) {
    case "emergency":
      return "Notfall";
    case "urgent":
    case "high":
      return "Dringend";
    case "low":
      return "Niedrig";
    case "normal":
      return "Normal";
    default:
      return str(urgency) ?? "Normal";
  }
}

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatCents(cents: number | null | undefined) {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "—";
  return euroFormatter.format(cents / 100);
}

export function centsToEuroInput(cents: number | null | undefined) {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Parses a German or plain EUR input into integer cents. */
export function euroInputToCents(input: string): { cents: number | null } | { error: string } {
  const raw = input.trim();
  if (!raw) return { cents: null };

  const normalized = raw.replace(/[€\s]/g, "");
  if (!normalized || !/^\d[\d.,]*$/.test(normalized)) {
    return { error: "Bitte einen gültigen Betrag in Euro eingeben." };
  }

  let integerPart: string;
  let fractionPart = "";

  const separatorCount = (normalized.match(/[.,]/g) ?? []).length;
  const lastDot = normalized.lastIndexOf(".");
  const lastComma = normalized.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    const decimalSeparator = lastDot > lastComma ? "." : ",";
    const thousandsSeparator = decimalSeparator === "." ? "," : ".";
    const decimalIndex = normalized.lastIndexOf(decimalSeparator);
    const integerWithGrouping = normalized.slice(0, decimalIndex);
    fractionPart = normalized.slice(decimalIndex + 1);
    const groupedIntegerPattern =
      thousandsSeparator === "." ? /^\d{1,3}(?:\.\d{3})*$/ : /^\d{1,3}(?:,\d{3})*$/;

    if (
      !groupedIntegerPattern.test(integerWithGrouping) ||
      !/^\d{1,2}$/.test(fractionPart) ||
      normalized.slice(decimalIndex + 1).includes(thousandsSeparator)
    ) {
      return {
        error: "Bitte einen eindeutigen Betrag mit höchstens zwei Nachkommastellen eingeben.",
      };
    }
    integerPart = integerWithGrouping.replaceAll(thousandsSeparator, "");
  } else if (separatorCount === 1) {
    const separator = lastDot !== -1 ? "." : ",";
    const separatorIndex = normalized.indexOf(separator);
    const left = normalized.slice(0, separatorIndex);
    const right = normalized.slice(separatorIndex + 1);

    if (!/^\d+$/.test(left) || !/^\d{1,2}$/.test(right)) {
      return {
        error: "Bitte einen eindeutigen Betrag mit höchstens zwei Nachkommastellen eingeben.",
      };
    }
    integerPart = left;
    fractionPart = right;
  } else if (separatorCount === 0) {
    integerPart = normalized;
  } else {
    return { error: "Bitte einen gültigen Betrag in Euro eingeben." };
  }

  const parsed = Number(`${integerPart}.${fractionPart.padEnd(2, "0") || "00"}`);
  if (!Number.isSafeInteger(Math.round(parsed * 100))) {
    return { error: "Der Betrag ist zu groß." };
  }
  return { cents: Math.round(parsed * 100) };
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${dateTimeFormatter.format(date)} Uhr`;
}

/** ISO timestamp -> value for <input type="datetime-local">. */
export function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocal(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  for (const part of input.split(",")) {
    const tag = part.trim();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

/** Routes that already exist in the app. Everything else must stay non-clickable. */
export const existingRoutes = [
  "/dashboard",
  "/unternehmen",
  "/ki-mitarbeiter",
  "/konversationen",
  "/leads",
  "/kunden",
  "/angebote",
  "/auftraege",
  "/rechnungen",
  "/aufgaben",
  "/termine",
  "/einstellungen",
  "/einrichtung",
] as const;

export type ExistingRoute = (typeof existingRoutes)[number];

export function resolveExistingRoute(route: string | null | undefined): ExistingRoute | null {
  if (!route) return null;
  const base = ("/" + route.replace(/^\//, "").split(/[/?#]/)[0]) as ExistingRoute;
  return existingRoutes.includes(base) ? base : null;
}

export const quoteStatusOptions = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
] as const;

export type QuoteStatus = (typeof quoteStatusOptions)[number];

export function quoteStatusLabel(status: string | null | undefined) {
  switch ((status ?? "").toLowerCase()) {
    case "draft":
      return "Entwurf";
    case "sent":
      return "Gesendet";
    case "accepted":
      return "Angenommen";
    case "rejected":
      return "Abgelehnt";
    case "expired":
      return "Abgelaufen";
    case "cancelled":
      return "Storniert";
    default:
      return str(status) ?? "—";
  }
}

/** Badge variant for a quote status, using existing badge variants only. */
export function quoteStatusVariant(
  status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  switch ((status ?? "").toLowerCase()) {
    case "accepted":
      return "default";
    case "sent":
      return "secondary";
    case "rejected":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

/** ISO date -> value for <input type="date">. */
export function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateInput(value: string): string | null {
  const raw = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

/** Parses a quantity or tax-rate input written German- or English-style. */
export function decimalInputToNumber(
  input: string,
  { max, allowZero = true }: { max: number; allowZero?: boolean },
): { value: number } | { error: string } {
  const raw = input.trim().replace(",", ".");
  if (!raw) return { error: "Bitte einen Wert eingeben." };
  if (!/^\d+(\.\d{1,3})?$/.test(raw)) return { error: "Bitte eine gültige Zahl eingeben." };
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
    return { error: `Bitte einen Wert zwischen 0 und ${max} eingeben.` };
  }
  if (!allowZero && parsed === 0) {
    return { error: "Bitte einen Wert größer als 0 eingeben." };
  }
  return { value: parsed };
}

export const jobStatusOptions = [
  "planned",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type JobStatus = (typeof jobStatusOptions)[number];

/** Statuses that can be set through a direct jobs update. */
export const jobDirectStatusOptions = ["planned", "scheduled", "in_progress", "cancelled"] as const;

export const jobPriorityOptions = ["low", "normal", "high", "urgent"] as const;

export function jobStatusLabel(status: string | null | undefined) {
  switch ((status ?? "").toLowerCase()) {
    case "planned":
      return "Geplant";
    case "scheduled":
      return "Terminiert";
    case "in_progress":
      return "In Arbeit";
    case "completed":
      return "Abgeschlossen";
    case "cancelled":
      return "Storniert";
    default:
      return str(status) ?? "—";
  }
}

export function jobStatusVariant(
  status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  switch ((status ?? "").toLowerCase()) {
    case "completed":
      return "default";
    case "in_progress":
    case "scheduled":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export function jobItemTypeLabel(type: string | null | undefined) {
  switch ((type ?? "").toLowerCase()) {
    case "material":
      return "Material";
    case "labor":
    case "service":
      return "Leistung";
    case "travel":
      return "Anfahrt";
    default:
      return str(type) ?? "—";
  }
}

/** "HH:MM" or "HH:MM:SS" -> value for <input type="time">, otherwise "". */
export function toTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const match = /^(\d{2}):(\d{2})/.exec(value.trim());
  return match ? `${match[1]}:${match[2]}` : "";
}

export function fromTimeInput(value: string): string | null {
  const raw = value.trim();
  return /^\d{2}:\d{2}(:\d{2})?$/.test(raw) ? raw.slice(0, 5) : null;
}

export function formatTime(value: string | null | undefined) {
  const time = toTimeInput(value);
  return time ? `${time} Uhr` : "—";
}

export function formatMinutes(minutes: number | null | undefined) {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "—";
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} Min.`;
  return `${hours} Std. ${String(rest).padStart(2, "0")} Min.`;
}

export const invoiceStatusOptions = ["draft", "sent", "paid", "overdue", "cancelled"] as const;

export type InvoiceStatus = (typeof invoiceStatusOptions)[number];

export function invoiceStatusLabel(status: string | null | undefined) {
  switch ((status ?? "").toLowerCase()) {
    case "draft":
      return "Entwurf";
    case "sent":
      return "Gesendet";
    case "paid":
      return "Bezahlt";
    case "overdue":
      return "Überfällig";
    case "cancelled":
      return "Storniert";
    default:
      return str(status) ?? "—";
  }
}

export function invoiceStatusVariant(
  status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  switch ((status ?? "").toLowerCase()) {
    case "paid":
      return "default";
    case "sent":
      return "secondary";
    case "overdue":
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export const paymentMethodOptions = ["bank_transfer", "cash", "card", "other"] as const;

export type PaymentMethod = (typeof paymentMethodOptions)[number];

export function paymentMethodLabel(method: string | null | undefined) {
  switch ((method ?? "").toLowerCase()) {
    case "bank_transfer":
      return "Überweisung";
    case "cash":
      return "Bar";
    case "card":
      return "Karte";
    case "other":
      return "Sonstiges";
    default:
      return str(method) ?? "—";
  }
}

export const taskStatusOptions = ["open", "done", "cancelled"] as const;

export type TaskStatus = (typeof taskStatusOptions)[number];

export function taskStatusLabel(status: string | null | undefined) {
  switch ((status ?? "").toLowerCase()) {
    case "open":
      return "Offen";
    case "done":
      return "Erledigt";
    case "cancelled":
      return "Abgebrochen";
    default:
      return str(status) ?? "—";
  }
}

export function taskStatusVariant(
  status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  switch ((status ?? "").toLowerCase()) {
    case "done":
      return "default";
    case "open":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export const taskTypeOptions = [
  "general",
  "callback",
  "follow_up",
  "collection",
  "maintenance",
  "handoff",
] as const;

export type TaskType = (typeof taskTypeOptions)[number];

export function taskTypeLabel(type: string | null | undefined) {
  switch ((type ?? "").toLowerCase()) {
    case "general":
      return "Allgemein";
    case "callback":
      return "Rückruf";
    case "follow_up":
      return "Nachfassen";
    case "collection":
      return "Mahnung";
    case "maintenance":
      return "Wartung";
    case "handoff":
      return "Übergabe";
    default:
      return str(type) ?? "—";
  }
}

export function priorityVariant(
  priority: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  switch ((priority ?? "").toLowerCase()) {
    case "urgent":
      return "destructive";
    case "high":
      return "secondary";
    default:
      return "outline";
  }
}

/** True when an open task's due date lies in the past. */
export function isTaskOverdue(status: string | null | undefined, dueAt: string | null | undefined) {
  if ((status ?? "").toLowerCase() !== "open" || !dueAt) return false;
  const date = new Date(dueAt);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

/**
 * Formatiert rohe Beträge aus Suchergebnis-Untertiteln
 * (z. B. "297.5000000000000000 EUR") als deutsche Währung ("297,50 €").
 */
export function formatSubtitleAmounts(subtitle: string | null | undefined): string | null {
  if (!subtitle) return null;
  return subtitle.replace(/(-?\d+(?:\.\d+)?)\s*(EUR|€)\b/gi, (match, amount: string) => {
    const value = Number(amount);
    return Number.isFinite(value) ? euroFormatter.format(value) : match;
  });
}
