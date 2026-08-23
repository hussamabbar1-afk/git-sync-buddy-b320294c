// Maps quote/invoice rows onto the shared business-document PDF layout.
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/crm";

import {
  buildBusinessDocument,
  sanitizeFileName,
  type PdfCompany,
  type PdfLineItem,
  type PdfMetaEntry,
} from "./business-document";

const COMPANY_COLUMNS =
  "id, name, legal_name, address, phone, email, vat_id, tax_number, bank_account_holder, bank_iban, bank_bic, quote_terms, quote_footer, invoice_payment_terms_days";

/** Loads the company profile through the authenticated client (RLS applies). */
export async function loadPdfCompany(companyId: string): Promise<PdfCompany> {
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("id", companyId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Die Unternehmensdaten konnten nicht geladen werden.");
  }
  return data as PdfCompany;
}

type DocItem = {
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  tax_rate: number;
};

function toItems(items: DocItem[]): PdfLineItem[] {
  return items
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({
      position: item.position || index + 1,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price_cents: item.unit_price_cents,
      tax_rate: item.tax_rate,
    }));
}

function metaEntry(label: string, value: string | null | undefined): PdfMetaEntry | null {
  if (!value) return null;
  const formatted = formatDate(value);
  if (formatted === "—") return null;
  return { label, value: formatted };
}

export type QuotePdfSource = {
  quote_number: string;
  customer_name: string | null;
  address: string | null;
  postal_code: string | null;
  created_at: string;
  valid_until: string | null;
  notes: string | null;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
};

export function buildQuotePdf(quote: QuotePdfSource, items: DocItem[], company: PdfCompany) {
  const meta = [
    { label: "Angebotsnummer", value: quote.quote_number },
    metaEntry("Angebotsdatum", quote.created_at),
    metaEntry("Gültig bis", quote.valid_until),
  ].filter((entry): entry is PdfMetaEntry => Boolean(entry));

  const blob = buildBusinessDocument({
    title: "Angebot",
    company,
    customer: {
      name: quote.customer_name,
      address: quote.address,
      postal_code: quote.postal_code,
    },
    meta,
    items: toItems(items),
    totals: {
      subtotal_cents: quote.subtotal_cents,
      tax_cents: quote.tax_cents,
      total_cents: quote.total_cents,
    },
    sections: [
      { title: "Anmerkungen", body: quote.notes ?? "" },
      { title: "Angebotsbedingungen", body: company.quote_terms ?? "" },
    ],
    footerNote: company.quote_footer ?? null,
  });

  return { blob, fileName: `${sanitizeFileName(`Angebot_${quote.quote_number}`)}.pdf` };
}

export type InvoicePdfSource = {
  invoice_number: string;
  customer_name: string | null;
  address: string | null;
  postal_code: string | null;
  issue_date: string;
  due_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
};

export function buildInvoicePdf(
  invoice: InvoicePdfSource,
  items: DocItem[],
  company: PdfCompany,
  serviceDate?: string | null,
) {
  const meta = [
    { label: "Rechnungsnummer", value: invoice.invoice_number },
    metaEntry("Rechnungsdatum", invoice.issue_date),
    metaEntry("Fällig am", invoice.due_date),
    metaEntry("Leistungsdatum", serviceDate ?? null),
  ].filter((entry): entry is PdfMetaEntry => Boolean(entry));

  const paymentLines = [
    invoice.payment_reference ? `Verwendungszweck: ${invoice.payment_reference}` : null,
    company.bank_account_holder ? `Kontoinhaber: ${company.bank_account_holder}` : null,
    company.bank_iban ? `IBAN: ${company.bank_iban}` : null,
    company.bank_bic ? `BIC: ${company.bank_bic}` : null,
  ].filter(Boolean) as string[];

  const blob = buildBusinessDocument({
    title: "Rechnung",
    company,
    customer: {
      name: invoice.customer_name,
      address: invoice.address,
      postal_code: invoice.postal_code,
    },
    meta,
    items: toItems(items),
    totals: {
      subtotal_cents: invoice.subtotal_cents,
      tax_cents: invoice.tax_cents,
      total_cents: invoice.total_cents,
      paid_cents: invoice.paid_cents,
      balance_cents: invoice.balance_cents,
    },
    sections: [
      { title: "Zahlungsinformationen", body: paymentLines.join("\n") },
      { title: "Anmerkungen", body: invoice.notes ?? "" },
    ],
  });

  return { blob, fileName: `${sanitizeFileName(`Rechnung_${invoice.invoice_number}`)}.pdf` };
}
