import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export type BusinessDocumentType = "quote" | "invoice";

export type BusinessDocumentCompany = {
  name?: string | null;
  legal_name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  vat_id?: string | null;
  tax_number?: string | null;
  bank_account_holder?: string | null;
  bank_iban?: string | null;
  bank_bic?: string | null;
  quote_terms?: string | null;
  quote_footer?: string | null;
};

export type BusinessDocumentRow = {
  customer_name?: string | null;
  address?: string | null;
  postal_code?: string | null;
  notes?: string | null;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  quote_number?: string;
  created_at?: string;
  valid_until?: string | null;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string | null;
  payment_reference?: string | null;
  paid_cents?: number;
  balance_cents?: number;
};

export type BusinessDocumentItem = {
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  tax_rate: number;
};

type BuildInput = {
  type: BusinessDocumentType;
  company: BusinessDocumentCompany;
  document: BusinessDocumentRow;
  items: BusinessDocumentItem[];
  serviceDate?: string | null;
};

const MARGIN = 18;

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantity = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 });

function clean(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 ? result : null;
}

function money(cents: number | null | undefined): string {
  const value = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  return euro.format(value / 100).replace(/\u00a0/g, " ");
}

function date(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(parsed);
}

function sanitizeFileName(value: string): string {
  const base = value.replace(/[^\p{L}\p{N}\-_.]+/gu, "_").replace(/_+/g, "_");
  return base.replace(/^_|_$/g, "") || "Dokument";
}

