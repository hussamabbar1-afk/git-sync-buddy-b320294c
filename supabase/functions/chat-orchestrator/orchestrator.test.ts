import {
  appointmentChoices,
  appointmentActionSummary,
  availabilityReply,
  containsAcuteDanger,
  hasExplicitAppointmentSignal,
  isPhotoUploadQuestion,
  normalizeIssueType,
  normalizeQuickReplyAction,
  PHOTO_UPLOAD_ACTION,
  rescheduleMutationSucceeded,
  resolveAppointmentTarget,
  resolveConfiguredService,
  securityReply,
  shouldEscalateSentiment,
  stripInternalIdentifiers,
  validIsoDate,
  validTime,
  companyLocalDate,
} from "./orchestrator.ts";

Deno.test("normalizes dates and times", () => {
  if (validIsoDate("2026-09-10") !== "2026-09-10") throw new Error("date rejected");
  if (validIsoDate("2026-02-31") !== null) throw new Error("invalid date accepted");
  if (validTime("8:05") !== "08:05:00") throw new Error("time not normalized");
  if (validTime("25:00") !== null) throw new Error("invalid time accepted");
});

Deno.test("requires an explicit first-turn appointment signal", () => {
  const positives = [
    "Ich möchte einen Termin für die Heizungswartung.",
    "Could you send a technician tomorrow?",
    "أريد حجز موعد لصيانة التدفئة",
    "Je voudrais réserver un rendez-vous.",
    "Chcę umówić wizytę.",
  ];
  const negatives = [
    "Meine Heizung ist seit heute ausgefallen und die Wohnung ist kalt.",
    "My heating stopped today. My email is jane@example.invalid.",
    "Die Störung begann gestern um 10:00 Uhr.",
  ];
  if (positives.some((message) => !hasExplicitAppointmentSignal(message))) {
    throw new Error("explicit appointment signal missed");
  }
  if (negatives.some((message) => hasExplicitAppointmentSignal(message))) {
    throw new Error("problem details treated as an appointment request");
  }
});

Deno.test("resolves only configured services", () => {
  const services = [
    { name: "Heizungsreparatur", description: "Reparatur einer defekten Heizung" },
    { name: "Rohrreinigung", description: "Abfluss und Rohr reinigen" },
  ];
  if (resolveConfiguredService("Heizungsreparatur", services) !== "Heizungsreparatur") {
    throw new Error("exact service not resolved");
  }
  if (resolveConfiguredService("Abfluss reinigen", services) !== "Rohrreinigung") {
    throw new Error("semantic service not resolved");
  }
  if (resolveConfiguredService("Dach decken", services) !== null) {
    throw new Error("unknown service invented");
  }
});

Deno.test("appointment target never trusts an unknown id", () => {
  const rows = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      appointment_date: "2026-09-10",
      start_time: "08:00:00",
      service_type: "Heizungsreparatur",
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      appointment_date: "2026-09-11",
      start_time: "09:30:00",
      service_type: "Rohrreinigung",
    },
  ];
  if (resolveAppointmentTarget(rows[1]!.id, rows)?.id !== rows[1]!.id)
    throw new Error("target missed");
  if (resolveAppointmentTarget("33333333-3333-4333-8333-333333333333", rows) !== null) {
    throw new Error("unknown target trusted");
  }
  if (
    resolveAppointmentTarget("", rows, {
      date: "2026-09-11",
      start_time: "09:30",
      service: "Rohrreinigung",
    })?.id !== rows[1]!.id
  ) {
    throw new Error("human-readable appointment target not resolved");
  }
  const choices = appointmentChoices(rows, "absagen");
  if (choices.length !== 2) throw new Error("choices missing");
  if (
    choices.some(
      (choice) => choice.value.includes("Termin-ID") || /[0-9a-f-]{36}/i.test(choice.value),
    )
  ) {
    throw new Error("appointment id leaked through quick reply");
  }
});

