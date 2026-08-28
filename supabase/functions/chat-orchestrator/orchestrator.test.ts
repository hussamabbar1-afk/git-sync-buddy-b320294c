import {
  appointmentChoices,
  appointmentActionSummary,
  availabilityReply,
  containsAcuteDanger,
  rescheduleMutationSucceeded,
  resolveAppointmentTarget,
  resolveConfiguredService,
  securityReply,
  shouldEscalateSentiment,
  stripInternalIdentifiers,
  validIsoDate,
  validTime,
} from "./orchestrator.ts";

Deno.test("normalizes dates and times", () => {
  if (validIsoDate("2026-09-10") !== "2026-09-10") throw new Error("date rejected");
  if (validIsoDate("2026-02-31") !== null) throw new Error("invalid date accepted");
  if (validTime("8:05") !== "08:05:00") throw new Error("time not normalized");
  if (validTime("25:00") !== null) throw new Error("invalid time accepted");
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
  if (!securityReply("rate_limited").includes("später")) throw new Error("rate message missing");
  if (!availabilityReply("conflict").includes("nicht mehr verfügbar"))
    throw new Error("conflict message missing");
});

Deno.test("escalates only unmistakably angry customers", () => {
  if (!shouldEscalateSentiment("angry")) throw new Error("angry customer not escalated");
  if (shouldEscalateSentiment("frustrated")) throw new Error("frustration escalated too early");
  if (shouldEscalateSentiment("neutral")) throw new Error("neutral customer escalated");
});