export function buildBusinessDocumentPdf(input: BuildInput): {
  bytes: Uint8Array;
  fileName: string;
} {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const right = pageWidth - MARGIN;
  const contentWidth = pageWidth - MARGIN * 2;
  const companyName = clean(input.company.legal_name) ?? clean(input.company.name) ?? "";
  const isQuote = input.type === "quote";
  const documentNumber = isQuote
    ? (clean(input.document.quote_number) ?? "Angebot")
    : (clean(input.document.invoice_number) ?? "Rechnung");

  let headerY = MARGIN;
  if (companyName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(companyName, right, headerY, { align: "right" });
    headerY += 5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const companyLines = [
    clean(input.company.address),
    clean(input.company.phone) ? `Tel.: ${clean(input.company.phone)}` : null,
    clean(input.company.email),
  ].filter((line): line is string => Boolean(line));
  for (const line of companyLines) {
    for (const wrapped of doc.splitTextToSize(line, 70) as string[]) {
      doc.text(wrapped, right, headerY, { align: "right" });
      headerY += 4;
    }
  }

  let y = MARGIN + 16;
  doc.setFontSize(8);
  doc.setTextColor(120);
  if (companyName) {
    doc.text(
      [companyName, clean(input.company.address)].filter(Boolean).join(" · "),
      MARGIN,
      y - 4,
    );
  }
  doc.setTextColor(0);
  doc.setFontSize(11);
  const customerLines = [
    clean(input.document.customer_name),
    clean(input.document.address),
    clean(input.document.postal_code),
  ].filter((line): line is string => Boolean(line));
  for (const line of customerLines.length > 0 ? customerLines : ["—"]) {
    for (const wrapped of doc.splitTextToSize(line, 90) as string[]) {
      doc.text(wrapped, MARGIN, y);
      y += 5;
    }
  }

  y = Math.max(y, headerY) + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(isQuote ? "Angebot" : "Rechnung", MARGIN, y);

  const meta: Array<[string, string | null]> = isQuote
    ? [
        ["Angebotsnummer", documentNumber],
        ["Angebotsdatum", date(input.document.created_at)],
        ["Gültig bis", date(input.document.valid_until)],
      ]
    : [
        ["Rechnungsnummer", documentNumber],
        ["Rechnungsdatum", date(input.document.issue_date)],
        ["Fällig am", date(input.document.due_date)],
        ["Leistungsdatum", date(input.serviceDate)],
      ];

  let metaY = y - 2;
  doc.setFontSize(9);
  for (const [label, value] of meta) {
    if (!value) continue;
    doc.setFont("helvetica", "normal");
    doc.text(label, right - 32, metaY, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(value, right, metaY, { align: "right" });
    metaY += 5;
  }

  y = Math.max(y + 14, metaY + 4);
  autoTable(doc, {
    startY: y,
    head: [
      ["Pos.", "Beschreibung", "Menge", "Einheit", "Einzelpreis netto", "MwSt.", "Gesamt netto"],
    ],
    body: input.items.length
      ? input.items
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((item, index) => [
            String(item.position || index + 1),
            item.description,
            quantity.format(item.quantity),
            item.unit,
            money(item.unit_price_cents),
            `${quantity.format(item.tax_rate)} %`,
            money(Math.round(item.quantity * item.unit_price_cents)),
          ])
      : [["", "Keine Positionen erfasst.", "", "", "", "", ""]],
    margin: { left: MARGIN, right: MARGIN, bottom: 22 },
    rowPageBreak: "avoid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [40, 44, 52], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 16, halign: "right" },
      3: { cellWidth: 16 },
      4: { cellWidth: 27, halign: "right" },
      5: { cellWidth: 16, halign: "right" },
      6: { cellWidth: 26, halign: "right" },
    },
  });

  type AutoTableDocument = typeof doc & { lastAutoTable?: { finalY: number } };
  y = ((doc as AutoTableDocument).lastAutoTable?.finalY ?? y) + 8;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 22) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const totals: Array<[string, number | undefined, boolean]> = [
    ["Zwischensumme (netto)", input.document.subtotal_cents, false],
    ["MwSt.", input.document.tax_cents, false],
    ["Gesamtbetrag", input.document.total_cents, true],
  ];
  if (!isQuote && (input.document.paid_cents ?? 0) > 0) {
    totals.push(["Bezahlt", input.document.paid_cents, false]);
    totals.push(["Offener Betrag", input.document.balance_cents, true]);
  }

  ensureSpace(totals.length * 7 + 6);
  for (const [label, value, strong] of totals) {
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setFontSize(strong ? 11 : 10);
    doc.text(label, right - 36, y, { align: "right" });
    doc.text(money(value), right, y, { align: "right" });
    y += strong ? 7 : 5.5;
  }

  const sections: Array<[string, string | null]> = isQuote
    ? [
        ["Anmerkungen", clean(input.document.notes)],
        ["Angebotsbedingungen", clean(input.company.quote_terms)],
        ["", clean(input.company.quote_footer)],
      ]
    : [
        [
          "Zahlungsinformationen",
          [
            clean(input.document.payment_reference)
              ? `Verwendungszweck: ${clean(input.document.payment_reference)}`
              : null,
            clean(input.company.bank_account_holder)
              ? `Kontoinhaber: ${clean(input.company.bank_account_holder)}`
              : null,
            clean(input.company.bank_iban) ? `IBAN: ${clean(input.company.bank_iban)}` : null,
            clean(input.company.bank_bic) ? `BIC: ${clean(input.company.bank_bic)}` : null,
          ]
            .filter(Boolean)
            .join("\n") || null,
        ],
        ["Anmerkungen", clean(input.document.notes)],
      ];

  for (const [title, body] of sections) {
    if (!body) continue;
    y += 4;
    if (title) {
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, MARGIN, y);
      y += 5;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    for (const line of doc.splitTextToSize(body, contentWidth) as string[]) {
      ensureSpace(6);
      doc.text(line, MARGIN, y);
      y += 4.5;
    }
  }

  const legal = [
    companyName,
    clean(input.company.vat_id) ? `USt-IdNr.: ${clean(input.company.vat_id)}` : null,
    clean(input.company.tax_number) ? `Steuernummer: ${clean(input.company.tax_number)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.setDrawColor(210);
    doc.line(MARGIN, pageHeight - 16, right, pageHeight - 16);
    if (legal) doc.text(legal, MARGIN, pageHeight - 11, { maxWidth: contentWidth - 25 });
    doc.text(`Seite ${page} von ${pages}`, right, pageHeight - 11, { align: "right" });
    doc.setTextColor(0);
  }

  const arrayBuffer = doc.output("arraybuffer");
  return {
    bytes: new Uint8Array(arrayBuffer),
    fileName: `${sanitizeFileName(`${isQuote ? "Angebot" : "Rechnung"}_${documentNumber}`)}.pdf`,
  };
}
