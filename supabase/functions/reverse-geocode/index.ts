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
    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);
    if (
      !uuidPattern.test(widgetKey) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return Response.json(
        { ok: false, code: "invalid_request" },
        { status: 400, headers: cors(origin) },
      );
    }
    const { data: agent } = await ctx.supabaseAdmin
      .from("ai_agents")
      .select("id")
      .eq("widget_key", widgetKey)
      .eq("is_active", true)
      .maybeSingle();
    if (!agent)
      return Response.json(
        { ok: false, code: "invalid_widget" },
        { status: 404, headers: cors(origin) },
      );

    try {
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("lat", latitude.toFixed(6));
      url.searchParams.set("lon", longitude.toFixed(6));
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("accept-language", "de");
      const response = await fetch(url, {
        headers: { "User-Agent": "ZunftEcho/1.0 (https://zunftecho.de; kontakt@zunftecho.de)" },
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) throw new Error(`nominatim_${response.status}`);
      const result = (await response.json()) as JsonObject;
      const address =
        typeof result.display_name === "string" ? result.display_name.slice(0, 500) : "";
      if (!address) throw new Error("address_missing");
      return Response.json(
        { ok: true, address, latitude, longitude, attribution: "© OpenStreetMap-Mitwirkende" },
        { headers: cors(origin) },
      );
    } catch (error) {
      console.error("reverse-geocode", error instanceof Error ? error.message : "unknown");
      return Response.json(
        { ok: false, code: "geocoding_unavailable" },
        { status: 502, headers: cors(origin) },
      );
    }
  }),
};
