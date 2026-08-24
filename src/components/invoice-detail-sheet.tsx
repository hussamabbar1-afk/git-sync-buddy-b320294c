import { Download, Loader2, Mail, Plus, Printer, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  asRecord,
  bool,
  customerName,
  decimalInputToNumber,
  euroInputToCents,
  formatCents,
  formatDate,
  formatDateTime,
  fromDateInput,
  invoiceStatusLabel,
  invoiceStatusVariant,
  paymentMethodLabel,
  paymentMethodOptions,
  str,
  toDateInput,
} from "@/lib/crm";
import { downloadPdfBlob, printPdfBlob } from "@/lib/pdf/business-document";
import { buildInvoicePdf, loadPdfCompany } from "@/lib/pdf/documents";
import { sendBusinessDocumentEmail } from "@/lib/business-document-email";

const INVOICE_COLUMNS =
  "id, company_id, invoice_number, status, customer_name, phone, email, address, postal_code, currency, issue_date, due_date, payment_reference, notes, subtotal_cents, tax_cents, total_cents, paid_cents, balance_cents, sent_at, paid_at, cancelled_at, created_at, updated_at, customer_id, lead_id, quote_id, job_id";

const ITEM_COLUMNS =
  "id, invoice_id, position, description, quantity, unit, unit_price_cents, tax_rate, created_at";

const PAYMENT_COLUMNS =
  "id, invoice_id, amount_cents, method, paid_at, reference, note, created_at";

type InvoiceDetail = {
  id: string;
  company_id: string;
  invoice_number: string;
  status: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postal_code: string | null;
  currency: string;
  issue_date: string;
  due_date: string | null;
  payment_reference: string | null;
  notes: string | null;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
  sent_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  lead_id: string | null;
  quote_id: string | null;
  job_id: string | null;
};

type InvoiceItem = {
  id: string;
  invoice_id: string;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  tax_rate: number;
  created_at: string;
};

type InvoicePayment = {
  id: string;
  invoice_id: string;
  amount_cents: number;
  method: string;
  paid_at: string;
  reference: string | null;
  note: string | null;
  created_at: string;
};

type ShareStatus = {
  configured: boolean;
  expires_at: string | null;
  last_viewed_at: string | null;
  customer_viewed_at: string | null;
};

type FormState = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  due_date: string;
  payment_reference: string;
  notes: string;
};

type ItemDraft = {
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  tax_rate: string;
};

type PaymentDraft = {
  amount: string;
  method: string;
  paid_at: string;
  reference: string;
  note: string;
};

const emptyItemDraft: ItemDraft = {
  description: "",
  quantity: "1",
  unit: "Stk",
  unit_price: "",
  tax_rate: "19",
};

function todayDateInput() {
  return toDateInput(new Date().toISOString());
}

function emptyPaymentDraft(): PaymentDraft {
  return {
    amount: "",
    method: "bank_transfer",
    paid_at: todayDateInput(),
    reference: "",
    note: "",
  };
}

function toForm(invoice: InvoiceDetail): FormState {
  return {
    customer_name: invoice.customer_name ?? "",
    phone: invoice.phone ?? "",
    email: invoice.email ?? "",
    address: invoice.address ?? "",
    postal_code: invoice.postal_code ?? "",
    due_date: toDateInput(invoice.due_date),
    payment_reference: invoice.payment_reference ?? "",
    notes: invoice.notes ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="text-sm">{children}</p>
    </div>
  );
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 }).format(value);
}

