import { withSupabase } from "npm:@supabase/server@^1";

type JsonObject = Record<string, unknown>;

class CheckoutFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function text(value: unknown, max = 300): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function requiredTestSecret(): string {
  const secret = Deno.env.get("STRIPE_SECRET_KEY")?.trim() ?? "";
  if (!secret.startsWith("sk_test_")) {
    throw new CheckoutFailure(
      503,
      "stripe_test_not_configured",
      "Stripe ist noch nicht im Testmodus verbunden.",
    );
  }
  return secret;
}

async function stripePost(
  path: string,
  params: URLSearchParams,
  secret: string,
): Promise<JsonObject> {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    signal: AbortSignal.timeout(15_000),
  });
  const payload = (await response.json().catch(() => ({}))) as JsonObject;
  if (!response.ok) {
    const error = payload.error && typeof payload.error === "object" ? payload.error : {};
    const message = text((error as JsonObject).message) || "Stripe request failed";
    throw new CheckoutFailure(502, "stripe_request_failed", message);
  }
  return payload;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") {
      return Response.json({ ok: false, code: "method_not_allowed" }, { status: 405 });
    }

    try {
      const payload = (await request.json().catch(() => ({}))) as JsonObject;
      const plan = payload.plan === "pilot" || payload.plan === "monthly" ? payload.plan : null;
      if (!plan) throw new CheckoutFailure(400, "invalid_plan", "Ungültiger Tarif.");

      const claims = ctx.userClaims as unknown as JsonObject | undefined;
      const userId = text(claims?.sub ?? claims?.id, 80);
      if (!isUuid(userId)) {
        throw new CheckoutFailure(401, "authentication_required", "Anmeldung erforderlich.");
      }

      const { data: profile, error: profileError } = await ctx.supabase
        .from("profiles")
        .select("company_id, role")
        .eq("id", userId)
        .maybeSingle();
      if (profileError || !profile?.company_id) {
        throw new CheckoutFailure(403, "company_required", "Unternehmensprofil erforderlich.");
      }
      if (profile.role !== "owner" && profile.role !== "admin") {
        throw new CheckoutFailure(
          403,
          "admin_required",
          "Nur Eigentümer und Administratoren können einen Tarif buchen.",
        );
      }

      const companyId = String(profile.company_id);
      const [{ data: company, error: companyError }, { data: billingAccount }] = await Promise.all([
        ctx.supabase
          .from("companies")
          .select("name, legal_name, email")
          .eq("id", companyId)
          .maybeSingle(),
        ctx.supabaseAdmin
          .from("billing_accounts")
          .select("stripe_customer_id")
          .eq("company_id", companyId)
          .maybeSingle(),
      ]);
      if (companyError || !company) {
        throw new CheckoutFailure(404, "company_not_found", "Unternehmen nicht gefunden.");
      }

      const secret = requiredTestSecret();
      let customerId = text(billingAccount?.stripe_customer_id, 120);
      if (!customerId) {
        const customerParams = new URLSearchParams();
        customerParams.set(
          "name",
          text(company.legal_name) || text(company.name) || "ZunftEcho Kunde",
        );
        if (text(company.email)) customerParams.set("email", text(company.email));
        customerParams.set("metadata[company_id]", companyId);
        customerParams.set("metadata[source]", "zunftecho");
        const customer = await stripePost("customers", customerParams, secret);
        customerId = text(customer.id, 120);
        if (!customerId)
          throw new CheckoutFailure(502, "stripe_customer_failed", "Stripe-Kunde fehlt.");

        const { error: accountError } = await ctx.supabaseAdmin.from("billing_accounts").upsert({
          company_id: companyId,
          stripe_customer_id: customerId,
          test_mode: true,
          updated_at: new Date().toISOString(),
        });
        if (accountError) throw accountError;
      }

      const amount = plan === "pilot" ? 9_900 : 14_900;
      const sessionParams = new URLSearchParams();
      sessionParams.set("mode", plan === "pilot" ? "payment" : "subscription");
      sessionParams.set("customer", customerId);
      sessionParams.set("client_reference_id", companyId);
      sessionParams.set("success_url", "https://zunftecho.de/abonnement?checkout=success");
      sessionParams.set("cancel_url", "https://zunftecho.de/abonnement?checkout=cancelled");
      sessionParams.set("locale", "de");
      sessionParams.set("billing_address_collection", "required");
      sessionParams.set("tax_id_collection[enabled]", "true");
      sessionParams.set("customer_update[address]", "auto");
      sessionParams.set("customer_update[name]", "auto");
      sessionParams.set("automatic_payment_methods[enabled]", "true");
      sessionParams.set("allow_promotion_codes", "true");
      sessionParams.set("consent_collection[terms_of_service]", "required");
      sessionParams.set(
        "custom_text[terms_of_service_acceptance][message]",
        "Ich akzeptiere die AGB unter https://zunftecho.de/agb.",
      );
      sessionParams.set("metadata[company_id]", companyId);
      sessionParams.set("metadata[plan]", plan);
      sessionParams.set("metadata[test_mode]", "true");
      sessionParams.set("line_items[0][quantity]", "1");
      sessionParams.set("line_items[0][price_data][currency]", "eur");
      sessionParams.set("line_items[0][price_data][unit_amount]", String(amount));
      sessionParams.set(
        "line_items[0][price_data][product_data][name]",
        plan === "pilot" ? "ZunftEcho 30-Tage-Pilot" : "ZunftEcho Regelbetrieb",
      );
      sessionParams.set(
        "line_items[0][price_data][product_data][description]",
        plan === "pilot"
          ? "Einmaliger 30-Tage-Pilot inklusive persönlicher Einrichtung"
          : "Monatlich kündbarer ZunftEcho-Regelbetrieb",
      );

      if (plan === "pilot") {
        sessionParams.set("invoice_creation[enabled]", "true");
        sessionParams.set("payment_intent_data[metadata][company_id]", companyId);
        sessionParams.set("payment_intent_data[metadata][plan]", plan);
      } else {
        sessionParams.set("line_items[0][price_data][recurring][interval]", "month");
        sessionParams.set("subscription_data[metadata][company_id]", companyId);
        sessionParams.set("subscription_data[metadata][plan]", plan);
      }

      const session = await stripePost("checkout/sessions", sessionParams, secret);
      const url = text(session.url, 2_000);
      if (!url.startsWith("https://checkout.stripe.com/")) {
        throw new CheckoutFailure(502, "checkout_url_missing", "Checkout-Adresse fehlt.");
      }

      return Response.json({ ok: true, url, plan, test_mode: true });
    } catch (error) {
      console.error("stripe-checkout", error instanceof Error ? error.message : "unknown");
      const failure =
        error instanceof CheckoutFailure
          ? error
          : new CheckoutFailure(500, "checkout_failed", "Checkout konnte nicht gestartet werden.");
      return Response.json(
        { ok: false, code: failure.code, message: failure.message },
        { status: failure.status },
      );
    }
  }),
};
