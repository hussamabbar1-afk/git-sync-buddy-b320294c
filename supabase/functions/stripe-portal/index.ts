import { withSupabase } from "npm:@supabase/server@^1";

type JsonObject = Record<string, unknown>;

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") return Response.json({ ok: false }, { status: 405 });
    const secret = Deno.env.get("STRIPE_SECRET_KEY")?.trim() ?? "";
    if (!secret.startsWith("sk_test_")) {
      return Response.json({ ok: false, code: "stripe_test_not_configured" }, { status: 503 });
    }
    const claims = ctx.userClaims as JsonObject | undefined;
    const userId = String(claims?.sub ?? claims?.id ?? "");
    const { data: profile } = await ctx.supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.company_id || !["owner", "admin"].includes(profile.role)) {
      return Response.json({ ok: false, code: "admin_required" }, { status: 403 });
    }
    const { data: account } = await ctx.supabaseAdmin
      .from("billing_accounts")
      .select("stripe_customer_id, test_mode")
      .eq("company_id", profile.company_id)
      .maybeSingle();
    if (!account?.stripe_customer_id || account.test_mode !== true) {
      return Response.json({ ok: false, code: "billing_account_missing" }, { status: 409 });
    }
    const params = new URLSearchParams({
      customer: account.stripe_customer_id,
      return_url: "https://zunftecho.de/abonnement",
    });
    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      signal: AbortSignal.timeout(15_000),
    });
    const result = (await response.json().catch(() => ({}))) as JsonObject;
    const url = typeof result.url === "string" ? result.url : "";
    if (!response.ok || !url.startsWith("https://billing.stripe.com/")) {
      return Response.json({ ok: false, code: "stripe_portal_failed" }, { status: 502 });
    }
    return Response.json({ ok: true, url, test_mode: true });
  }),
};
