import { withSupabase } from "@supabase/server";

type JsonObject = Record<string, unknown>;

type RpcResult = {
  data: unknown;
  error: { message: string } | null;
};

type QueryResult = {
  data: unknown;
  error: { message: string } | null;
};

type AdminClient = {
  rpc(name: string, params?: JsonObject): PromiseLike<RpcResult>;
  from(table: string): {
    select(columns: string): {
      in(column: string, values: string[]): PromiseLike<QueryResult>;
    };
  };
};

type OutboundMessage = {
  id: string;
  company_id: string;
  recipient: string;
  subject: string | null;
  body: string;
};

type Company = {
  id: string;
  name: string | null;
  legal_name: string | null;
  email: string | null;
};

class ProviderFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
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

function emailHtml(subject: string, body: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#202124"><div style="max-width:640px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px"><h1 style="font-size:22px;margin:0 0 24px">${escapeHtml(subject)}</h1><p style="white-space:pre-line;line-height:1.55;margin:0">${escapeHtml(body)}</p></div><p style="font-size:12px;color:#6b7280;text-align:center">Sicher versendet über ZunftEcho.</p></div></body></html>`;
}

async function sendBrevoEmail(
  message: OutboundMessage,
  company: Company | undefined,
  apiKey: string,
  senderEmail: string,
  fallbackSenderName: string,
): Promise<string> {
  const subject = String(message.subject ?? "Nachricht von ZunftEcho").trim();
  const recipient = message.recipient.trim().toLowerCase();
  if (!isEmail(recipient)) throw new ProviderFailure("invalid_recipient", "Invalid recipient");

  const companyName = String(company?.legal_name ?? company?.name ?? "").trim();
  const senderName = (companyName || fallbackSenderName).slice(0, 100);
  const replyTo = String(company?.email ?? "")
    .trim()
    .toLowerCase();
  const payload: JsonObject = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: recipient }],
    subject,
    textContent: message.body,
    htmlContent: emailHtml(subject, message.body),
  };
  if (isEmail(replyTo)) payload.replyTo = { email: replyTo, name: senderName };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
      "idempotency-key": message.id,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new ProviderFailure(`brevo_${response.status}`, responseText.slice(0, 300));
  }

  try {
    const parsed = JSON.parse(responseText) as { messageId?: unknown };
    if (typeof parsed.messageId === "string" && parsed.messageId.trim()) {
      return parsed.messageId.trim();
    }
  } catch {
    // A successful provider response without JSON is still safely idempotent.
  }
  return `brevo:${message.id}`;
}

function asMessages(value: unknown): OutboundMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is OutboundMessage => {
    if (!row || typeof row !== "object") return false;
    const item = row as Record<string, unknown>;
    return (
      typeof item.id === "string" &&
      typeof item.company_id === "string" &&
      typeof item.recipient === "string" &&
      typeof item.body === "string"
    );
  });
}

function asCompanies(value: unknown): Company[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Company => {
    if (!row || typeof row !== "object") return false;
    return typeof (row as Record<string, unknown>).id === "string";
  });
}

export default {
  fetch: withSupabase({ auth: "publishable" }, async (request, ctx) => {
    if (request.method !== "POST") {
      return Response.json({ ok: false, code: "method_not_allowed" }, { status: 405 });
    }

    try {
      const apiKey = requiredEnv("BREVO_API_KEY");
      const senderEmail = requiredEnv("BREVO_SENDER_EMAIL").toLowerCase();
      const senderName = Deno.env.get("BREVO_SENDER_NAME")?.trim() || "ZunftEcho";
      if (!isEmail(senderEmail)) throw new Error("BREVO_SENDER_EMAIL is invalid");

      const admin = ctx.supabaseAdmin as unknown as AdminClient;
      const claimResult = await admin.rpc("claim_outbound_email_batch", { p_limit: 20 });
      if (claimResult.error) throw new Error(claimResult.error.message);
      const messages = asMessages(claimResult.data);
      if (messages.length === 0) {
        return Response.json({ ok: true, claimed: 0, sent: 0, retried: 0, failed: 0 });
      }

      const companyIds = [...new Set(messages.map((message) => message.company_id))];
      const companyResult = await admin
        .from("companies")
        .select("id,name,legal_name,email")
        .in("id", companyIds);
      if (companyResult.error) throw new Error(companyResult.error.message);
      const companies = new Map(
        asCompanies(companyResult.data).map((company) => [company.id, company]),
      );

      let sent = 0;
      let retried = 0;
      let failed = 0;

      for (const message of messages) {
        try {
          const providerMessageId = await sendBrevoEmail(
            message,
            companies.get(message.company_id),
            apiKey,
            senderEmail,
            senderName,
          );
          const finishResult = await admin.rpc("finish_outbound_email_delivery", {
            p_message_id: message.id,
            p_provider_message_id: providerMessageId,
          });
          if (finishResult.error) throw new Error(finishResult.error.message);
          sent += 1;
        } catch (error) {
          const code = error instanceof ProviderFailure ? error.code : "delivery_error";
          const safeMessage =
            error instanceof Error ? error.message.slice(0, 300) : "Email delivery failed";
          const retryResult = await admin.rpc("retry_outbound_email_delivery", {
            p_message_id: message.id,
            p_failure_code: code,
            p_failure_message: safeMessage,
          });
          if (retryResult.error) {
            console.error("Could not record email delivery failure", message.id);
            failed += 1;
          } else if (retryResult.data === "queued") {
            retried += 1;
          } else {
            failed += 1;
          }
        }
      }

      return Response.json({ ok: true, claimed: messages.length, sent, retried, failed });
    } catch (error) {
      console.error(
        "Outbound email worker failed",
        error instanceof Error ? error.message : "unknown",
      );
      return Response.json({ ok: false, code: "worker_failed" }, { status: 500 });
    }
  }),
};