export function InvoiceDetailSheet({
  invoiceId,
  companyId,
  open,
  onOpenChange,
  onChanged,
}: {
  invoiceId: string | null;
  companyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [share, setShare] = useState<ShareStatus | null>(null);
  const [jobNumber, setJobNumber] = useState<string | null>(null);
  const [jobCompletedAt, setJobCompletedAt] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [sendConfirm, setSendConfirm] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [itemDraft, setItemDraft] = useState<ItemDraft>(emptyItemDraft);
  const [itemBusy, setItemBusy] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>(emptyPaymentDraft);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!invoiceId || !companyId) return null;

    const [invoiceResult, itemsResult, paymentsResult, shareResult] = await Promise.all([
      supabase
        .from("invoices")
        .select(INVOICE_COLUMNS)
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase
        .from("invoice_items")
        .select(ITEM_COLUMNS)
        .eq("invoice_id", invoiceId)
        .order("position", { ascending: true }),
      supabase
        .from("invoice_payments")
        .select(PAYMENT_COLUMNS)
        .eq("invoice_id", invoiceId)
        .order("paid_at", { ascending: false }),
      supabase.rpc("get_invoice_share_status", { p_invoice_id: invoiceId }),
    ]);

    if (invoiceResult.error) {
      setError("Die Rechnung konnte nicht geladen werden.");
      return null;
    }
    if (!invoiceResult.data) {
      setError("Diese Rechnung wurde nicht gefunden.");
      return null;
    }

    const detail = invoiceResult.data as InvoiceDetail;
    setInvoice(detail);
    setForm(toForm(detail));
    setItems(itemsResult.error ? [] : ((itemsResult.data ?? []) as InvoiceItem[]));
    setItemError(itemsResult.error ? "Die Positionen konnten nicht geladen werden." : null);
    setPayments(paymentsResult.error ? [] : ((paymentsResult.data ?? []) as InvoicePayment[]));

    if (shareResult.error) {
      setShare(null);
    } else {
      const record = asRecord(shareResult.data);
      setShare({
        configured: bool(record["configured"]),
        expires_at: str(record["expires_at"]),
        last_viewed_at: str(record["last_viewed_at"]),
        customer_viewed_at: str(record["customer_viewed_at"]),
      });
    }

    if (detail.job_id) {
      const { data: job } = await supabase
        .from("jobs")
        .select("job_number, title, completed_at")
        .eq("id", detail.job_id)
        .eq("company_id", companyId)
        .maybeSingle();
      setJobNumber(job ? (str(job.job_number) ?? str(job.title)) : null);
      setJobCompletedAt(job ? str(job.completed_at) : null);
    } else {
      setJobNumber(null);
      setJobCompletedAt(null);
    }

    return detail;
  }, [invoiceId, companyId]);

  useEffect(() => {
    if (!open || !invoiceId || !companyId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setSaveError(null);
      setSaveSuccess(false);
      setStatusError(null);
      setStatusTarget(null);
      setPaymentError(null);
      setPaymentDraft(emptyPaymentDraft());
      setItemDraft(emptyItemDraft);
      setInvoice(null);
      setForm(null);
      setItems([]);
      setPayments([]);
      setShare(null);
      setJobNumber(null);
      setJobCompletedAt(null);
      setPdfError(null);
      setSendBusy(false);
      setSendConfirm(false);
      setSendError(null);
      setSendSuccess(false);
      await load();
      if (!cancelled) setLoading(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, invoiceId, companyId, load]);

  function update<K extends keyof FormState>(key: K, next: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: next } : prev));
    setSaveSuccess(false);
  }

  const isDraft = invoice?.status === "draft";
  const canPay = invoice ? ["sent", "overdue"].includes(invoice.status) : false;
  const isFinal = invoice ? ["paid", "cancelled"].includes(invoice.status) : false;
  const hasZeroTotal = (invoice?.total_cents ?? 0) <= 0;
  const hasUnsavedChanges = Boolean(
    invoice && form && JSON.stringify(form) !== JSON.stringify(toForm(invoice)),
  );

  const parsedPaymentAmount = euroInputToCents(paymentDraft.amount);
  const paymentExceedsBalance =
    invoice !== null &&
    !("error" in parsedPaymentAmount) &&
    (parsedPaymentAmount.cents ?? 0) > invoice.balance_cents;

  async function handleSave() {
    if (!invoice || !form || !companyId || !isDraft) return;
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);

    // Nummer, Summen, Zahlungs- und Statusfelder bleiben serverseitig verwaltet.
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        customer_name: form.customer_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        postal_code: form.postal_code.trim() || null,
        due_date: fromDateInput(form.due_date),
        payment_reference: form.payment_reference.trim() || null,
        notes: form.notes.trim() || null,
      })
      .eq("id", invoice.id)
      .eq("company_id", companyId);

    if (updateError) {
      setSaving(false);
      setSaveError("Die Änderungen konnten nicht gespeichert werden.");
      return;
    }

    await load();
    setSaving(false);
    setSaveSuccess(true);
    onChanged?.();
  }

  async function applyStatus(next: string) {
    if (!invoice || !companyId) return;
    setStatusError(null);

    setStatusBusy(true);

    const { error: statusUpdateError } = await supabase
      .from("invoices")
      .update({ status: next })
      .eq("id", invoice.id)
      .eq("company_id", companyId);

    if (statusUpdateError) {
      setStatusBusy(false);
      setStatusError("Der Status konnte nicht geändert werden.");
      return;
    }

    await load();
    setStatusBusy(false);
    setStatusTarget(null);
    onChanged?.();
  }

  async function handleSendEmail() {
    if (!invoice || !isDraft) return;
    setSendError(null);
    setSendSuccess(false);
    setSendBusy(true);

    try {
      await sendBusinessDocumentEmail("invoice", invoice.id);
      await load();
      setSendConfirm(false);
      setSendSuccess(true);
      onChanged?.();
    } catch (sendEmailError) {
      setSendError(
        sendEmailError instanceof Error
          ? sendEmailError.message
          : "Die E-Mail konnte nicht gesendet werden.",
      );
    } finally {
      setSendBusy(false);
    }
  }

  async function handleAddItem() {
    if (!invoice || !isDraft) return;
    setItemError(null);

    const description = itemDraft.description.trim();
    if (!description) {
      setItemError("Bitte eine Beschreibung eingeben.");
      return;
    }
    const unit = itemDraft.unit.trim();
    if (!unit) {
      setItemError("Bitte eine Einheit eingeben.");
      return;
    }

    const quantity = decimalInputToNumber(itemDraft.quantity, { max: 100000, allowZero: false });
    if ("error" in quantity) {
      setItemError(quantity.error);
      return;
    }

    const taxRate = decimalInputToNumber(itemDraft.tax_rate, { max: 100 });
    if ("error" in taxRate) {
      setItemError(taxRate.error);
      return;
    }

    const price = euroInputToCents(itemDraft.unit_price);
    if ("error" in price) {
      setItemError(price.error);
      return;
    }

    setItemBusy(true);
    const { error: insertError } = await supabase.from("invoice_items").insert({
      invoice_id: invoice.id,
      // company_id spiegelt die übergeordnete Rechnung.
      company_id: invoice.company_id,
      description,
      quantity: quantity.value,
      unit,
      unit_price_cents: price.cents ?? 0,
      tax_rate: taxRate.value,
      position: items.reduce((max, item) => Math.max(max, item.position), 0) + 1,
    });

    if (insertError) {
      setItemBusy(false);
      setItemError("Die Position konnte nicht hinzugefügt werden.");
      return;
    }

    setItemDraft(emptyItemDraft);
    await load();
    setItemBusy(false);
    onChanged?.();
  }

  async function handleDeleteItem(itemId: string) {
    if (!isDraft) return;
    setItemError(null);
    setItemBusy(true);
    const { error: deleteError } = await supabase.from("invoice_items").delete().eq("id", itemId);
    if (deleteError) {
      setItemBusy(false);
      setItemError("Die Position konnte nicht gelöscht werden.");
      return;
    }
    await load();
    setItemBusy(false);
    onChanged?.();
  }

  async function handleAddPayment() {
    if (!invoice || !companyId || !canPay) return;
    setPaymentError(null);

    const amount = euroInputToCents(paymentDraft.amount);
    if ("error" in amount) {
      setPaymentError(amount.error);
      return;
    }
    if (!amount.cents || amount.cents <= 0) {
      setPaymentError("Bitte einen Betrag größer als 0 eingeben.");
      return;
    }
    if (invoice.balance_cents <= 0) {
      setPaymentError("Für diese Rechnung ist kein offener Betrag vorhanden.");
      return;
    }
    if (amount.cents > invoice.balance_cents) {
      setPaymentError(
        `Der Betrag übersteigt den offenen Restbetrag von ${formatCents(invoice.balance_cents)}.`,
      );
      return;
    }
    const paidAt = fromDateInput(paymentDraft.paid_at);
    if (!paidAt) {
      setPaymentError("Bitte ein gültiges Zahlungsdatum wählen.");
      return;
    }

    setPaymentBusy(true);
    // Nur die Zahlung wird eingefügt – bezahlt/offen/Status berechnet das Backend.
    const { error: insertError } = await supabase.from("invoice_payments").insert({
      invoice_id: invoice.id,
      company_id: invoice.company_id,
      amount_cents: amount.cents,
      method: paymentDraft.method,
      paid_at: paidAt,
      reference: paymentDraft.reference.trim() || null,
      note: paymentDraft.note.trim() || null,
    });

    if (insertError) {
      setPaymentBusy(false);
      setPaymentError("Die Zahlung konnte nicht erfasst werden.");
      return;
    }

    setPaymentDraft(emptyPaymentDraft());
    await load();
    setPaymentBusy(false);
    onChanged?.();
  }

  async function handlePdf(mode: "download" | "print") {
    if (!invoice || !companyId) return;
    setPdfError(null);
    setPdfBusy(true);
    try {
      const company = await loadPdfCompany(companyId);
      const { blob, fileName } = buildInvoicePdf(invoice, items, company, jobCompletedAt);
      if (mode === "download") downloadPdfBlob(blob, fileName);
      else printPdfBlob(blob);
    } catch {
      setPdfError("Das PDF konnte nicht erstellt werden. Bitte erneut versuchen.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {invoice ? `Rechnung ${invoice.invoice_number}` : "Rechnungsdetails"}
          </SheetTitle>
          <SheetDescription>
            Kundendaten, Positionen, Status und Zahlungen. Summen und Zahlungsstand berechnet das
            System.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-10">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Rechnung wird geladen …
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-destructive">{error}</p>
          ) : invoice && form ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pdfBusy}
                  onClick={() => void handlePdf("download")}
                >
                  <Download className="size-4" />
                  {pdfBusy ? "PDF wird erstellt …" : "PDF herunterladen"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pdfBusy}
                  onClick={() => void handlePdf("print")}
                >
                  <Printer className="size-4" />
                  Drucken
                </Button>
                {pdfError ? <span className="text-xs text-destructive">{pdfError}</span> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kunde">{customerName(invoice.customer_name)}</Field>
                <Field label="Status">
                  <Badge variant={invoiceStatusVariant(invoice.status)}>
                    {invoiceStatusLabel(invoice.status)}
                  </Badge>
                </Field>
                <Field label="Kontakt">{invoice.email ?? invoice.phone ?? "—"}</Field>
                <Field label="Adresse">
                  {[invoice.postal_code, invoice.address].filter(Boolean).join(" ") || "—"}
                </Field>
                <Field label="Rechnungsdatum">{formatDate(invoice.issue_date)}</Field>
                <Field label="Fällig am">{formatDate(invoice.due_date)}</Field>
                <Field label="Zahlungsreferenz">{invoice.payment_reference ?? "—"}</Field>
                <Field label="Verknüpfter Auftrag">{jobNumber ?? "—"}</Field>
                <Field label="Zwischensumme">{formatCents(invoice.subtotal_cents)}</Field>
                <Field label="MwSt.">{formatCents(invoice.tax_cents)}</Field>
                <Field label="Gesamt">
                  <span className="font-semibold">{formatCents(invoice.total_cents)}</span>
                </Field>
                <Field label="Bezahlt">{formatCents(invoice.paid_cents)}</Field>
                <Field label="Offen">
                  <span className="font-semibold">{formatCents(invoice.balance_cents)}</span>
                </Field>
                <Field label="Gesendet am">{formatDateTime(invoice.sent_at)}</Field>
                <Field label="Bezahlt am">{formatDateTime(invoice.paid_at)}</Field>
                <Field label="Storniert am">{formatDateTime(invoice.cancelled_at)}</Field>
                <Field label="Notizen">{invoice.notes ?? "—"}</Field>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Status</h3>
                {isFinal ? (
                  <p className="text-xs text-muted-foreground">
                    Bezahlte oder stornierte Rechnungen sind abgeschlossen und können nicht mehr
                    geändert werden.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {isDraft ? (
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          disabled={
                            sendBusy ||
                            statusBusy ||
                            hasZeroTotal ||
                            !invoice.email ||
                            hasUnsavedChanges ||
                            items.length === 0
                          }
                          onClick={() => {
                            setSendError(null);
                            setSendSuccess(false);
                            setSendConfirm(true);
                          }}
                        >
                          <Mail className="size-4" />
                          Per E-Mail senden
                        </Button>
                        {hasZeroTotal ? (
                          <p className="text-xs text-muted-foreground">
                            Rechnungen mit 0,00 € Gesamtbetrag können nicht gesendet werden. Bitte
                            zuerst Positionen hinzufügen.
                          </p>
                        ) : null}
                        {!invoice.email ? (
                          <p className="text-xs text-muted-foreground">
                            Bitte zuerst eine gültige Kunden-E-Mail speichern.
                          </p>
                        ) : null}
                        {hasUnsavedChanges ? (
                          <p className="text-xs text-muted-foreground">
                            Bitte die Änderungen vor dem Versand speichern.
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {canPay ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={statusBusy}
                        onClick={() => {
                          setStatusError(null);
                          setStatusTarget("cancelled");
                        }}
                      >
                        Rechnung stornieren
                      </Button>
                    ) : null}
                  </div>
                )}

                {sendConfirm ? (
                  <div className="rounded-md border border-dashed p-3 text-sm">
                    <p className="font-medium">Rechnung jetzt per E-Mail senden?</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Die Rechnung wird mit dem aktuellen PDF an {invoice.email} gesendet. Erst nach
                      erfolgreicher Zustellung an Brevo wird der Status auf „Gesendet“ gesetzt.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" disabled={sendBusy} onClick={() => void handleSendEmail()}>
                        {sendBusy ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Wird gesendet …
                          </>
                        ) : (
                          "Jetzt senden"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={sendBusy}
                        onClick={() => setSendConfirm(false)}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : null}

                {statusTarget ? (
                  <div className="rounded-md border border-dashed p-3 text-sm">
                    <p className="font-medium">
                      Status auf „{invoiceStatusLabel(statusTarget)}“ setzen?
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Stornierte Rechnungen sind endgültig abgeschlossen.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        disabled={statusBusy}
                        onClick={() => void applyStatus(statusTarget)}
                      >
                        {statusBusy ? "Wird gespeichert …" : "Bestätigen"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={statusBusy}
                        onClick={() => setStatusTarget(null)}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : null}

                {statusError ? <p className="text-xs text-destructive">{statusError}</p> : null}
                {sendError ? <p className="text-xs text-destructive">{sendError}</p> : null}
                {sendSuccess ? (
                  <p className="text-xs text-emerald-700">
                    Die Rechnung wurde per E-Mail gesendet.
                  </p>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Rechnungsdaten</h3>
                {isDraft ? null : (
                  <p className="text-xs text-muted-foreground">
                    Rechnungsdaten können nur im Entwurf bearbeitet werden.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="invoice-customer">Kundenname</Label>
                    <Input
                      id="invoice-customer"
                      value={form.customer_name}
                      disabled={!isDraft}
                      onChange={(e) => update("customer_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="invoice-phone">Telefon</Label>
                    <Input
                      id="invoice-phone"
                      value={form.phone}
                      disabled={!isDraft}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="invoice-email">E-Mail</Label>
                    <Input
                      id="invoice-email"
                      type="email"
                      value={form.email}
                      disabled={!isDraft}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="invoice-postal">PLZ</Label>
                    <Input
                      id="invoice-postal"
                      value={form.postal_code}
                      disabled={!isDraft}
                      onChange={(e) => update("postal_code", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="invoice-address">Adresse</Label>
                    <Input
                      id="invoice-address"
                      value={form.address}
                      disabled={!isDraft}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="invoice-due">Fällig am</Label>
                    <Input
                      id="invoice-due"
                      type="date"
                      value={form.due_date}
                      disabled={!isDraft}
                      onChange={(e) => update("due_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="invoice-reference">Zahlungsreferenz</Label>
                    <Input
                      id="invoice-reference"
                      value={form.payment_reference}
                      disabled={!isDraft}
                      onChange={(e) => update("payment_reference", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="invoice-notes">Notizen</Label>
                    <Textarea
                      id="invoice-notes"
                      rows={3}
                      value={form.notes}
                      disabled={!isDraft}
                      onChange={(e) => update("notes", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void handleSave()} disabled={saving || !isDraft}>
                    {saving ? "Wird gespeichert …" : "Änderungen speichern"}
                  </Button>
                  {saveSuccess ? (
                    <span className="text-xs text-muted-foreground">Gespeichert.</span>
                  ) : null}
                  {saveError ? <span className="text-xs text-destructive">{saveError}</span> : null}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Positionen</h3>

                {items.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                    Noch keine Positionen erfasst.
                  </p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatQuantity(item.quantity)} {item.unit} ×{" "}
                            {formatCents(item.unit_price_cents)} · MwSt.{" "}
                            {formatQuantity(item.tax_rate)} %
                          </p>
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {formatCents(Math.round(item.quantity * item.unit_price_cents))}
                        </span>
                        {isDraft ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Position löschen"
                            disabled={itemBusy}
                            onClick={() => void handleDeleteItem(item.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}

                {isDraft ? (
                  <div className="space-y-3 rounded-md border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Neue Position hinzufügen
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="invoice-item-description">Beschreibung</Label>
                        <Input
                          id="invoice-item-description"
                          value={itemDraft.description}
                          onChange={(e) =>
                            setItemDraft({ ...itemDraft, description: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="invoice-item-quantity">Menge</Label>
                        <Input
                          id="invoice-item-quantity"
                          value={itemDraft.quantity}
                          onChange={(e) => setItemDraft({ ...itemDraft, quantity: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="invoice-item-unit">Einheit</Label>
                        <Input
                          id="invoice-item-unit"
                          value={itemDraft.unit}
                          onChange={(e) => setItemDraft({ ...itemDraft, unit: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="invoice-item-price">Einzelpreis (EUR)</Label>
                        <Input
                          id="invoice-item-price"
                          inputMode="decimal"
                          placeholder="z. B. 149,90"
                          value={itemDraft.unit_price}
                          onChange={(e) =>
                            setItemDraft({ ...itemDraft, unit_price: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="invoice-item-tax">MwSt.-Satz (%)</Label>
                        <Input
                          id="invoice-item-tax"
                          inputMode="decimal"
                          value={itemDraft.tax_rate}
                          onChange={(e) => setItemDraft({ ...itemDraft, tax_rate: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button size="sm" disabled={itemBusy} onClick={() => void handleAddItem()}>
                      <Plus className="size-4" />
                      {itemBusy ? "Wird gespeichert …" : "Position hinzufügen"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Positionen sind nur im Entwurf bearbeitbar.
                  </p>
                )}

                {itemError ? <p className="text-xs text-destructive">{itemError}</p> : null}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Zahlungen</h3>

                {payments.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                    Noch keine Zahlungen erfasst.
                  </p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {payments.map((payment) => (
                      <li key={payment.id} className="flex items-start gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {formatCents(payment.amount_cents)} ·{" "}
                            {paymentMethodLabel(payment.method)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(payment.paid_at)}
                            {payment.reference ? ` · ${payment.reference}` : ""}
                            {payment.note ? ` · ${payment.note}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {canPay ? (
                  <div className="space-y-3 rounded-md border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Zahlung erfassen (offen: {formatCents(invoice.balance_cents)})
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="payment-amount">Betrag (EUR)</Label>
                        <Input
                          id="payment-amount"
                          inputMode="decimal"
                          placeholder="z. B. 250,00"
                          aria-invalid={paymentExceedsBalance}
                          value={paymentDraft.amount}
                          onChange={(e) =>
                            setPaymentDraft({ ...paymentDraft, amount: e.target.value })
                          }
                        />
                        {paymentExceedsBalance ? (
                          <p className="text-xs text-destructive">
                            Der Betrag übersteigt den offenen Restbetrag von{" "}
                            {formatCents(invoice.balance_cents)}.
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="payment-method">Zahlungsart</Label>
                        <Select
                          value={paymentDraft.method}
                          onValueChange={(value) =>
                            setPaymentDraft({ ...paymentDraft, method: value })
                          }
                        >
                          <SelectTrigger id="payment-method" aria-label="Zahlungsart">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethodOptions.map((method) => (
                              <SelectItem key={method} value={method}>
                                {paymentMethodLabel(method)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="payment-date">Zahlungsdatum</Label>
                        <Input
                          id="payment-date"
                          type="date"
                          value={paymentDraft.paid_at}
                          onChange={(e) =>
                            setPaymentDraft({ ...paymentDraft, paid_at: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="payment-reference">Referenz (optional)</Label>
                        <Input
                          id="payment-reference"
                          value={paymentDraft.reference}
                          onChange={(e) =>
                            setPaymentDraft({ ...paymentDraft, reference: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="payment-note">Notiz (optional)</Label>
                        <Input
                          id="payment-note"
                          value={paymentDraft.note}
                          onChange={(e) =>
                            setPaymentDraft({ ...paymentDraft, note: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={paymentBusy || paymentExceedsBalance || invoice.balance_cents <= 0}
                      onClick={() => void handleAddPayment()}
                    >
                      <Plus className="size-4" />
                      {paymentBusy ? "Wird gespeichert …" : "Zahlung erfassen"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Zahlungen können nur für gesendete oder überfällige Rechnungen erfasst werden.
                    Der Zahlungsstatus wird automatisch berechnet.
                  </p>
                )}

                {paymentError ? <p className="text-xs text-destructive">{paymentError}</p> : null}
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Kundenlink</h3>
                {share?.configured ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Status">Aktiv</Field>
                    <Field label="Gültig bis">{formatDateTime(share.expires_at)}</Field>
                    <Field label="Zuletzt aufgerufen">{formatDateTime(share.last_viewed_at)}</Field>
                    <Field label="Vom Kunden gesehen">
                      {formatDateTime(share.customer_viewed_at)}
                    </Field>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Für diese Rechnung ist kein Kundenlink eingerichtet.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
