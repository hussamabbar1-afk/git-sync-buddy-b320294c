import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { JobDetailSheet } from "@/components/job-detail-sheet";
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
  euroInputToCents,
  formatCents,
  formatDate,
  formatTime,
  fromDateInput,
  fromTimeInput,
  jobPriorityOptions,
  jobStatusLabel,
  jobStatusOptions,
  jobStatusVariant,
  num,
  parseTags,
  priorityLabel,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/auftraege")({
  head: () => ({
    meta: [
      { title: "Aufträge – ZunftEcho" },
      {
        name: "description",
        content:
          "Aufträge Ihres SHK-Betriebs planen, Termine und Prioritäten steuern und Werte von Schätzung bis Abschluss verfolgen.",
      },
      { property: "og:title", content: "Aufträge – ZunftEcho" },
      {
        property: "og:description",
        content: "Auftragsübersicht mit Kennzahlen, Planung, Prioritäten und Auftragswerten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: detailSearchSchema,
  component: AuftraegePage,
});

const LIST_COLUMNS =
  "id, job_number, title, status, priority, customer_name, phone, email, scheduled_date, scheduled_start_time, scheduled_end_time, estimated_value_cents, final_value_cents, created_at";

type JobRow = {
  id: string;
  job_number: string;
  title: string;
  status: string;
  priority: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  estimated_value_cents: number | null;
  final_value_cents: number | null;
  created_at: string;
};

type Metrics = {
  open_jobs: number;
  scheduled_jobs: number;
  in_progress_jobs: number;
  completed_jobs_30d: number;
  open_estimated_value_cents: number;
  completed_final_value_cents_30d: number;
};

type CreateForm = {
  title: string;
  description: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  priority: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  estimated_value: string;
  notes: string;
  tags: string;
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
  title: "",
  description: "",
  customer_name: "",
  phone: "",
  email: "",
  address: "",
  postal_code: "",
  priority: "normal",
  scheduled_date: "",
  scheduled_start_time: "",
  scheduled_end_time: "",
  estimated_value: "",
  notes: "",
  tags: "",
};

function AuftraegePage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [rows, setRows] = useState<JobRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { id: deepLinkId } = Route.useSearch();
  const clearDeepLink = useDetailDeepLink("/auftraege", deepLinkId, (id) => {
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
    const { data, error: rpcError } = await supabase.rpc("get_job_metrics");
    if (rpcError) return;
    const record = asRecord(data);
    setMetrics({
      open_jobs: num(record["open_jobs"]),
      scheduled_jobs: num(record["scheduled_jobs"]),
      in_progress_jobs: num(record["in_progress_jobs"]),
      completed_jobs_30d: num(record["completed_jobs_30d"]),
      open_estimated_value_cents: num(record["open_estimated_value_cents"]),
      completed_final_value_cents_30d: num(record["completed_final_value_cents_30d"]),
    });
  }, []);

  const loadJobs = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    let query = supabase
      .from("jobs")
      .select(LIST_COLUMNS)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);

    const term = search.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%,]/g, " ");
      query = query.or(
        `job_number.ilike.%${escaped}%,title.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
      );
    }

    const { data, error: listError } = await query;

    if (listError) {
      setError("Die Aufträge konnten nicht geladen werden.");
      setRows([]);
    } else {
      setError(null);
      setRows((data ?? []) as JobRow[]);
    }
    setLoading(false);
  }, [companyId, priorityFilter, search, statusFilter]);

  useEffect(() => {
    if (!companyId) return;
    void loadMetrics();
  }, [companyId, loadMetrics]);

  useEffect(() => {
    if (!companyId) return;
    const timer = setTimeout(() => void loadJobs(), 300);
    return () => clearTimeout(timer);
  }, [companyId, loadJobs]);

  async function refresh() {
    await Promise.all([loadJobs(), loadMetrics()]);
  }

  async function handleCreate() {
    if (!companyId) return;
    setCreateError(null);

    const title = createForm.title.trim();
    if (!title) {
      setCreateError("Bitte einen Titel für den Auftrag angeben.");
      return;
    }

    const customerNameValue = createForm.customer_name.trim();
    if (customerMode === "existing" && !selectedCustomerId) {
      setCreateError("Bitte einen Bestandskunden auswählen oder manuell erfassen.");
      return;
    }
    if (!customerNameValue) {
      setCreateError("Bitte einen Kundennamen angeben.");
      return;
    }

    const estimated = euroInputToCents(createForm.estimated_value);
    if ("error" in estimated) {
      setCreateError(estimated.error);
      return;
    }

    const start = fromTimeInput(createForm.scheduled_start_time);
    const end = fromTimeInput(createForm.scheduled_end_time);
    if (start && end && end <= start) {
      setCreateError("Das Ende muss nach dem Beginn liegen.");
      return;
    }

    const tags = parseTags(createForm.tags);
    if (tags.length > 20) {
      setCreateError("Bitte höchstens 20 Tags angeben.");
      return;
    }

    setCreating(true);

    // Bei "Neuer Kunde" zuerst echten Kundenstammsatz anlegen (kein Auftrag ohne Kunde).
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

    // job_number wird serverseitig fortlaufend erzeugt.
    const { data, error: insertError } = await supabase
      .from("jobs")
      .insert({
        company_id: companyId,
        job_number: "",
        title,
        description: createForm.description.trim() || null,
        customer_id: customerId,
        customer_name: customerNameValue,
        phone: createForm.phone.trim() || null,
        email: createForm.email.trim() || null,
        address: createForm.address.trim() || null,
        postal_code: createForm.postal_code.trim() || null,
        priority: createForm.priority,
        scheduled_date: fromDateInput(createForm.scheduled_date),
        scheduled_start_time: start,
        scheduled_end_time: end,
        estimated_value_cents: estimated.cents,
        notes: createForm.notes.trim() || null,
        tags,
      })
      .select("id")
      .maybeSingle();

    if (insertError || !data) {
      setCreating(false);
      setCreateError("Der Auftrag konnte nicht erstellt werden.");
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
    { label: "Offene Aufträge", value: metrics ? String(metrics.open_jobs) : undefined },
    { label: "Terminiert", value: metrics ? String(metrics.scheduled_jobs) : undefined },
    { label: "In Arbeit", value: metrics ? String(metrics.in_progress_jobs) : undefined },
    {
      label: "Abgeschlossen (30 T.)",
      value: metrics ? String(metrics.completed_jobs_30d) : undefined,
    },
    {
      label: "Offener Schätzwert",
      value: metrics ? formatCents(metrics.open_estimated_value_cents) : undefined,
    },
    {
      label: "Abgerechnet (30 T.)",
      value: metrics ? formatCents(metrics.completed_final_value_cents_30d) : undefined,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Aufträge"
        description="Aufträge planen, Prioritäten setzen und Auftragswerte bis zum Abschluss verfolgen."
        action={
          <Button onClick={() => setCreateOpen(true)} disabled={!companyId}>
            <Plus className="size-4" />
            Auftrag erstellen
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
              <CardTitle className="text-base">Auftragsliste</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nummer, Titel, Kunde, E-Mail oder Telefon"
                  className="sm:w-72"
                  aria-label="Aufträge durchsuchen"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="sm:w-44" aria-label="Status filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    {jobStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {jobStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="sm:w-44" aria-label="Priorität filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Prioritäten</SelectItem>
                    {jobPriorityOptions.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priorityLabel(priority)}
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
                  Aufträge werden geladen …
                </div>
              ) : error ? (
                <div className="space-y-3 py-12 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => void loadJobs()}>
                    Erneut versuchen
                  </Button>
                </div>
              ) : rows.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {search.trim() || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Keine Aufträge passen zu diesem Filter."
                    : "Noch keine Aufträge vorhanden. Erstellen Sie Ihren ersten Auftrag."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nummer</TableHead>
                        <TableHead>Auftrag</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priorität</TableHead>
                        <TableHead>Termin</TableHead>
                        <TableHead className="text-right">Schätzwert</TableHead>
                        <TableHead className="text-right">Endwert</TableHead>
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
                          <TableCell className="font-medium">{row.job_number}</TableCell>
                          <TableCell>
                            <span className="block">{row.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {customerName(row.customer_name)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={jobStatusVariant(row.status)}>
                              {jobStatusLabel(row.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{priorityLabel(row.priority)}</TableCell>
                          <TableCell>
                            <span className="block">{formatDate(row.scheduled_date)}</span>
                            <span className="text-xs text-muted-foreground">
                              {row.scheduled_start_time
                                ? `${formatTime(row.scheduled_start_time)}${
                                    row.scheduled_end_time
                                      ? ` – ${formatTime(row.scheduled_end_time)}`
                                      : ""
                                  }`
                                : ""}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCents(row.estimated_value_cents)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCents(row.final_value_cents)}
                          </TableCell>
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
            <DialogTitle>Neuer Auftrag</DialogTitle>
            <DialogDescription>
              Auftragsnummer und Zeitstempel werden automatisch vom System gesetzt. Positionen
              pflegen Sie anschließend im Backend.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="job-title">Titel</Label>
              <Input
                id="job-title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="job-description">Beschreibung</Label>
              <Textarea
                id="job-description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              />
            </div>
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
                    id="job-customer-search"
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
              <Label htmlFor="job-name">Kundenname</Label>
              <Input
                id="job-name"
                value={createForm.customer_name}
                readOnly={customerMode === "existing"}
                onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })}
              />
              {customerMode === "manual" && createForm.customer_name.trim().length === 0 ? (
                <p className="text-xs text-destructive">Kundenname ist erforderlich.</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="job-phone">Telefon</Label>
              <Input
                id="job-phone"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-email">E-Mail</Label>
              <Input
                id="job-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="job-address">Adresse</Label>
              <Input
                id="job-address"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-postal">PLZ</Label>
              <Input
                id="job-postal"
                value={createForm.postal_code}
                onChange={(e) => setCreateForm({ ...createForm, postal_code: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-priority">Priorität</Label>
              <Select
                value={createForm.priority}
                onValueChange={(value) => setCreateForm({ ...createForm, priority: value })}
              >
                <SelectTrigger id="job-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobPriorityOptions.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priorityLabel(priority)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="job-date">Termin (optional)</Label>
              <Input
                id="job-date"
                type="date"
                value={createForm.scheduled_date}
                onChange={(e) => setCreateForm({ ...createForm, scheduled_date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-start">Beginn</Label>
              <Input
                id="job-start"
                type="time"
                value={createForm.scheduled_start_time}
                onChange={(e) =>
                  setCreateForm({ ...createForm, scheduled_start_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-end">Ende</Label>
              <Input
                id="job-end"
                type="time"
                value={createForm.scheduled_end_time}
                onChange={(e) =>
                  setCreateForm({ ...createForm, scheduled_end_time: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-value">Schätzwert (EUR)</Label>
              <Input
                id="job-value"
                inputMode="decimal"
                placeholder="z. B. 1.250,00"
                value={createForm.estimated_value}
                onChange={(e) => setCreateForm({ ...createForm, estimated_value: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-tags">Tags (kommagetrennt)</Label>
              <Input
                id="job-tags"
                value={createForm.tags}
                onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="job-notes">Notizen</Label>
              <Textarea
                id="job-notes"
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
              {creating ? "Wird erstellt …" : "Auftrag erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <JobDetailSheet
        jobId={selectedId}
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
