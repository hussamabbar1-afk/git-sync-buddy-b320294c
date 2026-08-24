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
  centsToEuroInput,
  customerName,
  decimalInputToNumber,
  euroInputToCents,
  formatCents,
  formatDate,
  formatDateTime,
  fromDateInput,
  quoteStatusLabel,
  quoteStatusOptions,
  quoteStatusVariant,
  toDateInput,
} from "@/lib/crm";
import { downloadPdfBlob, printPdfBlob } from "@/lib/pdf/business-document";
import { buildQuotePdf, loadPdfCompany } from "@/lib/pdf/documents";
import { sendBusinessDocumentEmail } from "@/lib/business-document-email";

const QUOTE_COLUMNS =
  "id, company_id, quote_number, status, customer_name, phone, email, address, postal_code, currency, valid_until, notes, subtotal_cents, tax_cents, total_cents, sent_at, accepted_at, rejected_at, created_at, updated_at, customer_id, lead_id";

const ITEM_COLUMNS =
  "id, quote_id, position, description, quantity, unit, unit_price_cents, tax_rate, created_at";

export type QuoteDetail = {
  id: string;
  company_id: string;
  quote_number: string;
  status: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postal_code: string | null;
  currency: string;
  valid_until: string | null;
  notes: string | null;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  lead_id: string | null;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  position: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  tax_rate: number;
  created_at: string;
};

type FormState = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  valid_until: string;
  notes: string;
};

type ItemDraft = {
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  tax_rate: string;
};

const emptyDraft: ItemDraft = {
  description: "",
  quantity: "1",
  unit: "Stk",
  unit_price: "",
  tax_rate: "19",
};

// Statuses whose side effects reach beyond this page (backend job creation,
// lead status sync) and therefore need an explicit confirmation.
const consequentialStatuses = new Set(["accepted", "cancelled"]);

function statusHint(status: string) {
  switch (status) {
    case "accepted":
      return "Angenommene Angebote werden im Backend weiterverarbeitet (z. B. Auftragsanlage). Diese Aktion kann nicht rückgängig gemacht werden.";
    case "cancelled":
      return "Storniert beendet das Angebot. Es kann danach nicht mehr angenommen werden.";
    default:
      return "";
  }
}

