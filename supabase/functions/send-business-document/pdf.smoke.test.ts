import { buildBusinessDocumentPdf } from "../_shared/business-document-pdf.ts";

Deno.test("builds a non-empty invoice PDF from authoritative values", () => {
  const result = buildBusinessDocumentPdf({
    type: "invoice",
    company: {
      name: "Muster Handwerk GmbH",
      address: "Werkstraße 12, 10115 Berlin",
      email: "rechnung@example.com",
      bank_iban: "DE02120300000000202051",
      vat_id: "DE123456789",
    },
    document: {
      invoice_number: "RE-2026-0042",
      customer_name: "Max Mustermann",
      address: "Kundenweg 4",
      postal_code: "10117 Berlin",
      issue_date: "2026-08-24",
      due_date: "2026-09-07",
      payment_reference: "RE-2026-0042",
      subtotal_cents: 10_000,
      tax_cents: 1_900,
      total_cents: 11_900,
      paid_cents: 0,
      balance_cents: 11_900,
    },
    items: [
      {
        position: 1,
        description: "Montageleistung",
        quantity: 2,
        unit: "Std.",
        unit_price_cents: 5_000,
        tax_rate: 19,
      },
    ],
  });

  const signature = new TextDecoder().decode(result.bytes.subarray(0, 5));
  if (signature !== "%PDF-") throw new Error(`Unexpected PDF signature: ${signature}`);
  if (result.bytes.byteLength < 5_000) throw new Error("Generated PDF is unexpectedly small");
  if (result.fileName !== "Rechnung_RE-2026-0042.pdf") {
    throw new Error(`Unexpected file name: ${result.fileName}`);
  }
});
