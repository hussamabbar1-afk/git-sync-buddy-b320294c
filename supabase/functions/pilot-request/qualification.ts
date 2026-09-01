export const TEAM_SIZE_RANGES = ["solo", "2-5", "6-10", "11-plus"] as const;
export const INQUIRY_VOLUME_RANGES = ["0-5", "6-15", "16-30", "31-plus", "unknown"] as const;
export const PRIMARY_CHALLENGES = [
  "incomplete-details",
  "slow-response",
  "appointment-coordination",
  "callback-load",
  "other",
] as const;
export const START_WINDOWS = ["after-clearance", "september", "october", "later"] as const;

type QualificationValue = (typeof TEAM_SIZE_RANGES)[number];
type InquiryVolumeValue = (typeof INQUIRY_VOLUME_RANGES)[number];
type ChallengeValue = (typeof PRIMARY_CHALLENGES)[number];
type StartWindowValue = (typeof START_WINDOWS)[number];

export type PilotQualification = {
  teamSizeRange: QualificationValue | null;
  inquiryVolumeRange: InquiryVolumeValue | null;
  primaryChallenge: ChallengeValue | null;
  preferredStartWindow: StartWindowValue | null;
  auditRequested: boolean;
};

function optionalChoice<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error("invalid_qualification");
  }
  return value as T;
}

export function parsePilotQualification(payload: Record<string, unknown>): PilotQualification {
  if (
    payload.audit_requested !== undefined &&
    payload.audit_requested !== true &&
    payload.audit_requested !== false
  ) {
    throw new Error("invalid_qualification");
  }

  return {
    teamSizeRange: optionalChoice(payload.team_size_range, TEAM_SIZE_RANGES),
    inquiryVolumeRange: optionalChoice(payload.monthly_inquiry_range, INQUIRY_VOLUME_RANGES),
    primaryChallenge: optionalChoice(payload.primary_challenge, PRIMARY_CHALLENGES),
    preferredStartWindow: optionalChoice(payload.preferred_start_window, START_WINDOWS),
    auditRequested: payload.audit_requested === true,
  };
}
