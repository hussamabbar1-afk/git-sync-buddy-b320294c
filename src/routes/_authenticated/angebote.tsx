import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { QuoteDetailSheet } from "@/components/quote-detail-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { detailSearchSchema, useDetailDeepLink } from "@/lib/deep-link";
import { supabase } from "@/integrations/supabase/client";
import { createCustomer } from "@/lib/customers";
import {
  asRecord,
  customerName,
  formatCents,
  formatDate,
  formatDateTime,
  fromDateInput,
  num,
  quoteStatusLabel,
  quoteStatusOptions,
  quoteStatusVariant,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/angebote")({
  head: () => ({
    meta: [
      { title: "Angebote – ZunftEcho" },
      {
        name: "description",
        content:
          "Angebote Ihres SHK-Betriebs erstellen, Positionen pflegen und Status von Entwurf bis Annahme verfolgen.",
      },
      { property: "og:title", content: "Angebote – ZunftEcho" },
      {
        property: "og:description",
        content: "Angebotsübersicht mit Kennzahlen, Positionen und Statusverlauf.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: detailSearchSchema,
  component: AngebotePage,
});

const LIST_COLUMNS =
  "id, quote_number, status, customer_name, phone, email, valid_until, total_cents, created_at";

type QuoteRow = {
  id: string;
  quote_number: string;
  status: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  valid_until: string | null;
  total_cents: number;
  created_at: string;
};

type Metrics = {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  open_value_cents: number;
  accepted_value_cents: number;
  acceptance_rate_percent: number;
};

type CreateForm = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  valid_until: string;
  notes: string;
};

type CustomerOption = {
  id: string;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postal_code: string | null;
};

const emptyCreateForm: CreateForm = {
  customer_name: "",
  phone: "",
  email: "",
  address: "",
  postal_code: "",
  valid_until: "",
  notes: "",
};

function AngebotePage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { id: deepLinkId } = Route.useSearch();
  const clearDeepLink = useDetailDeepLink("/angebote", deepLinkId, (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreateForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [customerMode, setCustomerMode] = useState<"existing" | "manual">("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (!createOpen || customerMode !== "existing") return;
    let cancelled = false;
    setCustomerLoading(true);
    const term = customerSearch.trim();
    const timer = setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc(
        "get_customer_master",
        term.length > 0 ? { p_query: term, p_limit: 20 } : { p_limit: 20 },
      );
      if (cancelled) return;
      setCustomerOptions(rpcError ? [] : ((data ?? []) as CustomerOption[]));
      setCustomerLoading(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [createOpen, customerMode, customerSearch]);

  function applyCustomer(customer: CustomerOption) {
    setSelectedCustomerId(customer.id);
    setCreateForm((prev) => ({
      ...prev,
      customer_name: customer.display_name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
      postal_code: customer.postal_code ?? "",
    }));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCompany() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (profileError || !profile?.company_id) {
        setCompanyError(
          "Ihrem Konto ist noch kein Betrieb zugeordnet. Bitte schließen Sie die Einrichtung ab.",
        );
        setLoading(false);
        return;
      }
      setCompanyId(profile.company_id);
    }

    void loadCompany();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMetrics = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("get_quote_metrics");
    if (rpcError) return;
    const record = asRecord(data);
    setMetrics({
      total: num(record["total"]),
      draft: num(record["draft"]),
      sent: num(record["sent"]),
      accepted: num(record["accepted"]),
      rejected: num(record["rejected"]),
      open_value_cents: num(record["open_value_cents"]),
      accepted_value_cents: num(record["accepted_value_cents"]),
      acceptance_rate_percent: num(record["acceptance_rate_percent"]),
    });
  }, []);

  const loadQuotes = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    let query = supabase
      .from("quotes")
      .select(LIST_COLUMNS)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const term = search.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%,]/g, " ");
      query = query.or(
        `quote_number.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
      );
    }

    const { data, error: listError } = await query;

    if (listError) {
      setError("Die Angebote konnten nicht geladen werden.");
      setRows([]);
    } else {
      setError(null);
      setRows((data ?? []) as QuoteRow[]);
    }
    setLoading(false);
  }, [companyId, search, statusFilter]);

  useEffect(() => {
    if (!companyId) return;
    void loadMetrics();
  }, [companyId, loadMetrics]);

  useEffect(() => {
    if (!companyId) return;
    const timer = setTimeout(() => void loadQuotes(), 300);
    return () => clearTimeout(timer);
  }, [companyId, loadQuotes]);

  async function refresh() {
    await Promise.all([loadQuotes(), loadMetrics()]);
  }

  async function handleCreate() {
    if (!companyId) return;
    setCreateError(null);

    const customerNameValue = createForm.customer_name.trim();
    if (customerMode === "existing" && !selectedCustomerId) {
      setCreateError("Bitte einen Bestandskunden auswählen oder manuell erfassen.");
      return;
    }
    if (!customerNameValue) {
      setCreateError("Bitte einen Kundennamen angeben.");
      return;
    }

    setCreating(true);

    // Bei "Neuer Kunde" zuerst echten Kundenstammsatz anlegen (kein Angebot ohne Kunde).
    let customerId = customerMode === "existing" ? selectedCustomerId : null;
    if (customerMode === "manual") {
      const created = await createCustomer(companyId, {
        display_name: customerNameValue,
        phone: createForm.phone,
        email: createForm.email,
        address: createForm.address,
        postal_code: createForm.postal_code,
      });
      if (!created.ok) {
        setCreating(false);
        setCreateError(created.error);
        return;
      }
      customerId = created.customer.id;
    }

    // quote_number, Gültigkeit-Fallback und alle Summen werden serverseitig gesetzt.
    const { data, error: insertError } = await supabase
      .from("quotes")
      .insert({
        company_id: companyId,
        // Leer lassen: die Nummer wird serverseitig fortlaufend erzeugt.
        quote_number: "",
        customer_id: customerId,
        customer_name: customerNameValue,
        phone: createForm.phone.trim() || null,
        email: createForm.email.trim() || null,
        address: createForm.address.trim() || null,
        postal_code: createForm.postal_code.trim() || null,
        valid_until: fromDateInput(createForm.valid_until),
        notes: createForm.notes.trim() || null,
      })
      .select("id")
      .maybeSingle();

    if (insertError || !data) {
      setCreating(false);
      setCreateError("Das Angebot konnte nicht erstellt werden.");
      return;
    }

    setCreating(false);
    setCreateOpen(false);
    setCreateForm(emptyCreateForm);
    setCustomerMode("existing");
    setCustomerSearch("");
    setSelectedCustomerId(null);
    await refresh();
    setSelectedId(data.id);
    setDetailOpen(true);
  }

  const cards = [
    { label: "Angebote gesamt", value: metrics ? String(metrics.total) : undefined },
    { label: "Entwürfe", value: metrics ? String(metrics.draft) : undefined },
    { label: "Gesendet", value: metrics ? String(metrics.sent) : undefined },
    {
      label: "Offener Wert",
      value: metrics ? formatCents(metrics.open_value_cents) : undefined,
    },
    {
      label: "Angenommener Wert",
      value: metrics ? formatCents(metrics.accepted_value_cents) : undefined,
    },
    {
      label: "Annahmequote",
      value: metrics ? `${metrics.acceptance_rate_percent} %` : undefined,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Angebote"
        description="Angebote erstellen, Positionen pflegen und den Status im Blick behalten."
        action={
          <Button onClick={() => setCreateOpen(true)} disabled={!companyId}>
            <Plus className="size-4" />
            Angebot erstellen
          </Button>
        }
      />

      {companyError ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-destructive">
          {companyError}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{card.value ?? "–"}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Angebotsliste</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nummer, Kunde, E-Mail oder Telefon"
                  className="sm:w-72"
                  aria-label="Angebote durchsuchen"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="sm:w-48" aria-label="Status filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    {quoteStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {quoteStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Angebote werden geladen …
                </div>
              ) : error ? (
                <div className="space-y-3 py-12 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => void loadQuotes()}>
                    Erneut versuchen
                  </Button>
                </div>
              ) : rows.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {search.trim() || statusFilter !== "all"
                    ? "Keine Angebote passen zu diesem Filter."
                    : "Noch keine Angebote vorhanden. Erstellen Sie Ihr erstes Angebot."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nummer</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Gültig bis</TableHead>
                        <TableHead className="text-right">Gesamt</TableHead>
                        <TableHead>Erstellt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedId(row.id);
                            setDetailOpen(true);
                          }}
                        >
                          <TableCell className="font-medium">{row.quote_number}</TableCell>
                          <TableCell>
                            <span className="block">{customerName(row.customer_name)}</span>
                            <span className="text-xs text-muted-foreground">
                              {row.email ?? row.phone ?? ""}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={quoteStatusVariant(row.status)}>
                              {quoteStatusLabel(row.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(row.valid_until)}</TableCell>
                          <TableCell className="text-right">
                            {formatCents(row.total_cents)}
                          </TableCell>
                          <TableCell>{formatDateTime(row.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Neues Angebot</DialogTitle>
            <DialogDescription>
              Angebotsnummer und Summen werden automatisch vom System gesetzt. Positionen fügen Sie
              anschließend hinzu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Kunde</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={customerMode === "existing" ? "default" : "outline"}
                  onClick={() => setCustomerMode("existing")}
                >
                  Bestandskunde
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={customerMode === "manual" ? "default" : "outline"}
                  onClick={() => {
                    setCustomerMode("manual");
                    setSelectedCustomerId(null);
                  }}
                >
                  Neuer Kunde (manuell)
                </Button>
              </div>

              {customerMode === "existing" ? (
                <div className="space-y-2">
                  <Input
                    id="quote-customer-search"
                    placeholder="Kunden suchen (Name, E-Mail, Telefon) …"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  <div className="max-h-48 overflow-y-auto rounded-md border">
                    {customerLoading ? (
                      <p className="p-3 text-sm text-muted-foreground">Kunden werden geladen …</p>
                    ) : customerOptions.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">
                        Keine Kunden gefunden. Wechseln Sie zu „Neuer Kunde (manuell)“.
                      </p>
                    ) : (
                      customerOptions.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => applyCustomer(customer)}
                          className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                            selectedCustomerId === customer.id ? "bg-muted" : ""
                          }`}
                        >
                          <span className="font-medium">{customer.display_name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {[customer.email, customer.phone, customer.postal_code]
                              .filter(Boolean)
                              .join(" · ") || "Keine Kontaktdaten"}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="create-name">Kundenname</Label>
              <Input
                id="create-name"
                value={createForm.customer_name}
                readOnly={customerMode === "existing"}
                onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
              />
              {customerMode === "manual" && createForm.customer_name.trim().length === 0 ? (
                <p className="text-xs text-destructive">Kundenname ist erforderlich.</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="create-phone">Telefon</Label>
              <Input
                id="create-phone"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-email">E-Mail</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="create-address">Adresse</Label>
              <Input
                id="create-address"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-postal">PLZ</Label>
              <Input
                id="create-postal"
                value={createForm.postal_code}
                onChange={(e) => setCreateForm({ ...createForm, postal_code: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-valid">Gültig bis (optional)</Label>
              <Input
                id="create-valid"
                type="date"
                value={createForm.valid_until}
                onChange={(e) => setCreateForm({ ...createForm, valid_until: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="create-notes">Notizen</Label>
              <Textarea
                id="create-notes"
                rows={3}
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />
            </div>
          </div>

          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Abbrechen
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating ? "Wird erstellt …" : "Angebot erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuoteDetailSheet
        quoteId={selectedId}
        companyId={companyId}
        open={detailOpen}
        onOpenChange={(next) => {
          setDetailOpen(next);
          if (!next) {
            setSelectedId(null);
            clearDeepLink();
          }
        }}
        onChanged={() => void refresh()}
      />
    </AppShell>
  );
}
