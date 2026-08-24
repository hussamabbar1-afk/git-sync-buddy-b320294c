import { withSupabase } from "npm:@supabase/server@^1";

type JsonObject = Record<string, unknown>;

const ALLOWED_ORIGINS = new Set([
  "https://zunftecho.de",
  "https://www.zunftecho.de",
  "https://handwerkai-app-de.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
]);

class RequestFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://zunftecho.de",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: JsonObject, status: number, origin: string): Response {
  return Response.json(body, { status, headers: corsHeaders(origin) });
}

function text(payload: JsonObject, key: string, maxLength: number): string {
  const value = typeof payload[key] === "string" ? payload[key].trim() : "";
  if (value.length > maxLength) {
    throw new RequestFailure(422, "invalid_request", "Eine Angabe ist zu lang.");
  }
  return value;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isWebsite(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default {
  fetch: withSupabase({ auth: "none" }, async (request, ctx) => {
    const origin = request.headers.get("origin") ?? "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return json(
        { ok: false, code: "method_not_allowed", message: "Method not allowed" },
        405,
        origin,
      );
    }

    if (!ALLOWED_ORIGINS.has(origin)) {
      return json(
        { ok: false, code: "origin_not_allowed", message: "Origin not allowed" },
        403,
        origin,
      );
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 12_000) {
      return json(
        { ok: false, code: "request_too_large", message: "Request too large" },
        413,
        origin,
      );
    }

    try {
      const payload = (await request.json()) as JsonObject;
      const honeypot = text(payload, "fax", 200);
      if (honeypot) return json({ ok: true }, 200, origin);

      const company = text(payload, "company", 120);
      const contactName = text(payload, "contact", 120);
      const email = text(payload, "email", 254).toLowerCase();
      const phone = text(payload, "phone", 50);
      const website = text(payload, "website", 300);
      const message = text(payload, "message", 2000);

      if (company.length < 2 || contactName.length < 2 || !isEmail(email) || !isWebsite(website)) {
        throw new RequestFailure(422, "invalid_request", "Bitte prüfen Sie Ihre Angaben.");
      }

      const admin = ctx.supabaseAdmin;

      const forwardedFor =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const fingerprint = await sha256(`zunftecho-pilot-v1|${forwardedFor}|${email}`);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: rateError } = await admin
        .from("pilot_requests")
        .select("id", { count: "exact", head: true })
        .eq("fingerprint_hash", fingerprint)
        .gte("created_at", oneHourAgo);

      if (rateError) throw rateError;
      if ((count ?? 0) >= 3) {
        throw new RequestFailure(
          429,
          "rate_limited",
          "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
        );
      }

      const { data: inserted, error: insertError } = await admin
        .from("pilot_requests")
        .insert({
          company,
          contact_name: contactName,
          email,
          phone: phone || null,
          website: website || null,
          message: message || null,
          fingerprint_hash: fingerprint,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const brevoApiKey = Deno.env.get("BREVO_API_KEY")?.trim();
      const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL")?.trim();
      const notificationEmail =
        Deno.env.get("PILOT_NOTIFICATION_EMAIL")?.trim() || "hussamabbar4@gmail.com";

      if (brevoApiKey && senderEmail && isEmail(senderEmail) && isEmail(notificationEmail)) {
        const details = [
          ["Firma", company],
          ["Ansprechpartner", contactName],
          ["E-Mail", email],
          ["Telefon", phone || "–"],
          ["Website", website || "–"],
          ["Nachricht", message || "–"],
        ]
          .map(
            ([label, value]) =>
              `<p><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(value).replaceAll("\n", "<br>")}</p>`,
          )
          .join("");

        try {
          const providerResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
              accept: "application/json",
              "api-key": brevoApiKey,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              sender: {
                email: senderEmail,
                name: (Deno.env.get("BREVO_SENDER_NAME")?.trim() || "ZunftEcho").slice(0, 70),
              },
              to: [{ email: notificationEmail, name: "ZunftEcho" }],
              replyTo: { email, name: contactName.slice(0, 70) },
              subject: `Neue Pilotanfrage – ${company}`,
              htmlContent: `<h2>Neue ZunftEcho-Pilotanfrage</h2>${details}`,
              textContent: `Neue ZunftEcho-Pilotanfrage\n\nFirma: ${company}\nAnsprechpartner: ${contactName}\nE-Mail: ${email}\nTelefon: ${phone || "–"}\nWebsite: ${website || "–"}\n\n${message || "–"}`,
            }),
            signal: AbortSignal.timeout(15_000),
          });

          if (!providerResponse.ok)
            throw new Error(`Brevo returned HTTP ${providerResponse.status}`);
          await admin
            .from("pilot_requests")
            .update({ notified_at: new Date().toISOString(), notification_error: null })
            .eq("id", inserted.id);
        } catch (notificationError) {
          console.error("Pilot notification failed", notificationError);
          await admin
            .from("pilot_requests")
            .update({ notification_error: "notification_failed" })
            .eq("id", inserted.id);
        }
      } else {
        await admin
          .from("pilot_requests")
          .update({ notification_error: "notification_not_configured" })
          .eq("id", inserted.id);
      }

      return json({ ok: true }, 200, origin);
    } catch (error) {
      console.error("Pilot request failed", error);
      if (error instanceof RequestFailure) {
        return json({ ok: false, code: error.code, message: error.message }, error.status, origin);
      }
      return json(
        {
          ok: false,
          code: "request_failed",
          message: "Die Anfrage konnte nicht gesendet werden.",
        },
        500,
        origin,
      );
    }
  }),
};
