import { totalTaxCents, verifySignature } from "./stripe.ts";

function assertEquals(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, received ${String(actual)}`);
  }
}

async function signature(payload: string, timestamp: number, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.test("sums Stripe tax amount entries", () => {
  assertEquals(totalTaxCents([{ amount: 1_900 }, { amount: 95 }, { amount: "invalid" }]), 1_995);
  assertEquals(totalTaxCents(null), 0);
});

Deno.test("accepts a current valid Stripe signature", async () => {
  const timestamp = 1_800_000_000;
  const now = timestamp * 1_000;
  const payload = '{"id":"evt_test"}';
  const secret = "whsec_test";
  const digest = await signature(payload, timestamp, secret);
  assertEquals(await verifySignature(payload, `t=${timestamp},v1=${digest}`, secret, now), true);
});

Deno.test("rejects altered and stale Stripe signatures", async () => {
  const timestamp = 1_800_000_000;
  const payload = '{"id":"evt_test"}';
  const secret = "whsec_test";
  const digest = await signature(payload, timestamp, secret);
  assertEquals(
    await verifySignature(`${payload}x`, `t=${timestamp},v1=${digest}`, secret, timestamp * 1_000),
    false,
  );
  assertEquals(
    await verifySignature(
      payload,
      `t=${timestamp},v1=${digest}`,
      secret,
      (timestamp + 301) * 1_000,
    ),
    false,
  );
});
