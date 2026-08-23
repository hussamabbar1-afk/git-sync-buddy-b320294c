// Reusable A4 business-document PDF generator (Angebot / Rechnung).
// Purely presentational: financial totals are always taken from backend values.
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfCompany = {
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

export type PdfCustomer = {
  name?: string | null;
  address?: string | null;
  postal_code?: string | null;
};

export type PdfLineItem = {
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  tax_rate: number;
};

export type PdfMetaEntry = { label: string; value: string };

export type PdfSection = { title: string; body: string };

export type BusinessDocumentInput = {
  title: string;
  documentNumber: string;
  company: PdfCompany;
  customer: PdfCustomer;
  meta: PdfMetaEntry[];
  items: PdfLineItem[];
  /** Backend source-of-truth amounts, in cents. */
  totals: {
    subtotal_cents: number;
    tax_cents: number;
    total_cents: number;
    paid_cents?: number | null;
    balance_cents?: number | null;
  };
  sections?: PdfSection[];
  footerNote?: string | null;
};

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const qty = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 });

function money(cents: number | null | undefined) {
  const value = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  // Normalise the non-breaking space Intl inserts before the currency symbol.
  return euro.format(value / 100).replace(/\u00a0/g, " ");
}

function clean(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

export function sanitizeFileName(value: string) {
  const base = value.replace(/[^\p{L}\p{N}\-_.]+/gu, "_").replace(/_+/g, "_");
  return base.replace(/^_|_$/g, "") || "Dokument";
}

const MARGIN = 18;

export function buildBusinessDocument(input: BusinessDocumentInput): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  const right = pageWidth - MARGIN;

  const companyName = clean(input.company.legal_name) ?? clean(input.company.name) ?? "";
  const companyLines = [
    clean(input.company.address),
    clean(input.company.phone) ? `Tel.: ${clean(input.company.phone)}` : null,
    clean(input.company.email),
  ].filter((line): line is string => Boolean(line));

  // Company header (right aligned)
  let headerY = MARGIN;
  if (companyName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(companyName, right, headerY, { align: "right" });
    headerY += 5;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const line of companyLines) {
    for (const wrapped of doc.splitTextToSize(line, 70) as string[]) {
      doc.text(wrapped, right, headerY, { align: "right" });
      headerY += 4;
    }
  }

  // Customer address block (left)
  let y = MARGIN + 12;
  doc.setFontSize(8);
  doc.setTextColor(120);
  if (companyName) {
    const senderParts = [companyName, clean(input.company.address)].filter(Boolean).join(" · ");
    doc.text(senderParts, MARGIN, y - 4);
  }
  doc.setTextColor(0);
  doc.setFontSize(11);
  const customerLines = [
    clean(input.customer.name),
    clean(input.customer.address),
    clean(input.customer.postal_code),
  ].filter((line): line is string => Boolean(line));
  if (customerLines.length === 0) customerLines.push("—");
  for (const line of customerLines) {
    for (const wrapped of doc.splitTextToSize(line, 90) as string[]) {
      doc.text(wrapped, MARGIN, y);
      y += 5;
    }
  }

  y = Math.max(y, headerY) + 12;

  // Title + meta
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(input.title, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(input.documentNumber, MARGIN, y + 7);

  let metaY = y - 2;
  doc.setFontSize(9);
  for (const entry of input.meta) {
    doc.setFont("helvetica", "normal");
    doc.text(entry.label, right - 32, metaY, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(entry.value, right, metaY, { align: "right" });
    metaY += 5;
  }
  doc.setFont("helvetica", "normal");

  y = Math.max(y + 14, metaY + 4);

  // Item table
  const body = input.items.map((item) => [
    String(item.position),
    item.description,
    qty.format(item.quantity),
    item.unit,
    money(item.unit_price_cents),
    `${qty.format(item.tax_rate)} %`,
    money(Math.round(item.quantity * item.unit_price_cents)),
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      ["Pos.", "Beschreibung", "Menge", "Einheit", "Einzelpreis netto", "MwSt.", "Gesamt netto"],
    ],
    body: body.length > 0 ? body : [["", "Keine Positionen erfasst.", "", "", "", "", ""]],
    margin: { left: MARGIN, right: MARGIN, bottom: 22 },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [40, 44, 52], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 16, halign: "right" },
      3: { cellWidth: 16 },
      4: { cellWidth: 27, halign: "right" },
      5: { cellWidth: 16, halign: "right" },
      6: { cellWidth: 26, halign: "right" },
    },
  });

  type TableDoc = typeof doc & { lastAutoTable?: { finalY: number } };
  y = ((doc as TableDoc).lastAutoTable?.finalY ?? y) + 8;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 22) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Summary (backend values only)
  const summary: Array<[string, string, boolean]> = [
    ["Zwischensumme (netto)", money(input.totals.subtotal_cents), false],
    ["MwSt.", money(input.totals.tax_cents), false],
    ["Gesamtbetrag", money(input.totals.total_cents), true],
  ];
  if ((input.totals.paid_cents ?? 0) > 0) {
    summary.push(["Bezahlt", money(input.totals.paid_cents), false]);
    summary.push(["Offener Betrag", money(input.totals.balance_cents), true]);
  }

  ensureSpace(summary.length * 6 + 6);
  for (const [label, value, strong] of summary) {
    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setFontSize(strong ? 11 : 10);
    doc.text(label, right - 36, y, { align: "right" });
    doc.text(value, right, y, { align: "right" });
    y += strong ? 7 : 5.5;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Free-text sections
  for (const section of input.sections ?? []) {
    const text = clean(section.body);
    if (!text) continue;
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    ensureSpace(10);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(section.title, MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, MARGIN, y);
      y += 4.5;
    }
  }

  const footerNote = clean(input.footerNote);
  if (footerNote) {
    const lines = doc.splitTextToSize(footerNote, contentWidth) as string[];
    y += 4;
    doc.setFontSize(9);
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, MARGIN, y);
      y += 4.5;
    }
  }

  // Page footer: legal identifiers (only when saved) + page numbers
  const legal = [
    companyName,
    clean(input.company.vat_id) ? `USt-IdNr.: ${clean(input.company.vat_id)}` : null,
    clean(input.company.tax_number) ? `Steuernummer: ${clean(input.company.tax_number)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.setDrawColor(210);
    doc.line(MARGIN, pageHeight - 16, right, pageHeight - 16);
    if (legal) {
      for (const line of (doc.splitTextToSize(legal, contentWidth - 25) as string[]).slice(0, 2)) {
        doc.text(line, MARGIN, pageHeight - 11);
      }
    }
    doc.text(`Seite ${page} von ${pageCount}`, right, pageHeight - 11, { align: "right" });
    doc.setTextColor(0);
  }

  return doc.output("blob");
}

export function downloadPdfBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function printPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.src = url;
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      window.open(url, "_blank", "noopener");
    }
  };
  document.body.appendChild(frame);
  setTimeout(() => {
    frame.remove();
    URL.revokeObjectURL(url);
  }, 60000);
}
