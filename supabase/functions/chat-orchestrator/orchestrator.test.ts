import {
  appointmentChoices,
  availabilityReply,
  containsAcuteDanger,
  rescheduleMutationSucceeded,
  resolveAppointmentTarget,
  resolveConfiguredService,
  securityReply,
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
    { id: "11111111-1111-4111-8111-111111111111" },
    { id: "22222222-2222-4222-8222-222222222222" },
  ];
  if (resolveAppointmentTarget(rows[1]!.id, rows)?.id !== rows[1]!.id)
    throw new Error("target missed");
  if (resolveAppointmentTarget("33333333-3333-4333-8333-333333333333", rows) !== null) {
    throw new Error("unknown target trusted");
  }
  if (appointmentChoices(rows, "absagen").length !== 2) throw new Error("choices missing");
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