function toForm(quote: QuoteDetail): FormState {
  return {
    customer_name: quote.customer_name ?? "",
    phone: quote.phone ?? "",
    email: quote.email ?? "",
    address: quote.address ?? "",
    postal_code: quote.postal_code ?? "",
    valid_until: toDateInput(quote.valid_until),
    notes: quote.notes ?? "",
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

export function QuoteDetailSheet({
  quoteId,
  companyId,
  open,
  onOpenChange,
  onChanged,
}: {
  quoteId: string | null;
  companyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [itemBusy, setItemBusy] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [sendConfirm, setSendConfirm] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!quoteId || !companyId) return null;

    const [quoteResult, itemsResult] = await Promise.all([
      supabase
        .from("quotes")
        .select(QUOTE_COLUMNS)
        .eq("id", quoteId)
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase
        .from("quote_items")
        .select(ITEM_COLUMNS)
        .eq("quote_id", quoteId)
        .order("position", { ascending: true }),
    ]);

    if (quoteResult.error) {
      setError("Das Angebot konnte nicht geladen werden.");
      return null;
    }
    if (!quoteResult.data) {
      setError("Dieses Angebot wurde nicht gefunden.");
      return null;
    }

    const detail = quoteResult.data as QuoteDetail;
    setQuote(detail);
    setForm(toForm(detail));
    setItems(itemsResult.error ? [] : ((itemsResult.data ?? []) as QuoteItem[]));
    setItemError(itemsResult.error ? "Die Positionen konnten nicht geladen werden." : null);
    return detail;
  }, [quoteId, companyId]);

  useEffect(() => {
    if (!open || !quoteId || !companyId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setSaveError(null);
      setSaveSuccess(false);
      setStatusError(null);
      setStatusTarget(null);
      setDraft(emptyDraft);
      setPdfError(null);
      setSendBusy(false);
      setSendConfirm(false);
      setSendError(null);
      setSendSuccess(false);
      setQuote(null);
      setForm(null);
      setItems([]);
      await load();
      if (!cancelled) setLoading(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, quoteId, companyId, load]);

  function update<K extends keyof FormState>(key: K, next: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: next } : prev));
    setSaveSuccess(false);
  }

  async function handleSave() {
    if (!quote || !form || !companyId) return;
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);

    // Totals and quote_number stay backend-managed and are never written here.
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        customer_name: form.customer_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        postal_code: form.postal_code.trim() || null,
        valid_until: fromDateInput(form.valid_until),
        notes: form.notes.trim() || null,
      })
      .eq("id", quote.id)
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
    if (!quote || !companyId) return;
    setStatusError(null);
    setStatusBusy(true);

    const { error: statusUpdateError } = await supabase
      .from("quotes")
      .update({ status: next })
      .eq("id", quote.id)
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

  function requestStatus(next: string) {
    if (!quote || next === quote.status || locked) return;
    setStatusError(null);
    if (next === "sent") {
      setStatusError(
        "Der Status „Gesendet“ wird ausschließlich nach erfolgreichem E-Mail-Versand gesetzt.",
      );
      return;
    }
    if (consequentialStatuses.has(next)) {
      setStatusTarget(next);
      return;
    }
    void applyStatus(next);
  }

  async function handleAddItem() {
    if (!quote) return;
    setItemError(null);

    const description = draft.description.trim();
    if (!description) {
      setItemError("Bitte eine Beschreibung eingeben.");
      return;
    }

    const quantity = decimalInputToNumber(draft.quantity, { max: 100000, allowZero: false });
    if ("error" in quantity) {
      setItemError(quantity.error);
      return;
    }

    const taxRate = decimalInputToNumber(draft.tax_rate, { max: 100 });
    if ("error" in taxRate) {
      setItemError(taxRate.error);
      return;
    }

    const price = euroInputToCents(draft.unit_price);
    if ("error" in price) {
      setItemError(price.error);
      return;
    }

    setItemBusy(true);
    const { error: insertError } = await supabase.from("quote_items").insert({
      quote_id: quote.id,
      // company_id mirrors the parent quote and is re-derived server-side.
      company_id: quote.company_id,
      description,
      quantity: quantity.value,
      unit: draft.unit.trim() || "Stk",
      unit_price_cents: price.cents ?? 0,
      tax_rate: taxRate.value,
      position: items.reduce((max, item) => Math.max(max, item.position), 0) + 1,
    });

    if (insertError) {
      setItemBusy(false);
      setItemError("Die Position konnte nicht hinzugefügt werden.");
      return;
    }

    setDraft(emptyDraft);
    await load();
    setItemBusy(false);
    onChanged?.();
  }

  async function handleSendEmail() {
    if (!quote || quote.status !== "draft") return;
    setSendError(null);
    setSendSuccess(false);
    setSendBusy(true);

    try {
      await sendBusinessDocumentEmail("quote", quote.id);
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

  async function handleDeleteItem(itemId: string) {
    setItemError(null);
    setItemBusy(true);
    const { error: deleteError } = await supabase.from("quote_items").delete().eq("id", itemId);
    if (deleteError) {
      setItemBusy(false);
      setItemError("Die Position konnte nicht gelöscht werden.");
      return;
    }
    await load();
    setItemBusy(false);
    onChanged?.();
  }

  async function handlePdf(mode: "download" | "print") {
    if (!quote || !companyId) return;
    setPdfError(null);
    setPdfBusy(true);
    try {
      const company = await loadPdfCompany(companyId);
      const { blob, fileName } = buildQuotePdf(quote, items, company);
      if (mode === "download") downloadPdfBlob(blob, fileName);
      else printPdfBlob(blob);
    } catch {
      setPdfError("Das PDF konnte nicht erstellt werden. Bitte erneut versuchen.");
    } finally {
      setPdfBusy(false);
    }
  }

  const locked = quote ? ["accepted", "cancelled"].includes(quote.status) : false;
  const hasUnsavedChanges = Boolean(
    quote && form && JSON.stringify(form) !== JSON.stringify(toForm(quote)),
  );
  const hasZeroTotal = (quote?.total_cents ?? 0) <= 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{quote ? `Angebot ${quote.quote_number}` : "Angebotsdetails"}</SheetTitle>
          <SheetDescription>
            Kundendaten, Positionen und Status dieses Angebots. Summen berechnet das System.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-10">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Angebot wird geladen …
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-destructive">{error}</p>
          ) : quote && form ? (
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
                <Field label="Kunde">{customerName(quote.customer_name)}</Field>
                <Field label="Status">
                  <Badge variant={quoteStatusVariant(quote.status)}>
                    {quoteStatusLabel(quote.status)}
                  </Badge>
                </Field>
                <Field label="Gültig bis">{formatDate(quote.valid_until)}</Field>
                <Field label="Erstellt">{formatDateTime(quote.created_at)}</Field>
                <Field label="Zwischensumme">{formatCents(quote.subtotal_cents)}</Field>
                <Field label="MwSt.">{formatCents(quote.tax_cents)}</Field>
                <Field label="Gesamt">
                  <span className="font-semibold">{formatCents(quote.total_cents)}</span>
                </Field>
                <Field label="Gesendet am">{formatDateTime(quote.sent_at)}</Field>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Status ändern</h3>
                {quote.status === "draft" ? (
                  <div className="flex flex-col items-start gap-1">
                    <Button
                      size="sm"
                      disabled={
                        sendBusy ||
                        statusBusy ||
                        hasZeroTotal ||
                        !quote.email ||
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
                    {hasZeroTotal || items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Bitte zuerst mindestens eine Position mit einem Gesamtbetrag über 0,00 €
                        hinzufügen.
                      </p>
                    ) : null}
                    {!quote.email ? (
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
                <Select
                  value={quote.status}
                  onValueChange={requestStatus}
                  disabled={statusBusy || locked}
                >
                  <SelectTrigger className="sm:w-72" aria-label="Angebotsstatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quoteStatusOptions
                      .filter((status) => status !== "sent" || quote.status === "sent")
                      .map((status) => (
                        <SelectItem key={status} value={status}>
                          {quoteStatusLabel(status)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {locked ? (
                  <p className="text-xs text-muted-foreground">
                    Angenommene oder stornierte Angebote können nicht mehr umgestellt werden.
                  </p>
                ) : null}

                {sendConfirm ? (
                  <div className="rounded-md border border-dashed p-3 text-sm">
                    <p className="font-medium">Angebot jetzt per E-Mail senden?</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Das Angebot wird mit dem aktuellen PDF an {quote.email} gesendet. Erst nach
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
                      Status auf „{quoteStatusLabel(statusTarget)}“ setzen?
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{statusHint(statusTarget)}</p>
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
                  <p className="text-xs text-emerald-700">Das Angebot wurde per E-Mail gesendet.</p>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Angebotsdaten</h3>
                {locked ? (
                  <p className="text-xs text-muted-foreground">
                    Angenommene oder stornierte Angebote können nicht mehr bearbeitet werden.
                  </p>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="quote-customer">Kundenname</Label>
                    <Input
                      id="quote-customer"
                      value={form.customer_name}
                      disabled={locked}
                      onChange={(e) => update("customer_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quote-phone">Telefon</Label>
                    <Input
                      id="quote-phone"
                      value={form.phone}
                      disabled={locked}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quote-email">E-Mail</Label>
                    <Input
                      id="quote-email"
                      type="email"
                      value={form.email}
                      disabled={locked}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quote-postal">PLZ</Label>
                    <Input
                      id="quote-postal"
                      value={form.postal_code}
                      disabled={locked}
                      onChange={(e) => update("postal_code", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="quote-address">Adresse</Label>
                    <Input
                      id="quote-address"
                      value={form.address}
                      disabled={locked}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quote-valid">Gültig bis</Label>
                    <Input
                      id="quote-valid"
                      type="date"
                      value={form.valid_until}
                      disabled={locked}
                      onChange={(e) => update("valid_until", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="quote-notes">Notizen</Label>
                    <Textarea
                      id="quote-notes"
                      rows={3}
                      value={form.notes}
                      disabled={locked}
                      onChange={(e) => update("notes", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void handleSave()} disabled={saving || locked}>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Position löschen"
                          disabled={itemBusy || locked}
                          onClick={() => void handleDeleteItem(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {locked ? (
                  <p className="text-xs text-muted-foreground">
                    Positionen können bei angenommenen oder stornierten Angeboten nicht mehr
                    geändert werden.
                  </p>
                ) : (
                  <div className="space-y-3 rounded-md border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Neue Position hinzufügen
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="item-description">Beschreibung</Label>
                        <Input
                          id="item-description"
                          value={draft.description}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="item-quantity">Menge</Label>
                        <Input
                          id="item-quantity"
                          value={draft.quantity}
                          onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="item-unit">Einheit</Label>
                        <Input
                          id="item-unit"
                          value={draft.unit}
                          onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="item-price">Einzelpreis (EUR)</Label>
                        <Input
                          id="item-price"
                          inputMode="decimal"
                          placeholder="z. B. 149,90"
                          value={draft.unit_price}
                          onChange={(e) => setDraft({ ...draft, unit_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="item-tax">MwSt.-Satz (%)</Label>
                        <Input
                          id="item-tax"
                          inputMode="decimal"
                          value={draft.tax_rate}
                          onChange={(e) => setDraft({ ...draft, tax_rate: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button size="sm" disabled={itemBusy} onClick={() => void handleAddItem()}>
                      <Plus className="size-4" />
                      {itemBusy ? "Wird gespeichert …" : "Position hinzufügen"}
                    </Button>
                  </div>
                )}

                {itemError ? <p className="text-xs text-destructive">{itemError}</p> : null}
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
