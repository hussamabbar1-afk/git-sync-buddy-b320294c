import { withSupabase } from "npm:@supabase/server@^1";

type JsonObject = Record<string, unknown>;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedOrigins = new Set([
  "https://zunftecho.de",
  "https://www.zunftecho.de",
  "https://handwerkai-app-de.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
]);

function cors(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://zunftecho.de",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    const origin = request.headers.get("origin") ?? "";
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "POST")
      return Response.json({ ok: false }, { status: 405, headers: cors(origin) });
    if (!allowedOrigins.has(origin))
      return Response.json(
        { ok: false, code: "origin_not_allowed" },
        { status: 403, headers: cors(origin) },
      );

    const payload = (await request.json().catch(() => ({}))) as JsonObject;
    const widgetKey = typeof payload.widget_key === "string" ? payload.widget_key : "";
    const conversationId =
      typeof payload.conversation_id === "string" ? payload.conversation_id : "";
    if (!uuidPattern.test(widgetKey) || !uuidPattern.test(conversationId)) {
      return Response.json(
        { ok: false, code: "invalid_request" },
        { status: 400, headers: cors(origin) },
      );
    }

    const { data: agent } = await ctx.supabaseAdmin
      .from("ai_agents")
      .select("company_id")
      .eq("widget_key", widgetKey)
      .eq("is_active", true)
      .maybeSingle();
    const { data: conversation } = agent?.company_id
      ? await ctx.supabaseAdmin
          .from("conversations")
          .select("id")
          .eq("id", conversationId)
          .eq("company_id", agent.company_id)
          .maybeSingle()
      : { data: null };
    if (!conversation) {
      return Response.json(
        { ok: false, code: "conversation_not_found" },
        { status: 404, headers: cors(origin) },
      );
    }

    const { data, error } = await ctx.supabaseAdmin
      .from("messages")
      .select("id, role, content, customer_visible_content, created_at, source_channel")
      .eq("conversation_id", conversationId)
      .eq("role", "assistant")
      .order("created_at", { ascending: true })
      .limit(60);
    if (error) throw error;
    const messages = (data ?? []).map((item) => ({
      id: item.id,
      content: item.customer_visible_content || item.content,
      created_at: item.created_at,
      source_channel: item.source_channel,
    }));
    return Response.json(
      { ok: true, messages },
      { headers: { ...cors(origin), "Cache-Control": "no-store" } },
    );
  }),
};
