const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

const INTERNAL_FIELD_RE =
  /\b(?:company_id|lead_id|conversation_id|appointment_id|target_appointment_id|cancellation_target_appointment_id|reschedule_target_appointment_id|reschedule_selection_pending|reschedule_new_date|reschedule_new_start_time|reschedule_confirmation_received|pending_appointment_date|pending_start_time|draft_appointment_date|draft_start_time)\b/i;

const PHOTO_ACTION_RE = /^(?:__action_)?upload(?:[_ -]?a)?[_ -]?photo$/i;

export function isUploadPhotoAction(value: unknown, label?: unknown): boolean {
  const action = typeof value === "string" ? value.trim() : "";
  if (PHOTO_ACTION_RE.test(action)) return true;

  const caption = typeof label === "string" ? label.trim().toLocaleLowerCase() : "";
  return /^(?:upload (?:a )?photo|foto (?:auswählen|hochladen)|bild (?:auswählen|hochladen))$/.test(
    caption,
  );
}

export function customerSafeText(value: unknown): string {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text || isUploadPhotoAction(text)) return "";

  return text
    .split(/\r?\n/)
    .filter((line) => !INTERNAL_FIELD_RE.test(line) && !PHOTO_ACTION_RE.test(line.trim()))
    .join("\n")
    .replace(UUID_RE, "")
    .replace(/\[object Object\]/gi, "")
    .replace(/\{\s*\}|\[\s*\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;!?])/g, "$1")
    .trim();
}
