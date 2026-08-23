// Captures a Supabase implicit-flow recovery hash synchronously, before the
// Supabase client (detectSessionInUrl) can consume and strip it from the URL.
let capturedRecoveryHash: string | null = null;

function parseRecoveryHash(hash: string): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const isRecovery = params.get("type") === "recovery";
  const hasToken = Boolean(params.get("access_token")) || Boolean(params.get("refresh_token"));
  return isRecovery && hasToken ? `#${raw}` : null;
}

// Runs at module evaluation time (imported first in src/main.tsx).
export function captureRecoveryHash(): void {
  if (typeof window === "undefined") return;
  if (capturedRecoveryHash) return;
  capturedRecoveryHash = parseRecoveryHash(window.location.hash);
}

export function takeRecoveryHash(): string | null {
  if (typeof window === "undefined") return null;
  // Prefer a still-present hash in the URL, else the captured one.
  return parseRecoveryHash(window.location.hash) ?? capturedRecoveryHash;
}

export function isRecoveryLanding(): boolean {
  return takeRecoveryHash() !== null;
}
