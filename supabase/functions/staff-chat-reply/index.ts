import { withSupabase } from "npm:@supabase/server@^1";

type JsonObject = Record<string, unknown>;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") {
      return Response.json({ ok: false, code: "method_not_allowed" }, { status: 405 });
    }

    try {
      const payload = (await request.json().catch(() => ({}))) as JsonObject;
      const conversationId = clean(payload.conversation_id, 80);
      const message = clean(payload.message, 4_000);
      if (!uuidPattern.test(conversationId) || !message) {
        return Response.json({ ok: false, code: "invalid_request" }, { status: 400 });
      }

      const claims = ctx.userClaims as JsonObject | undefined;
      const userId = clean(claims?.sub ?? claims?.id, 80);
      const { data: profile } = await ctx.supabase
        .from("profiles")
        .select("company_id, full_name")
        .eq("id", userId)
        .maybeSingle();
      if (!profile?.company_id) {
        return Response.json({ ok: false, code: "company_required" }, { status: 403 });
      }

      const { data: conversation } = await ctx.supabase
        .from("conversations")
        .select("id, company_id, customer_id, visitor_email, visitor_name")
        .eq("id", conversationId)
        .eq("company_id", profile.company_id)
        .maybeSingle();
      if (!conversation) {
        return Response.json({ ok: false, code: "conversation_not_found" }, { status: 404 });
      }

      const now = new Date().toISOString();
      const { data: inserted, error: insertError } = await ctx.supabaseAdmin
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: message,
          customer_visible_content: message,
          source_channel: "manual",
          translation_status: "not_needed",
        })
        .select("id, created_at")
        .single();
      if (insertError) throw insertError;

      await Promise.all([
        ctx.supabaseAdmin
          .from("conversations")
          .update({
            status: "open",
            handoff_requested_at: null,
            handoff_reason: null,
            updated_at: now,
          })
          .eq("id", conversationId),
        ctx.supabaseAdmin
          .from("leads")
          .update({ human_handoff_pending: false, human_handoff_reason: null, updated_at: now })
          .eq("conversation_id", conversationId),
      ]);

      const recipient = clean(conversation.visitor_email, 254).toLowerCase();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
      if (emailValid) {
        const sender = clean(profile.full_name, 120) || "Ihr Ansprechpartner";
        await ctx.supabaseAdmin.from("outbound_messages").insert({
          company_id: profile.company_id,
          customer_id: conversation.customer_id,
          channel: "email",
          purpose: "operational",
          locale: "de",
          recipient,
          subject: "Antwort zu Ihrer Anfrage",
          body: `${message}\n\nFreundliche Grüße\n${sender}`,
          status: "queued",
          entity_type: "conversation",
          entity_id: conversationId,
          scheduled_at: now,
          queued_at: now,
          dedupe_key: `staff_reply:${inserted.id}:email`,
          metadata: { kind: "staff_reply", message_id: inserted.id, user_id: userId },
          created_by: userId,
        });
      }

      return Response.json({
        ok: true,
        message: { id: inserted.id, content: message, created_at: inserted.created_at },
        email_queued: emailValid,
      });
    } catch (error) {
      console.error("staff-chat-reply", error instanceof Error ? error.message : "unknown");
      return Response.json({ ok: false, code: "reply_failed" }, { status: 500 });
    }
  }),
};