Deno.test("appointment summaries are explicit and never expose internal ids", () => {
  const appointment = {
    id: "11111111-1111-4111-8111-111111111111",
    appointment_date: "2026-09-10",
    start_time: "08:00:00",
    service_type: "Heizungsreparatur",
  };
  const summary = appointmentActionSummary({
    status: "Verbindlich bestätigt",
    appointment,
    nextStep: "Der Betrieb meldet sich bei Änderungen.",
  });
  if (!summary.includes("Status: Verbindlich bestätigt") || !summary.includes("Termin:")) {
    throw new Error("appointment summary incomplete");
  }
  if (summary.includes(appointment.id)) throw new Error("appointment summary leaked an id");
  if (stripInternalIdentifiers(`Termin-ID: ${appointment.id} bestätigt`).includes(appointment.id)) {
    throw new Error("identifier sanitizer failed");
  }
  const technical = stripInternalIdentifiers(
    `Bitte bestätigen.\nreschedule_target_appointment_id: ${appointment.id}\n[object Object]`,
  );
  if (technical !== "Bitte bestätigen.") throw new Error(`technical artifact leaked: ${technical}`);
});

Deno.test("accepts the atomic reschedule RPC success contract", () => {
  if (!rescheduleMutationSucceeded({ updated: true, reason: "rescheduled" })) {
    throw new Error("current RPC success contract rejected");
  }
  if (!rescheduleMutationSucceeded({ rescheduled: true })) {
    throw new Error("legacy RPC success contract rejected");
  }
  if (rescheduleMutationSucceeded({ updated: false })) {
    throw new Error("failed reschedule accepted");
  }
});

Deno.test("danger and customer-safe fallback messages", () => {
  if (!containsAcuteDanger("Ich rieche Gas, was soll ich tun?")) throw new Error("danger missed");
  if (containsAcuteDanger("Es gibt keinen Gasgeruch.")) throw new Error("negation ignored");
  if (!containsAcuteDanger("Kein Gasgeruch, aber es brennt!"))
    throw new Error("separate danger masked");
  if (!securityReply("rate_limited").includes("später")) throw new Error("rate message missing");
  if (!availabilityReply("conflict").includes("nicht mehr verfügbar"))
    throw new Error("conflict message missing");
});

Deno.test("uses the company date at the UTC midnight boundary", () => {
  if (companyLocalDate("Europe/Berlin", new Date("2026-09-06T22:30:00Z")) !== "2026-09-07")
    throw new Error("local date shifted");
});

Deno.test("escalates only unmistakably angry customers", () => {
  if (!shouldEscalateSentiment("angry")) throw new Error("angry customer not escalated");
  if (shouldEscalateSentiment("frustrated")) throw new Error("frustration escalated too early");
  if (shouldEscalateSentiment("neutral")) throw new Error("neutral customer escalated");
});

Deno.test("normalizes appointment labels and photo upload actions", () => {
  if (
    normalizeQuickReplyAction("mit_mitarbeiter_sprechen", "Mit Mitarbeiter sprechen") !==
    "Mit Mitarbeiter sprechen"
  )
    throw new Error("internal action leaked");
  if (normalizeIssueType("Appointment") !== "Terminbuchung") {
    throw new Error("English appointment label leaked");
  }
  if (normalizeIssueType("Terminbuchung") !== "Terminbuchung") {
    throw new Error("German issue type changed");
  }
  if (normalizeQuickReplyAction("upload_photo", "Upload a Photo") !== PHOTO_UPLOAD_ACTION) {
    throw new Error("legacy upload action not normalized");
  }
  if (!isPhotoUploadQuestion("Can I upload a photo for the employee?")) {
    throw new Error("English photo question missed");
  }
  if (isPhotoUploadQuestion("Ich habe ein Foto hochgeladen.")) {
    throw new Error("completed upload treated as a new question");
  }
  if (stripInternalIdentifiers("upload_photo") !== "upload_photo") {
    throw new Error("sanitizer unexpectedly corrupted action before normalization");
  }
});
