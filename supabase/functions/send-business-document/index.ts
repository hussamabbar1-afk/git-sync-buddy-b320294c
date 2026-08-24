import { withSupabase } from "@supabase/server";

import {
  buildBusinessDocumentPdf,
  type BusinessDocumentCompany,
  type BusinessDocumentItem,
  type BusinessDocumentRow,
  type BusinessDocumentType,
} from "../_shared/business-document-pdf.ts";

type JsonObject = Record<string, unknown>;

type RpcResult = {
  data: unknown;
  error: { message: string } | null;
};

type RpcClient = {
  rpc(name: string, params?: JsonObject): PromiseLike<RpcResult>;
};

type ClaimResult = {
  message_id: string;
  recipient: string;
  claimed: boolean;
  status: string;
};

class RequestFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

class ProviderFailure extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function json(body: JsonObject, status = 200): Response {
  return Response.json(body, { status });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value)
    throw new RequestFailure(
      503,
      "email_not_configured",
      "E-Mail-Versand ist noch nicht konfiguriert.",
    );
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

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function money(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function documentNumber(type: BusinessDocumentType, document: BusinessDocumentRow): string {
  return type === "quote"
    ? String(document.quote_number ?? "").trim()
    : String(document.invoice_number ?? "").trim();
}

function deliveryCopy(
  type: BusinessDocumentType,
  document: BusinessDocumentRow,
  company: BusinessDocumentCompany,
): { subject: string; text: string; html: string } {
  const isQuote = type === "quote";
  const label = isQuote ? "Angebot" : "Rechnung";
  const number = documentNumber(type, document);
  const companyName = String(company.legal_name ?? company.name ?? "HandwerkAI").trim();
  const customerName = String(document.customer_name ?? "").trim();
  const greeting = customerName ? `Guten Tag ${customerName},` : "Guten Tag,";
  const attachmentSentence = `anbei erhalten Sie ${isQuote ? "unser" : "unsere"} ${label.toLowerCase()} ${number} als PDF.`;
  const totalSentence = `Gesamtbetrag: ${money(Number(document.total_cents) || 0)}`;
  const closing = `Freundliche Grüße\n${companyName}`;
  const text = `${greeting}\n\n${attachmentSentence}\n${totalSentence}\n\n${closing}`;
  const html = `<!doctype html><html lang="de"><body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#202124"><div style="max-width:640px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px"><h1 style="font-size:22px;margin:0 0 24px">${escapeHtml(label)} ${escapeHtml(number)}</h1><p>${escapeHtml(greeting)}</p><p>${escapeHtml(attachmentSentence)}</p><p style="font-weight:700">${escapeHtml(totalSentence)}</p><p style="white-space:pre-line;margin-top:28px">${escapeHtml(closing)}</p></div><p style="font-size:12px;color:#6b7280;text-align:center">Dieses Dokument wurde sicher über HandwerkAI versendet.</p></div></body></html>`;
  return { subject: `${label} ${number} von ${companyName}`, text, html };
}

function publicError(error: unknown): RequestFailure {
  if (error instanceof RequestFailure) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/not found|membership/i.test(message)) {
    return new RequestFailure(404, "document_not_found", "Das Dokument wurde nicht gefunden.");
  }
  if (/only draft|no longer sendable/i.test(message)) {
    return new RequestFailure(
      409,
      "document_not_sendable",
      "Das Dokument kann in diesem Status nicht gesendet werden.",
    );
  }
  if (/recipient email/i.test(message)) {
    return new RequestFailure(
      422,
      "recipient_email_missing",
      "Bitte hinterlegen Sie eine gültige E-Mail-Adresse.",
    );
  }
  if (/total must/i.test(message)) {
    return new RequestFailure(
      422,
      "document_total_invalid",
      "Der Gesamtbetrag muss größer als 0,00 € sein.",
    );
  }
  return new RequestFailure(500, "delivery_failed", "Die E-Mail konnte nicht gesendet werden.");
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method !== "POST") {
      return json({ ok: false, code: "method_not_allowed", message: "Method not allowed" }, 405);
    }

    let messageId: string | null = null;
    try {
      const payload = (await request.json()) as JsonObject;
      const type = payload.type === "quote" || payload.type === "invoice" ? payload.type : null;
      const entityId = typeof payload.id === "string" ? payload.id : "";
      if (!type || !isUuid(entityId)) {
        throw new RequestFailure(400, "invalid_request", "Ungültige Dokumentanfrage.");
      }

      const claims = ctx.userClaims as unknown as JsonObject | undefined;
      const userId = String(claims?.sub ?? claims?.id ?? "");
      if (!isUuid(userId)) {
        throw new RequestFailure(401, "authentication_required", "Anmeldung erforderlich.");
      }

      const brevoApiKey = requiredEnv("BREVO_API_KEY");
      const senderEmail = requiredEnv("BREVO_SENDER_EMAIL").toLowerCase();
      if (!isEmail(senderEmail)) {
        throw new RequestFailure(
          503,
          "email_not_configured",
          "E-Mail-Versand ist noch nicht konfiguriert.",
        );
      }

      const documentColumns =
        type === "quote"
          ? "id, company_id, customer_id, customer_name, email, address, postal_code, quote_number, created_at, valid_until, notes, subtotal_cents, tax_cents, total_cents, status"
          : "id, company_id, customer_id, customer_name, email, address, postal_code, invoice_number, issue_date, due_date, payment_reference, notes, subtotal_cents, tax_cents, total_cents, paid_cents, balance_cents, status, job_id";
      const documentResult = await ctx.supabase
        .from(type === "quote" ? "quotes" : "invoices")
        .select(documentColumns)
        .eq("id", entityId)
        .maybeSingle();
      if (documentResult.error) throw documentResult.error;
      if (!documentResult.data) {
        throw new RequestFailure(404, "document_not_found", "Das Dokument wurde nicht gefunden.");
      }
      const document = documentResult.data as unknown as BusinessDocumentRow & {
        company_id: string;
        email?: string | null;
        status: string;
        job_id?: string | null;
      };

      if (document.status !== "draft") {
        throw new RequestFailure(
          409,
          "document_not_sendable",
          "Nur Entwürfe können gesendet werden.",
        );
      }
      if (!isEmail(String(document.email ?? "").trim())) {
        throw new RequestFailure(
          422,
          "recipient_email_missing",
          "Bitte hinterlegen Sie eine gültige E-Mail-Adresse.",
        );
      }
      if ((Number(document.total_cents) || 0) <= 0) {
        throw new RequestFailure(
          422,
          "document_total_invalid",
          "Der Gesamtbetrag muss größer als 0,00 € sein.",
        );
      }

      const itemForeignKey = type === "quote" ? "quote_id" : "invoice_id";
      const itemResult = await ctx.supabase
        .from(type === "quote" ? "quote_items" : "invoice_items")
        .select("position, description, quantity, unit, unit_price_cents, tax_rate")
        .eq(itemForeignKey, entityId)
        .order("position", { ascending: true });
      if (itemResult.error) throw itemResult.error;
      const items = (itemResult.data ?? []) as unknown as BusinessDocumentItem[];
      if (items.length === 0) {
        throw new RequestFailure(
          422,
          "document_items_missing",
          "Bitte fügen Sie zuerst mindestens eine Position hinzu.",
        );
      }

      const companyResult = await ctx.supabase
        .from("companies")
        .select(
          "name, legal_name, address, phone, email, vat_id, tax_number, bank_account_holder, bank_iban, bank_bic, quote_terms, quote_footer",
        )
        .eq("id", document.company_id)
        .maybeSingle();
      if (companyResult.error || !companyResult.data) {
        throw new RequestFailure(
          422,
          "company_profile_missing",
          "Bitte vervollständigen Sie zuerst Ihre Unternehmensdaten.",
        );
      }
      const company = companyResult.data as BusinessDocumentCompany;

      let serviceDate: string | null = null;
      if (type === "invoice" && document.job_id) {
        const jobResult = await ctx.supabase
          .from("jobs")
          .select("completed_at")
          .eq("id", document.job_id)
          .maybeSingle();
        const job = jobResult.data as unknown as { completed_at?: string | null } | null;
        if (!jobResult.error) serviceDate = String(job?.completed_at ?? "") || null;
      }

      const copy = deliveryCopy(type, document, company);
      const admin = ctx.supabaseAdmin as unknown as RpcClient;
      const claimResult = await admin.rpc("claim_business_document_delivery", {
        p_user_id: userId,
        p_entity_type: type,
        p_entity_id: entityId,
        p_subject: copy.subject,
        p_body: copy.text,
        p_metadata: {
          delivery_kind: "business_document",
          document_number: documentNumber(type, document),
        },
      });
      if (claimResult.error) throw claimResult.error;
      const claim = claimResult.data as unknown as ClaimResult;
      if (!claim?.message_id) throw new Error("Delivery claim did not return a message ID");
      messageId = claim.message_id;
      if (!claim.claimed) {
        return json(
          {
            ok: false,
            code: "delivery_in_progress",
            message: "Der Versand läuft bereits. Bitte warten Sie einen Moment.",
          },
          409,
        );
      }

      const pdf = buildBusinessDocumentPdf({
        type,
        company,
        document,
        items,
        serviceDate,
      });

      const senderName =
        String(Deno.env.get("BREVO_SENDER_NAME") ?? "").trim() ||
        String(company.legal_name ?? company.name ?? "HandwerkAI").trim();
      const companyEmail = String(company.email ?? "")
        .trim()
        .toLowerCase();
      const requestBody: JsonObject = {
        sender: { email: senderEmail, name: senderName.slice(0, 70) },
        to: [
          {
            email: claim.recipient,
            ...(document.customer_name
              ? { name: String(document.customer_name).slice(0, 70) }
              : {}),
          },
        ],
        subject: copy.subject,
        htmlContent: copy.html,
        textContent: copy.text,
        headers: { "Idempotency-Key": messageId },
        attachment: [{ content: toBase64(pdf.bytes), name: pdf.fileName }],
        ...(isEmail(companyEmail) && companyEmail !== senderEmail
          ? { replyTo: { email: companyEmail, name: senderName.slice(0, 70) } }
          : {}),
      };

      const providerResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(15_000),
      });

      const providerText = await providerResponse.text();
      let providerPayload: JsonObject = {};
      try {
        providerPayload = providerText ? (JSON.parse(providerText) as JsonObject) : {};
      } catch {
        providerPayload = {};
      }

      const providerCode = String(providerPayload.code ?? "");
      const providerMessage = String(providerPayload.message ?? "");
      const duplicateAccepted =
        providerResponse.status === 400 && providerCode === "duplicate_parameter";
      if (!providerResponse.ok && !duplicateAccepted) {
        throw new ProviderFailure(
          providerCode || `brevo_http_${providerResponse.status}`,
          providerMessage || `Brevo returned HTTP ${providerResponse.status}`,
        );
      }

      const providerMessageId = duplicateAccepted
        ? `brevo-idempotency:${messageId}`
        : String(providerPayload.messageId ?? "").trim();
      if (!providerMessageId) {
        throw new ProviderFailure("brevo_invalid_response", "Brevo did not return a message ID");
      }

      const completeResult = await admin.rpc("complete_business_document_delivery", {
        p_message_id: messageId,
        p_provider_message_id: providerMessageId,
      });
      if (completeResult.error) throw completeResult.error;

      return json({
        ok: true,
        status: "sent",
        message_id: messageId,
        sent_at: (completeResult.data as JsonObject | null)?.sent_at ?? null,
      });
    } catch (error) {
      if (messageId) {
        const code = error instanceof ProviderFailure ? error.code : "delivery_processing_failed";
        const detail = error instanceof Error ? error.message : "Email delivery failed";
        try {
          const admin = ctx.supabaseAdmin as unknown as RpcClient;
          await admin.rpc("fail_business_document_delivery", {
            p_message_id: messageId,
            p_failure_code: code,
            p_failure_message: detail,
          });
        } catch (auditError) {
          console.error("Could not persist failed delivery state", auditError);
        }
      }

      console.error("Business document delivery failed", error);
      const responseError = publicError(error);
      return json(
        { ok: false, code: responseError.code, message: responseError.message },
        responseError.status,
      );
    }
  }),
};
