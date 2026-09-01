import { withSupabase } from "npm:@supabase/server@^1";
import { matchesImageSignature, safeImageName } from "./image-validation.ts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
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
    if (Number(request.headers.get("content-length") ?? 0) > 1_800_000) {
      return Response.json(
        { ok: false, code: "file_too_large" },
        { status: 413, headers: cors(origin) },
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return Response.json(
        { ok: false, code: "invalid_request" },
        { status: 400, headers: cors(origin) },
      );
    }

    try {
      const widgetKey = String(form.get("widget_key") ?? "");
      const conversationId = String(form.get("conversation_id") ?? "");
      const file = form.get("file");
      if (
        !uuidPattern.test(widgetKey) ||
        !uuidPattern.test(conversationId) ||
        !(file instanceof File)
      ) {
        return Response.json(
          { ok: false, code: "invalid_request" },
          { status: 400, headers: cors(origin) },
        );
      }
      if (!allowedTypes.has(file.type) || file.size <= 0 || file.size > 1_500_000) {
        return Response.json(
          { ok: false, code: "invalid_image" },
          { status: 422, headers: cors(origin) },
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
            .select("id, company_id")
            .eq("id", conversationId)
            .eq("company_id", agent.company_id)
            .maybeSingle()
        : { data: null };
      if (!conversation)
        return Response.json(
          { ok: false, code: "conversation_not_found" },
          { status: 404, headers: cors(origin) },
        );

      const { data: lead } = await ctx.supabaseAdmin
        .from("leads")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("company_id", conversation.company_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!lead)
        return Response.json(
          { ok: false, code: "lead_not_ready" },
          { status: 409, headers: cors(origin) },
        );

      const { count } = await ctx.supabaseAdmin
        .from("attachments")
        .select("id", { count: "exact", head: true })
        .eq("entity_type", "lead")
        .eq("entity_id", lead.id);
      if ((count ?? 0) >= 3)
        return Response.json(
          { ok: false, code: "image_limit_reached" },
          { status: 409, headers: cors(origin) },
        );

      const extension =
        file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
      const storagePath = `${conversation.company_id}/leads/${lead.id}/chat-${crypto.randomUUID()}.${extension}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!matchesImageSignature(bytes, file.type)) {
        return Response.json(
          { ok: false, code: "file_type_mismatch" },
          { status: 422, headers: cors(origin) },
        );
      }
      const { error: uploadError } = await ctx.supabaseAdmin.storage
        .from("company-files")
        .upload(storagePath, bytes, {
          contentType: file.type,
          upsert: false,
          cacheControl: "3600",
        });
      if (uploadError) throw uploadError;

      const { data: attachment, error: insertError } = await ctx.supabaseAdmin
        .from("attachments")
        .insert({
          company_id: conversation.company_id,
          entity_type: "lead",
          entity_id: lead.id,
          file_name: safeImageName(file.name, extension),
          mime_type: file.type,
          size_bytes: file.size,
          storage_path: storagePath,
          description: "Optionales Kundenfoto aus dem Website-Chat",
        })
        .select("id")
        .single();
      if (insertError) {
        await ctx.supabaseAdmin.storage.from("company-files").remove([storagePath]);
        throw insertError;
      }
      return Response.json(
        { ok: true, attachment_id: attachment.id, remaining: Math.max(0, 2 - (count ?? 0)) },
        { headers: cors(origin) },
      );
    } catch (error) {
      console.error("chat-attachment", error instanceof Error ? error.message : "unknown");
      return Response.json(
        { ok: false, code: "upload_failed" },
        { status: 500, headers: cors(origin) },
      );
    }
  }),
};
