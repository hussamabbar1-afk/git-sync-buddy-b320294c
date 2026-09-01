import { parsePilotQualification } from "./qualification.ts";

Deno.test("accepts structured founding-pilot qualification", () => {
  const parsed = parsePilotQualification({
    team_size_range: "2-5",
    monthly_inquiry_range: "6-15",
    primary_challenge: "incomplete-details",
    preferred_start_window: "september",
    audit_requested: true,
  });

  if (parsed.teamSizeRange !== "2-5") throw new Error("team size not parsed");
  if (parsed.inquiryVolumeRange !== "6-15") throw new Error("volume not parsed");
  if (parsed.primaryChallenge !== "incomplete-details") throw new Error("challenge not parsed");
  if (parsed.preferredStartWindow !== "september") throw new Error("start window not parsed");
  if (!parsed.auditRequested) throw new Error("audit request not parsed");
});

Deno.test("keeps old clients compatible and rejects invented values", () => {
  const empty = parsePilotQualification({});
  if (empty.teamSizeRange !== null || empty.auditRequested) {
    throw new Error("empty qualification should be safe");
  }

  let rejected = false;
  try {
    parsePilotQualification({ primary_challenge: "guaranteed-sales" });
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("unknown qualification value accepted");
});
