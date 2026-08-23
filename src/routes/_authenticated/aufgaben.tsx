import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { TaskDetailSheet, memberLabel, type TeamMember } from "@/components/task-detail-sheet";
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
import {
  asArray,
  asRecord,
  customerName,
  formatDate,
  formatDateTime,
  fromDateTimeLocal,
  isTaskOverdue,
  jobStatusLabel,
  leadPriorityOptions,
  num,
  priorityLabel,
  priorityVariant,
  str,
  taskStatusLabel,
  taskStatusOptions,
  taskStatusVariant,
  taskTypeLabel,
  taskTypeOptions,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/aufgaben")({
  head: () => ({
    meta: [
      { title: "Aufgaben – HandwerkAI" },
      {
        name: "description",
        content:
          "Aufgaben Ihres Betriebs verwalten: offene und überfällige To-dos, Zuständigkeiten und die persönliche Arbeitsliste der nächsten 7 Tage.",
      },
      { property: "og:title", content: "Aufgaben – HandwerkAI" },
      {
        property: "og:description",
        content: "Aufgabenübersicht mit Kennzahlen, Filtern und persönlicher Arbeitsliste.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: detailSearchSchema,
  component: AufgabenPage,
});

const LIST_COLUMNS =
  "id, title, description, status, priority, task_type, due_at, completed_at, created_at, assigned_to, lead_id, conversation_id, appointment_id, quote_id, job_id, invoice_id, contract_id, voice_call_id";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  task_type: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  assigned_to: string | null;
  lead_id: string | null;
  conversation_id: string | null;
  appointment_id: string | null;
  quote_id: string | null;
  job_id: string | null;
  invoice_id: string | null;
  contract_id: string | null;
  voice_call_id: string | null;
};

type Metrics = {
  open_tasks: number;
  overdue_tasks: number;
  due_today: number;
  completed_7d: number;
};

type QueueTask = {
  id: string;
  title: string;
  priority: string;
  due_at: string | null;
};

type QueueJob = {
  id: string;
  job_number: string | null;
  title: string | null;
  status: string;
  customer_name: string | null;
  scheduled_date: string | null;
};

const LINK_LABELS: Array<[keyof TaskRow, string]> = [
  ["lead_id", "Lead"],
  ["conversation_id", "Konversation"],
  ["appointment_id", "Termin"],
  ["quote_id", "Angebot"],
  ["job_id", "Auftrag"],
  ["invoice_id", "Rechnung"],
  ["contract_id", "Vertrag"],
  ["voice_call_id", "Telefonat"],
];

function linkLabel(row: TaskRow) {
  const hit = LINK_LABELS.find(([key]) => typeof row[key] === "string" && row[key]);
  return hit ? hit[1] : null;
}

type CreateDraft = {
  title: string;
  description: string;
  priority: string;
  task_type: string;
  due_at: string;
  assigned_to: string;
};

const emptyDraft = (): CreateDraft => ({
  title: "",
  description: "",
  priority: "normal",
  task_type: "general",
  due_at: "",
  assigned_to: "",
});

function AufgabenPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const [rows, setRows] = useState<TaskRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>([]);
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { id: deepLinkId } = Route.useSearch();
  const clearDeepLink = useDetailDeepLink("/aufgaben", deepLinkId, (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<CreateDraft>(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const [{ data: profile, error: profileError }, { data: team }] = await Promise.all([
        supabase.from("profiles").select("company_id").eq("id", userId).maybeSingle(),
        supabase.rpc("get_team_members"),
      ]);

      if (cancelled) return;

      const teamRows = (team ?? []) as TeamMember[];
      setMembers(teamRows);

      const current = teamRows.find((member) => member.is_current_user);
      setDraft((prev) => ({ ...prev, assigned_to: current?.user_id ?? userId }));

      if (profileError || !profile?.company_id) {
        setCompanyError(
          "Ihrem Konto ist noch kein Betrieb zugeordnet. Bitte schließen Sie die Einrichtung ab.",
        );
        setLoading(false);
        setQueueLoading(false);
        return;
      }
      setCompanyId(profile.company_id);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMetrics = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("get_task_metrics");
    if (rpcError) return;
    const record = asRecord(data);
    setMetrics({
      open_tasks: num(record["open_tasks"]),
      overdue_tasks: num(record["overdue_tasks"]),
      due_today: num(record["due_today"]),
      completed_7d: num(record["completed_7d"]),
    });
  }, []);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    const { data, error: rpcError } = await supabase.rpc("get_my_work_queue", { p_days: 7 });

    if (rpcError) {
      setQueueTasks([]);
      setQueueJobs([]);
      setQueueLoading(false);
      return;
    }

    const record = asRecord(data);
    setQueueTasks(
      asArray(record["tasks"]).map((entry) => {
        const task = asRecord(entry);
        return {
          id: String(task["id"] ?? ""),
          title: str(task["title"]) ?? "Aufgabe",
          priority: str(task["priority"]) ?? "normal",
          due_at: str(task["due_at"]),
        };
      }),
    );
    setQueueJobs(
      asArray(record["jobs"]).map((entry) => {
        const job = asRecord(entry);
        return {
          id: String(job["id"] ?? ""),
          job_number: str(job["job_number"]),
          title: str(job["title"]),
          status: str(job["status"]) ?? "planned",
          customer_name: str(job["customer_name"]),
          scheduled_date: str(job["scheduled_date"]),
        };
      }),
    );
    setQueueLoading(false);
  }, []);

  const loadTasks = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);

    let query = supabase
      .from("tasks")
      .select(LIST_COLUMNS)
      .eq("company_id", companyId)
      .order("status", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);
    if (typeFilter !== "all") query = query.eq("task_type", typeFilter);

    const term = search.trim();
    if (term.length > 0) {
      const escaped = term.replace(/[%,]/g, " ");
      query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    }

    const { data, error: listError } = await query;

    if (listError) {
      setError("Die Aufgaben konnten nicht geladen werden.");
      setRows([]);
    } else {
      setError(null);
      setRows((data ?? []) as TaskRow[]);
    }
    setLoading(false);
  }, [companyId, search, statusFilter, priorityFilter, typeFilter]);

  useEffect(() => {
    if (!companyId) return;
    void loadMetrics();
    void loadQueue();
  }, [companyId, loadMetrics, loadQueue]);

  useEffect(() => {
    if (!companyId) return;
    const timer = setTimeout(() => void loadTasks(), 300);
    return () => clearTimeout(timer);
  }, [companyId, loadTasks]);

  async function refresh() {
    await Promise.all([loadTasks(), loadMetrics(), loadQueue()]);
  }

  async function handleCreate() {
    if (!companyId) return;

    const title = draft.title.trim();
    if (!title) {
      setCreateError("Bitte einen Titel eingeben.");
      return;
    }
    if (!draft.assigned_to) {
      setCreateError("Bitte eine zuständige Person auswählen.");
      return;
    }

    setCreateError(null);
    setCreating(true);

    const { error: insertError } = await supabase.from("tasks").insert({
      company_id: companyId,
      title,
      description: draft.description.trim() || null,
      status: "open",
      priority: draft.priority,
      task_type: draft.task_type,
      due_at: draft.due_at ? fromDateTimeLocal(draft.due_at) : null,
      assigned_to: draft.assigned_to,
    });

    setCreating(false);

    if (insertError) {
      setCreateError("Die Aufgabe konnte nicht erstellt werden.");
      return;
    }

    const current = members.find((member) => member.is_current_user);
    setDraft({ ...emptyDraft(), assigned_to: current?.user_id ?? draft.assigned_to });
    setCreateOpen(false);
    await refresh();
  }

  const cards = [
    { label: "Offene Aufgaben", value: metrics ? String(metrics.open_tasks) : undefined },
    { label: "Überfällig", value: metrics ? String(metrics.overdue_tasks) : undefined },
    { label: "Heute fällig", value: metrics ? String(metrics.due_today) : undefined },
    { label: "Erledigt (7 T.)", value: metrics ? String(metrics.completed_7d) : undefined },
  ];

  const filtersActive =
    search.trim().length > 0 ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    typeFilter !== "all";

  return (
    <AppShell>
      <PageHeader
        title="Aufgaben"
        description="To-dos Ihres Betriebs verwalten, Zuständigkeiten klären und Fristen im Blick behalten."
        action={
          <Button onClick={() => setCreateOpen(true)} disabled={!companyId}>
            <Plus className="size-4" />
            Aufgabe anlegen
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
            <CardHeader>
              <CardTitle className="text-base">Meine Arbeitsliste – nächste 7 Tage</CardTitle>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Arbeitsliste wird geladen …
                </div>
              ) : queueTasks.length === 0 && queueJobs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Für die nächsten 7 Tage stehen keine Aufgaben oder Einsätze für Sie an.
                </p>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                      Offene Aufgaben ({queueTasks.length})
                    </p>
                    {queueTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Keine fälligen Aufgaben.</p>
                    ) : (
                      <ul className="space-y-2">
                        {queueTasks.slice(0, 6).map((task) => (
                          <li key={task.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(task.id);
                                setDetailOpen(true);
                              }}
                              className="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left hover:bg-muted/60"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                  {task.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(task.due_at)}
                                </span>
                              </span>
                              <Badge variant={priorityVariant(task.priority)}>
                                {priorityLabel(task.priority)}
                              </Badge>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Meine Einsätze ({queueJobs.length})
                      </p>
                      <Link to="/auftraege" className="text-xs text-primary hover:underline">
                        Alle Aufträge
                      </Link>
                    </div>
                    {queueJobs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Keine Einsätze geplant.</p>
                    ) : (
                      <ul className="space-y-2">
                        {queueJobs.slice(0, 6).map((job) => (
                          <li
                            key={job.id}
                            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {str(job.job_number) ?? str(job.title) ?? "Auftrag"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {customerName(job.customer_name)} · {formatDate(job.scheduled_date)}
                              </span>
                            </span>
                            <Badge variant="outline">{jobStatusLabel(job.status)}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Aufgabenliste</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Titel oder Beschreibung"
                  className="sm:w-56"
                  aria-label="Aufgaben durchsuchen"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="sm:w-40" aria-label="Status filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    {taskStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {taskStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="sm:w-40" aria-label="Priorität filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Prioritäten</SelectItem>
                    {leadPriorityOptions.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priorityLabel(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="sm:w-40" aria-label="Aufgabentyp filtern">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    {taskTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {taskTypeLabel(type)}
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
                  Aufgaben werden geladen …
                </div>
              ) : error ? (
                <div className="space-y-3 py-12 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => void loadTasks()}>
                    Erneut versuchen
                  </Button>
                </div>
              ) : rows.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {filtersActive
                    ? "Keine Aufgaben passen zu diesem Filter."
                    : "Noch keine Aufgaben vorhanden. Legen Sie die erste Aufgabe an."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aufgabe</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priorität</TableHead>
                        <TableHead>Zuständig</TableHead>
                        <TableHead>Fällig</TableHead>
                        <TableHead>Erledigt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => {
                        const assignee = members.find((m) => m.user_id === row.assigned_to);
                        const context = linkLabel(row);
                        return (
                          <TableRow
                            key={row.id}
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedId(row.id);
                              setDetailOpen(true);
                            }}
                          >
                            <TableCell className="max-w-[22rem]">
                              <span className="block truncate font-medium">{row.title}</span>
                              {context ? (
                                <span className="text-xs text-muted-foreground">
                                  Verknüpft: {context}
                                </span>
                              ) : null}
                            </TableCell>
                            <TableCell>{taskTypeLabel(row.task_type)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant={taskStatusVariant(row.status)}>
                                  {taskStatusLabel(row.status)}
                                </Badge>
                                {isTaskOverdue(row.status, row.due_at) ? (
                                  <Badge variant="destructive">Überfällig</Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={priorityVariant(row.priority)}>
                                {priorityLabel(row.priority)}
                              </Badge>
                            </TableCell>
                            <TableCell>{assignee ? memberLabel(assignee) : "—"}</TableCell>
                            <TableCell>{formatDateTime(row.due_at)}</TableCell>
                            <TableCell>{formatDateTime(row.completed_at)}</TableCell>
                          </TableRow>
                        );
                      })}
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
            <DialogTitle>Aufgabe anlegen</DialogTitle>
            <DialogDescription>
              Neue Aufgabe für Ihren Betrieb. Sie startet im Status „Offen“.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="new-task-title">Titel *</Label>
              <Input
                id="new-task-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="z. B. Kunden zurückrufen"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-task-description">Beschreibung</Label>
              <Textarea
                id="new-task-description"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Typ</Label>
                <Select
                  value={draft.task_type}
                  onValueChange={(value) => setDraft({ ...draft, task_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {taskTypeLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Priorität</Label>
                <Select
                  value={draft.priority}
                  onValueChange={(value) => setDraft({ ...draft, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadPriorityOptions.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priorityLabel(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="new-task-due">Fällig am</Label>
                <Input
                  id="new-task-due"
                  type="datetime-local"
                  value={draft.due_at}
                  onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>Zuständig</Label>
                <Select
                  value={draft.assigned_to}
                  onValueChange={(value) => setDraft({ ...draft, assigned_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Teammitglied wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {memberLabel(member)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {createError ? <p className="text-sm text-destructive">{createError}</p> : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Abbrechen
            </Button>
            <Button onClick={() => void handleCreate()} disabled={creating}>
              {creating ? "Wird angelegt …" : "Aufgabe anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskDetailSheet
        taskId={selectedId}
        members={members}
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
