import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { InvoiceDetailSheet } from "@/components/invoice-detail-sheet";
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
import { detailSearchSchema, useDetailDeepLink } from "@/lib/deep-link";
import { supabase } from "@/integrations/supabase/client";
import {
  asRecord,
  customerName,
  formatCents,
  formatDate,
  invoiceStatusLabel,
  invoiceStatusOptions,
  invoiceStatusVariant,
  jobStatusLabel,
  num,
  str,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/rechnungen")({
  head: () => ({
    meta: [
      { title: "Rechnungen – ZunftEcho" },
      {
        name: "description",
        content:
          "Rechnungen Ihres SHK-Betriebs aus Aufträgen erstellen, Zahlungen erfassen und offene Beträge verfolgen.",
      },
      { property: "og:title", content: "Rechnungen – ZunftEcho" },
      {
        property: "og:description",
        content: "Rechnungsübersicht mit Kennzahlen, Zahlungen und offenen Beträgen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: detailSearchSchema,
  component: RechnungenPage,
});

const LIST_COLUMNS =
  "id, invoice_number, status, customer_name, phone, email, issue_date, due_date, total_cents, paid_cents, balance_cents, created_at";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  status: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  issue_date: string;
  due_date: string | null;
  total_cents: number;
  paid_cents: number;
  balance_cents: number;
  created_at: string;
};

type Metrics = {
  draft: number;
  sent: number;
  overdue: number;
  paid: number;
  open_value_cents: number;
  overdue_value_cents: number;
  paid_value_cents: number;
  paid_this_month_cents: number;
};

type JobOption = {
  id: string;
  job_number: string | null;
  title: string | null;
  status: string;
  customer_name: string | null;
};

function RechnungenPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { id: deepLinkId } = Route.useSearch();
  const clearDeepLink = useDetailDeepLink("/rechnungen", deepLinkId, (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
    const { data, error: rpcError } = await supabase.rpc("get_invoice_metrics");
    if (rpcError) return;
    const record = asRecord(data);
    setMetrics({
      draft: num(record["draft"]),
      sent: num(record["sent"]),
      overdue: num(record["overdue"]),
      paid: num(record["paid"]),
      open_value_cents: num(record["open_value_cents"]),
      overdue_value_cents: num(record["overdue_value_cents"]),
      paid_value_cents: num(record["paid_value_cents"]),
      paid_this_month_cents: num(record["paid_this_month_cents"]),
    });
  }, []);

  const loadInvoices = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    let query = supabase
      .from("invoices")
      .select(LIST_COLUMNS)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);

    const term = search.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%,]/g, " ");
      query = query.or(
        `invoice_number.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
      );
    }

    const { data, error: listError } = await query;

    if (listError) {
      setError("Die Rechnungen konnten nicht geladen werden.");
      setRows([]);
    } else {
      setError(null);
      setRows((data ?? []) as InvoiceRow[]);
    }
    setLoading(false);
  }, [companyId, search, statusFilter]);

  useEffect(() => {
    if (!companyId) return;
    void loadMetrics();
  }, [companyId, loadMetrics]);

  useEffect(() => {
    if (!companyId) return;
    const timer = setTimeout(() => void loadInvoices(), 300);
    return () => clearTimeout(timer);
  }, [companyId, loadInvoices]);

  const loadJobs = useCallback(async () => {
    if (!companyId) return;
    setJobsLoading(true);

    let query = supabase
      .from("jobs")
      .select("id, job_number, title, status, customer_name")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50);

    const term = jobSearch.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%,]/g, " ");
      query = query.or(
        `job_number.ilike.%${escaped}%,title.ilike.%${escaped}%,customer_name.ilike.%${escaped}%`,
      );
    }

    const { data, error: jobsError } = await query;
    setJobs(jobsError ? [] : ((data ?? []) as JobOption[]));
    setJobsLoading(false);
  }, [companyId, jobSearch]);

  useEffect(() => {
    if (!createOpen || !companyId) return;
    const timer = setTimeout(() => void loadJobs(), 300);
    return () => clearTimeout(timer);
  }, [createOpen, companyId, loadJobs]);

  async function refresh() {
    await Promise.all([loadInvoices(), loadMetrics()]);
  }

  async function handleCreate() {
    if (!selectedJobId) {
      setCreateError("Bitte einen Auftrag auswählen.");
      return;
    }
    setCreateError(null);
    setCreating(true);

    // Rechnungsnummer, Positionen und Summen erzeugt das Backend.
    const { data, error: rpcError } = await supabase.rpc("create_invoice_from_job", {
      p_job_id: selectedJobId,
    });

    const invoiceId = str(data);
    if (rpcError || !invoiceId) {
      setCreating(false);
      setCreateError("Die Rechnung konnte nicht erstellt werden.");
      return;
    }

    setCreating(false);
    setCreateOpen(false);
    setSelectedJobId(null);
    setJobSearch("");
    await refresh();
    setSelectedId(invoiceId);
    setDetailOpen(true);
  }

  const cards = [
    { label: "Entwürfe", value: metrics ? String(metrics.draft) : undefined },
    { label: "Gesendet", value: metrics ? String(metrics.sent) : undefined },
    { label: "Überfällig", value: metrics ? String(metrics.overdue) : undefined },
    { label: "Bezahlt", value: metrics ? String(metrics.paid) : undefined },
    {
      label: "Offener Betrag",
      value: metrics ? formatCents(metrics.open_value_cents) : undefined,
    },
    {
      label: "Überfälliger Betrag",
      value: metrics ? formatCents(metrics.overdue_value_cents) : undefined,
    },
    {
      label: "Bezahlt gesamt",
      value: metrics ? formatCents(metrics.paid_value_cents) : undefined,
    },
    {
      label: "Bezahlt diesen Monat",
      value: metrics ? formatCents(metrics.paid_this_month_cents) : undefined,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Rechnungen"
        description="Rechnungen aus Aufträgen erstellen, Zahlungen erfassen und offene Beträge verfolgen."
        action={
          <Button onClick={() => setCreateOpen(true)} disabled={!companyId}>
            <Plus className="size-4" />
            Rechnung aus Auftrag
          </Button>
        }
      />

      {companyError ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-destructive">
          {companyError}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              <CardTitle className="text-base">Rechnungsliste</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nummer, Kunde, E-Mail oder Telefon"
                  className="sm:w-72"
                  aria-label="Rechnungen durchsuchen"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="sm:w-48" aria-label="Status filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    {invoiceStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {invoiceStatusLabel(status)}
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
                  Rechnungen werden geladen …
                </div>
              ) : error ? (
                <div className="space-y-3 py-12 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => void loadInvoices()}>
                    Erneut versuchen
                  </Button>
                </div>
              ) : rows.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {search.trim() || statusFilter !== "all"
                    ? "Keine Rechnungen passen zu diesem Filter."
                    : "Noch keine Rechnungen vorhanden. Erstellen Sie eine Rechnung aus einem Auftrag."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nummer</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Fällig</TableHead>
                        <TableHead className="text-right">Gesamt</TableHead>
                        <TableHead className="text-right">Bezahlt</TableHead>
                        <TableHead className="text-right">Offen</TableHead>
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
                          <TableCell className="font-medium">{row.invoice_number}</TableCell>
                          <TableCell>
                            <span className="block">{customerName(row.customer_name)}</span>
                            <span className="text-xs text-muted-foreground">
                              {row.email ?? row.phone ?? ""}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={invoiceStatusVariant(row.status)}>
                              {invoiceStatusLabel(row.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(row.issue_date)}</TableCell>
                          <TableCell>{formatDate(row.due_date)}</TableCell>
                          <TableCell className="text-right">
                            {formatCents(row.total_cents)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCents(row.paid_cents)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCents(row.balance_cents)}
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
            <DialogTitle>Rechnung aus Auftrag erstellen</DialogTitle>
            <DialogDescription>
              Wählen Sie einen bestehenden Auftrag. Rechnungsnummer, Positionen und Summen übernimmt
              das System. Existiert bereits eine Rechnung zum Auftrag, wird diese geöffnet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="job-search">Auftrag suchen</Label>
              <Input
                id="job-search"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Auftragsnummer, Titel oder Kunde"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-md border">
              {jobsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aufträge werden geladen …
                </div>
              ) : jobs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Keine Aufträge gefunden.
                </p>
              ) : (
                <ul className="divide-y">
                  {jobs.map((job) => (
                    <li key={job.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedJobId(job.id)}
                        className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted/60 ${
                          selectedJobId === job.id ? "bg-accent text-accent-foreground" : ""
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {str(job.job_number) ?? str(job.title) ?? "Auftrag"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {customerName(job.customer_name)} · {jobStatusLabel(job.status)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Abbrechen
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating || !selectedJobId}>
              {creating ? "Wird erstellt …" : "Rechnung erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceDetailSheet
        invoiceId={selectedId}
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
