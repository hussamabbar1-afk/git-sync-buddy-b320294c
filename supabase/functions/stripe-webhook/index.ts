import { withSupabase } from "npm:@supabase/server@^1";

import { totalTaxCents, verifySignature } from "./stripe.ts";

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function text(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isoFromUnix(value: unknown): string | null {
  const seconds = number(value);
  return seconds > 0 ? new Date(seconds * 1_000).toISOString() : null;
}

function ensureWriteSucceeded(result: { error: { message: string } | null }, operation: string) {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
}

function subscriptionPeriod(subscription: JsonObject) {
  const items = object(subscription.items);
  const first = Array.isArray(items.data) ? object(items.data[0]) : {};
  return {
    start: isoFromUnix(subscription.current_period_start ?? first.current_period_start),
    end: isoFromUnix(subscription.current_period_end ?? first.current_period_end),
  };
}

function subscriptionStatus(value: unknown): string {
  const status = text(value, 40);
  if (status === "canceled") return "cancelled";
  if (
    ["incomplete", "trialing", "active", "past_due", "unpaid", "paused", "cancelled"].includes(
      status,
    )
  ) {
    return status;
  }
  return "incomplete";
}

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    if (request.method !== "POST") {
      return Response.json({ ok: false, code: "method_not_allowed" }, { status: 405 });
    }

    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim() ?? "";
    if (!secret.startsWith("whsec_")) {
      return Response.json({ ok: false, code: "webhook_not_configured" }, { status: 503 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    if (!(await verifySignature(rawBody, signature, secret))) {
      return Response.json({ ok: false, code: "invalid_signature" }, { status: 400 });
    }

    let event: JsonObject;
    try {
      event = object(JSON.parse(rawBody));
    } catch {
      return Response.json({ ok: false, code: "invalid_json" }, { status: 400 });
    }

    const eventId = text(event.id, 200);
    const eventType = text(event.type, 120);
    const eventData = object(event.data);
    const stripeObject = object(eventData.object);
    const objectId = text(stripeObject.id, 200) || null;
    if (!eventId || !eventType) {
      return Response.json({ ok: false, code: "invalid_event" }, { status: 400 });
    }
    if (event.livemode === true) {
      console.error("stripe-webhook-live-event-rejected", eventId);
      return Response.json({ ok: false, code: "live_event_rejected" }, { status: 400 });
    }

    const admin = ctx.supabaseAdmin;
    const insertEvent = await admin
      .schema("private")
      .from("stripe_webhook_events")
      .insert({
        stripe_event_id: eventId,
        event_type: eventType,
        object_id: objectId,
        livemode: event.livemode === true,
        status: "processing",
      });
    if (insertEvent.error) {
      if (insertEvent.error.code === "23505") {
        return Response.json({ ok: true, duplicate: true });
      }
      console.error("stripe-webhook-event-insert", insertEvent.error.message);
      return Response.json({ ok: false, code: "event_store_failed" }, { status: 500 });
    }

    try {
      const metadata = object(stripeObject.metadata);
      const customerId = text(stripeObject.customer, 200);
      let companyId = text(metadata.company_id, 80) || text(stripeObject.client_reference_id, 80);

      if (!companyId && customerId) {
        const { data: account } = await admin
          .from("billing_accounts")
          .select("company_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        companyId = text(account?.company_id, 80);
      }

      if (eventType.startsWith("checkout.session.") && companyId) {
        if (customerId) {
          const billingWrite = await admin.from("billing_accounts").upsert({
            company_id: companyId,
            stripe_customer_id: customerId,
            test_mode: event.livemode !== true,
            updated_at: new Date().toISOString(),
          });
          ensureWriteSucceeded(billingWrite, "billing account update failed");
        }

        const plan = text(metadata.plan, 30) === "monthly" ? "monthly" : "pilot";
        if (plan === "pilot") {
          const paid =
            stripeObject.payment_status === "paid" ||
            eventType === "checkout.session.async_payment_succeeded";
          const failed = eventType === "checkout.session.async_payment_failed";
          const startedAt = new Date();
          const endsAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1_000);
          const pilotWrite = await admin.from("company_subscriptions").upsert({
            company_id: companyId,
            stripe_subscription_id: null,
            plan: "pilot",
            status: failed ? "past_due" : paid ? "active" : "incomplete",
            amount_cents: number(stripeObject.amount_total) || 9_900,
            currency: text(stripeObject.currency, 3) || "eur",
            current_period_start: paid ? startedAt.toISOString() : null,
            current_period_end: paid ? endsAt.toISOString() : null,
            cancel_at_period_end: false,
            test_mode: event.livemode !== true,
            updated_at: new Date().toISOString(),
          });
          ensureWriteSucceeded(pilotWrite, "pilot subscription update failed");
        }
      }

      if (eventType.startsWith("customer.subscription.") && companyId) {
        const period = subscriptionPeriod(stripeObject);
        const metadataPlan = text(metadata.plan, 30);
        const subscriptionWrite = await admin.from("company_subscriptions").upsert({
          company_id: companyId,
          stripe_subscription_id: objectId,
          plan: metadataPlan === "pilot" ? "pilot" : "monthly",
          status: subscriptionStatus(stripeObject.status),
          amount_cents: 14_900,
          currency: text(stripeObject.currency, 3) || "eur",
          current_period_start: period.start,
          current_period_end: period.end,
          cancel_at_period_end: stripeObject.cancel_at_period_end === true,
          test_mode: event.livemode !== true,
          updated_at: new Date().toISOString(),
        });
        ensureWriteSucceeded(subscriptionWrite, "subscription update failed");
      }

      if (eventType.startsWith("invoice.") && companyId && objectId) {
        const parent = object(stripeObject.parent);
        const subscriptionDetails = object(parent.subscription_details);
        const subscriptionId =
          text(stripeObject.subscription, 200) ||
          text(subscriptionDetails.subscription, 200) ||
          null;
        const statusTransitions = object(stripeObject.status_transitions);
        const invoiceWrite = await admin.from("subscription_invoices").upsert({
          company_id: companyId,
          stripe_invoice_id: objectId,
          stripe_subscription_id: subscriptionId,
          invoice_number: text(stripeObject.number, 120) || null,
          status: text(stripeObject.status, 60) || "draft",
          currency: text(stripeObject.currency, 3) || "eur",
          amount_due_cents: number(stripeObject.amount_due),
          amount_paid_cents: number(stripeObject.amount_paid),
          tax_cents: totalTaxCents(stripeObject.total_tax_amounts),
          hosted_invoice_url: text(stripeObject.hosted_invoice_url, 2_000) || null,
          invoice_pdf: text(stripeObject.invoice_pdf, 2_000) || null,
          period_start: isoFromUnix(stripeObject.period_start),
          period_end: isoFromUnix(stripeObject.period_end),
          paid_at: isoFromUnix(statusTransitions.paid_at),
          test_mode: event.livemode !== true,
          updated_at: new Date().toISOString(),
        });
        ensureWriteSucceeded(invoiceWrite, "subscription invoice update failed");
      }

      const processedWrite = await admin
        .schema("private")
        .from("stripe_webhook_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("stripe_event_id", eventId);
      ensureWriteSucceeded(processedWrite, "webhook event completion failed");

      return Response.json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "processing_failed";
      console.error("stripe-webhook", message);
      await admin
        .schema("private")
        .from("stripe_webhook_events")
        .update({
          status: "failed",
          error_message: message,
          processed_at: new Date().toISOString(),
        })
        .eq("stripe_event_id", eventId);
      return Response.json({ ok: false, code: "processing_failed" }, { status: 500 });
    }
  }),
};
