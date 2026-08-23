import { Loader2, Play, Plus, Square, Trash2 } from "lucide-react";
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
  centsToEuroInput,
  customerName,
  decimalInputToNumber,
  euroInputToCents,
  formatCents,
  formatDate,
  formatDateTime,
  formatMinutes,
  formatTime,
  fromDateInput,
  fromTimeInput,
  jobDirectStatusOptions,
  jobItemTypeLabel,
  jobPriorityOptions,
  jobStatusLabel,
  jobStatusVariant,
  num,
  optionalNum,
  parseTags,
  priorityLabel,
  str,
  stringArray,
  toDateInput,
  toTimeInput,
} from "@/lib/crm";

const JOB_COLUMNS =
  "id, company_id, job_number, status, priority, title, description, customer_name, phone, email, address, postal_code, scheduled_date, scheduled_start_time, scheduled_end_time, estimated_value_cents, final_value_cents, notes, tags, started_at, completed_at, created_at, updated_at, quote_id, appointment_id, lead_id, customer_id";

const ITEM_COLUMNS =
  "id, job_id, position, item_type, description, quantity, unit, unit_price_cents, tax_rate, total_cents, unit_cost_cents, cost_total_cents, supplier_name";

type JobDetail = {
  id: string;
  company_id: string;
  job_number: string;
  status: string;
  priority: string;
  title: string;
  description: string | null;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postal_code: string | null;
  scheduled_date: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  estimated_value_cents: number | null;
  final_value_cents: number | null;
  notes: string | null;
  tags: string[] | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type JobItem = {
  id: string;
  position: number;
  item_type: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  tax_rate: number;
  total_cents: number | null;
  unit_cost_cents: number;
  cost_total_cents: number;
  supplier_name: string | null;
};

type FormState = {
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
  final_value: string;
  notes: string;
  tags: string;
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
  unit: "Stk.",
  unit_price: "",
  tax_rate: "19",
};

type RunningTimer = {
  id: string;
  job_id: string;
  job_number: string;
  job_title: string;
  started_at: string | null;
} | null;

const MAX_TAGS = 20;

function toForm(job: JobDetail): FormState {
  return {
    title: job.title,
    description: job.description ?? "",
    customer_name: job.customer_name ?? "",
    phone: job.phone ?? "",
    email: job.email ?? "",
    address: job.address ?? "",
    postal_code: job.postal_code ?? "",
    priority: job.priority,
    scheduled_date: toDateInput(job.scheduled_date),
    scheduled_start_time: toTimeInput(job.scheduled_start_time),
    scheduled_end_time: toTimeInput(job.scheduled_end_time),
    estimated_value: centsToEuroInput(job.estimated_value_cents),
    final_value: centsToEuroInput(job.final_value_cents),
    notes: job.notes ?? "",
    tags: (job.tags ?? []).join(", "),
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

function completeReason(record: Record<string, unknown>) {
  const reason = str(record["reason"]);
  switch (reason) {
    case "required_checklist_incomplete":
      return `Der Auftrag kann noch nicht abgeschlossen werden: ${num(
        record["missing_required_items"],
      )} verpflichtende Checklistenpunkte sind offen.`;
    case "running_timer":
      return "Der Auftrag kann noch nicht abgeschlossen werden: es läuft noch eine Zeiterfassung. Bitte zuerst die Zeit stoppen.";
    default:
      return "Der Auftrag konnte nicht abgeschlossen werden.";
  }
}

export function JobDetailSheet({
  jobId,
  companyId,
  open,
  onOpenChange,
  onChanged,
}: {
  jobId: string | null;
  companyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
}) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [items, setItems] = useState<JobItem[]>([]);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [itemBusy, setItemBusy] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeNote, setCompleteNote] = useState("");
  const [completeValue, setCompleteValue] = useState("");
  const [timer, setTimer] = useState<RunningTimer>(null);
  const [timeMinutes, setTimeMinutes] = useState<number | null>(null);
  const [timeEntries, setTimeEntries] = useState<number | null>(null);
  const [timerBusy, setTimerBusy] = useState(false);
  const [timerError, setTimerError] = useState<string | null>(null);

  const loadTimer = useCallback(async (currentJobId: string) => {
    const [runningResult, summaryResult] = await Promise.all([
      supabase.rpc("get_running_job_timer"),
      supabase.rpc("get_job_time_summary", { p_job_id: currentJobId }),
    ]);

    if (runningResult.error) {
      setTimer(null);
    } else {
      const record = asRecord(runningResult.data);
      const id = str(record["id"]);
      setTimer(
        id
          ? {
              id,
              job_id: str(record["job_id"]) ?? "",
              job_number: str(record["job_number"]) ?? "—",
              job_title: str(record["job_title"]) ?? "—",
              started_at: str(record["started_at"]),
            }
          : null,
      );
    }

    if (summaryResult.error) {
      setTimeMinutes(null);
      setTimeEntries(null);
    } else {
      const summary = asRecord(summaryResult.data);
      setTimeMinutes(num(summary["total_minutes"]));
      setTimeEntries(num(summary["entries"]));
    }
  }, []);

  const load = useCallback(async () => {
    if (!jobId || !companyId) return null;

    const [jobResult, itemsResult] = await Promise.all([
      supabase
        .from("jobs")
        .select(JOB_COLUMNS)
        .eq("id", jobId)
        .eq("company_id", companyId)
        .maybeSingle(),
      supabase
        .from("job_items")
        .select(ITEM_COLUMNS)
        .eq("job_id", jobId)
        .order("position", { ascending: true }),
    ]);

    if (jobResult.error) {
      setError("Der Auftrag konnte nicht geladen werden.");
      return null;
    }
    if (!jobResult.data) {
      setError("Dieser Auftrag wurde nicht gefunden.");
      return null;
    }

    const detail = jobResult.data as JobDetail;
    setJob(detail);
    setForm(toForm(detail));
    setItems(itemsResult.error ? [] : ((itemsResult.data ?? []) as JobItem[]));
    setItemError(itemsResult.error ? "Die Positionen konnten nicht geladen werden." : null);
    await loadTimer(detail.id);
    return detail;
  }, [jobId, companyId, loadTimer]);

  useEffect(() => {
    if (!open || !jobId || !companyId) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setSaveError(null);
      setSaveSuccess(false);
      setStatusError(null);
      setTimerError(null);
      setCompleteOpen(false);
      setCompleteNote("");
      setCompleteValue("");
      setJob(null);
      setForm(null);
      setItems([]);
      setDraft(emptyDraft);
      await load();
      if (!cancelled) setLoading(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [open, jobId, companyId, load]);

  function update<K extends keyof FormState>(key: K, next: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: next } : prev));
    setSaveSuccess(false);
  }

  const locked = job ? ["completed", "cancelled"].includes(job.status) : false;

  async function handleAddItem() {
    if (!job) return;
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
    // company_id and totals are re-derived server-side.
    const { error: insertError } = await supabase.from("job_items").insert({
      job_id: job.id,
      company_id: job.company_id,
      description,
      quantity: quantity.value,
      unit: draft.unit.trim() || "Stk.",
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

  async function handleDeleteItem(itemId: string) {
    setItemError(null);
    setItemBusy(true);
    const { error: deleteError } = await supabase.from("job_items").delete().eq("id", itemId);
    if (deleteError) {
      setItemBusy(false);
      setItemError("Die Position konnte nicht gelöscht werden.");
      return;
    }
    await load();
    setItemBusy(false);
    onChanged?.();
  }

  async function handleSave() {
    if (!job || !form || !companyId) return;
    setSaveError(null);
    setSaveSuccess(false);

    const title = form.title.trim();
    if (!title) {
      setSaveError("Bitte einen Titel eingeben.");
      return;
    }

    const startTime = fromTimeInput(form.scheduled_start_time);
    const endTime = fromTimeInput(form.scheduled_end_time);
    if (startTime && endTime && endTime <= startTime) {
      setSaveError("Das Ende muss nach dem Beginn liegen.");
      return;
    }

    const estimated = euroInputToCents(form.estimated_value);
    if ("error" in estimated) {
      setSaveError(estimated.error);
      return;
    }
    const final = euroInputToCents(form.final_value);
    if ("error" in final) {
      setSaveError(final.error);
      return;
    }

    const tags = parseTags(form.tags);
    if (tags.length > MAX_TAGS) {
      setSaveError(`Bitte höchstens ${MAX_TAGS} Schlagwörter angeben.`);
      return;
    }

    setSaving(true);

    // Auftragsnummer, Verknüpfungen und Zeitstempel bleiben serverseitig verwaltet.
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        title,
        description: form.description.trim() || null,
        customer_name: form.customer_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        postal_code: form.postal_code.trim() || null,
        priority: form.priority,
        scheduled_date: fromDateInput(form.scheduled_date),
        scheduled_start_time: startTime,
        scheduled_end_time: endTime,
        estimated_value_cents: estimated.cents,
        final_value_cents: final.cents,
        notes: form.notes.trim() || null,
        tags,
      })
      .eq("id", job.id)
      .eq("company_id", companyId);

    if (updateError) {
      setSaving(false);
      setSaveError(updateError.message || "Die Änderungen konnten nicht gespeichert werden.");
      return;
    }

    await load();
    setSaving(false);
    setSaveSuccess(true);
    onChanged?.();
  }

  async function applyStatus(next: string) {
    if (!job || !companyId || locked) return;
    setStatusError(null);

    if (next === "completed") {
      setCompleteOpen(true);
      return;
    }

    setStatusBusy(true);
    const { error: statusUpdateError } = await supabase
      .from("jobs")
      .update({ status: next })
      .eq("id", job.id)
      .eq("company_id", companyId);

    if (statusUpdateError) {
      setStatusBusy(false);
      setStatusError(statusUpdateError.message || "Der Status konnte nicht geändert werden.");
      return;
    }

    await load();
    setStatusBusy(false);
    onChanged?.();
  }

  async function handleComplete() {
    if (!job) return;
    setStatusError(null);

    const final = euroInputToCents(completeValue);
    if ("error" in final) {
      setStatusError(final.error);
      return;
    }

    setStatusBusy(true);
    // exactOptionalPropertyTypes: optionale RPC-Argumente werden weggelassen statt undefined gesetzt.
    const finalValueCents = final.cents ?? undefined;
    const note = completeNote.trim() || undefined;
    const { data, error: rpcError } = await supabase.rpc("complete_job", {
      p_job_id: job.id,
      ...(finalValueCents !== undefined ? { p_final_value_cents: finalValueCents } : {}),
      ...(note !== undefined ? { p_note: note } : {}),
    });

    if (rpcError) {
      setStatusBusy(false);
      setStatusError(rpcError.message || "Der Auftrag konnte nicht abgeschlossen werden.");
      return;
    }

    const record = asRecord(data);
    if (!bool(record["ok"])) {
      setStatusBusy(false);
      setStatusError(completeReason(record));
      await load();
      return;
    }

    setCompleteOpen(false);
    setCompleteNote("");
    setCompleteValue("");
    await load();
    setStatusBusy(false);
    onChanged?.();
  }

  async function handleStartTimer() {
    if (!job) return;
    setTimerError(null);
    setTimerBusy(true);
    const { error: rpcError } = await supabase.rpc("start_job_timer", { p_job_id: job.id });
    if (rpcError) {
      setTimerBusy(false);
      setTimerError(rpcError.message || "Die Zeiterfassung konnte nicht gestartet werden.");
      return;
    }
    await loadTimer(job.id);
    setTimerBusy(false);
    onChanged?.();
  }

  async function handleStopTimer() {
    if (!job) return;
    setTimerError(null);
    setTimerBusy(true);
    const { data, error: rpcError } = await supabase.rpc("stop_job_timer", { p_job_id: job.id });
    if (rpcError) {
      setTimerBusy(false);
      setTimerError(rpcError.message || "Die Zeiterfassung konnte nicht beendet werden.");
      return;
    }
    if (!bool(asRecord(data)["ok"])) {
      setTimerError("Für diesen Auftrag läuft derzeit keine Zeiterfassung.");
    }
    await loadTimer(job.id);
    setTimerBusy(false);
    onChanged?.();
  }

  const timerOnThisJob = Boolean(job && timer && timer.job_id === job.id);
  const timerOnOtherJob = Boolean(job && timer && timer.job_id !== job.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{job ? `Auftrag ${job.job_number}` : "Auftragsdetails"}</SheetTitle>
          <SheetDescription>
            Auftragsdaten, Status, Zeiterfassung und Positionen. Nummerierung und Zeitstempel
            verwaltet das System.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-10">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Auftrag wird geladen …
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-destructive">{error}</p>
          ) : job && form ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Titel">{job.title}</Field>
                <Field label="Status">
                  <Badge variant={jobStatusVariant(job.status)}>{jobStatusLabel(job.status)}</Badge>
                </Field>
                <Field label="Kunde">{customerName(job.customer_name)}</Field>
                <Field label="Priorität">{priorityLabel(job.priority)}</Field>
                <Field label="Geplant am">{formatDate(job.scheduled_date)}</Field>
                <Field label="Zeitfenster">
                  {job.scheduled_start_time
                    ? `${formatTime(job.scheduled_start_time)}${
                        job.scheduled_end_time ? ` – ${formatTime(job.scheduled_end_time)}` : ""
                      }`
                    : "—"}
                </Field>
                <Field label="Geschätzter Wert">{formatCents(job.estimated_value_cents)}</Field>
                <Field label="Endbetrag">{formatCents(job.final_value_cents)}</Field>
                <Field label="Begonnen">{formatDateTime(job.started_at)}</Field>
                <Field label="Abgeschlossen">{formatDateTime(job.completed_at)}</Field>
              </div>

              {stringArray(job.tags).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stringArray(job.tags).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Status ändern</h3>
                {locked ? (
                  <p className="text-xs text-muted-foreground">
                    Abgeschlossene oder stornierte Aufträge können nicht wieder geöffnet werden.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {jobDirectStatusOptions.map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={status === job.status ? "default" : "outline"}
                          disabled={statusBusy || status === job.status}
                          onClick={() => void applyStatus(status)}
                        >
                          {jobStatusLabel(status)}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={statusBusy}
                        onClick={() => void applyStatus("completed")}
                      >
                        Abschließen
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Der Abschluss läuft über die Prüfung im Backend (Checklisten und laufende
                      Zeiterfassung). „Storniert“ und „Abgeschlossen“ sind endgültig.
                    </p>
                  </>
                )}

                {completeOpen && !locked ? (
                  <div className="space-y-3 rounded-md border border-dashed p-3">
                    <p className="text-sm font-medium">Auftrag abschließen</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="complete-value">Endbetrag (EUR, optional)</Label>
                        <Input
                          id="complete-value"
                          inputMode="decimal"
                          placeholder="z. B. 1.249,00"
                          value={completeValue}
                          onChange={(e) => setCompleteValue(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="complete-note">Abschlussnotiz (optional)</Label>
                        <Input
                          id="complete-note"
                          value={completeNote}
                          onChange={(e) => setCompleteNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" disabled={statusBusy} onClick={() => void handleComplete()}>
                        {statusBusy ? "Wird abgeschlossen …" : "Abschluss bestätigen"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={statusBusy}
                        onClick={() => setCompleteOpen(false)}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : null}

                {statusError ? <p className="text-xs text-destructive">{statusError}</p> : null}
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Zeiterfassung</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Erfasste Zeit">{formatMinutes(timeMinutes)}</Field>
                  <Field label="Einträge">{timeEntries === null ? "—" : String(timeEntries)}</Field>
                </div>

                {timerOnThisJob ? (
                  <p className="text-xs text-muted-foreground">
                    Laufend seit {formatDateTime(timer?.started_at)}.
                  </p>
                ) : null}

                {timerOnOtherJob ? (
                  <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    Für Sie läuft bereits eine Zeiterfassung im Auftrag {timer?.job_number} –{" "}
                    {timer?.job_title}. Bitte beenden Sie diese zuerst dort.
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={timerBusy || locked || timerOnThisJob || timerOnOtherJob}
                    onClick={() => void handleStartTimer()}
                  >
                    <Play className="size-4" />
                    Zeit starten
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={timerBusy || !timerOnThisJob}
                    onClick={() => void handleStopTimer()}
                  >
                    <Square className="size-4" />
                    Zeit stoppen
                  </Button>
                </div>

                {timerError ? <p className="text-xs text-destructive">{timerError}</p> : null}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Auftragsdaten</h3>
                {locked ? (
                  <p className="text-xs text-muted-foreground">
                    Abgeschlossene oder stornierte Aufträge können nicht mehr bearbeitet werden.
                  </p>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="job-title">Titel</Label>
                    <Input
                      id="job-title"
                      value={form.title}
                      disabled={locked}
                      onChange={(e) => update("title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="job-description">Beschreibung</Label>
                    <Textarea
                      id="job-description"
                      rows={3}
                      value={form.description}
                      disabled={locked}
                      onChange={(e) => update("description", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="job-customer">Kundenname</Label>
                    <Input
                      id="job-customer"
                      value={form.customer_name}
                      disabled={locked}
                      onChange={(e) => update("customer_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="job-priority">Priorität</Label>
                    <Select
                      value={form.priority}
                      disabled={locked}
                      onValueChange={(next) => update("priority", next)}
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
                  <div className="space-y-1">
                    <Label htmlFor="job-phone">Telefon</Label>
                    <Input
                      id="job-phone"
                      value={form.phone}
                      disabled={locked}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="job-email">E-Mail</Label>
                    <Input
                      id="job-email"
                      type="email"
                      value={form.email}
                      disabled={locked}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="job-address">Adresse</Label>
                    <Input
                      id="job-address"
                      value={form.address}
                      disabled={locked}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="job-postal">PLZ</Label>
                    <Input
                      id="job-postal"
                      value={form.postal_code}
                      disabled={locked}
                      onChange={(e) => update("postal_code", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="job-date">Geplantes Datum</Label>
                    <Input
                      id="job-date"
                      type="date"
                      value={form.scheduled_date}
                      disabled={locked}
                      onChange={(e) => update("scheduled_date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="job-start">Beginn</Label>
                    <Input
                      id="job-start"
                      type="time"
                      value={form.scheduled_start_time}
                      disabled={locked}
                      onChange={(e) => update("scheduled_start_time", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="job-end">Ende</Label>
                    <Input
                      id="job-end"
                      type="time"
                      value={form.scheduled_end_time}
                      disabled={locked}
                      onChange={(e) => update("scheduled_end_time", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="job-estimated">Geschätzter Wert (EUR)</Label>
                    <Input
                      id="job-estimated"
                      inputMode="decimal"
                      placeholder="z. B. 890,00"
                      value={form.estimated_value}
                      disabled={locked}
                      onChange={(e) => update("estimated_value", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="job-final">Endbetrag (EUR)</Label>
                    <Input
                      id="job-final"
                      inputMode="decimal"
                      value={form.final_value}
                      disabled={locked}
                      onChange={(e) => update("final_value", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="job-tags">Schlagwörter (Komma-getrennt)</Label>
                    <Input
                      id="job-tags"
                      value={form.tags}
                      disabled={locked}
                      onChange={(e) => update("tags", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="job-notes">Notizen</Label>
                    <Textarea
                      id="job-notes"
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
                    Noch keine Positionen erfasst. Ohne Positionen wird bei der Rechnungsstellung
                    der Endbetrag als einzelne Position übernommen.
                  </p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {jobItemTypeLabel(item.item_type)} · {formatQuantity(item.quantity)}{" "}
                            {item.unit} × {formatCents(item.unit_price_cents)} · MwSt.{" "}
                            {formatQuantity(item.tax_rate)} %
                            {item.cost_total_cents
                              ? ` · Kosten ${formatCents(item.cost_total_cents)}`
                              : ""}
                            {item.supplier_name ? ` · ${item.supplier_name}` : ""}
                          </p>
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {formatCents(
                            optionalNum(item.total_cents) ??
                              Math.round(item.quantity * item.unit_price_cents),
                          )}
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

                {items.length > 0 ? (
                  <div className="flex justify-end text-sm font-medium">
                    Gesamt:&nbsp;
                    {formatCents(
                      items.reduce(
                        (sum, item) =>
                          sum +
                          (optionalNum(item.total_cents) ??
                            Math.round(item.quantity * item.unit_price_cents)),
                        0,
                      ),
                    )}
                  </div>
                ) : null}

                {locked ? (
                  <p className="text-xs text-muted-foreground">
                    Positionen können bei abgeschlossenen oder stornierten Aufträgen nicht mehr
                    geändert werden.
                  </p>
                ) : (
                  <div className="space-y-3 rounded-md border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Neue Position hinzufügen
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="job-item-description">Beschreibung</Label>
                        <Input
                          id="job-item-description"
                          value={draft.description}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="job-item-quantity">Menge</Label>
                        <Input
                          id="job-item-quantity"
                          inputMode="decimal"
                          value={draft.quantity}
                          onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="job-item-unit">Einheit</Label>
                        <Input
                          id="job-item-unit"
                          value={draft.unit}
                          onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="job-item-price">Einzelpreis (EUR)</Label>
                        <Input
                          id="job-item-price"
                          inputMode="decimal"
                          placeholder="z. B. 149,90"
                          value={draft.unit_price}
                          onChange={(e) => setDraft({ ...draft, unit_price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="job-item-tax">MwSt.-Satz (%)</Label>
                        <Input
                          id="job-item-tax"
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
