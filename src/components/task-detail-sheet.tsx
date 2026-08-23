import { Loader2, Trash2 } from "lucide-react";
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
  formatDateTime,
  fromDateTimeLocal,
  isTaskOverdue,
  leadPriorityOptions,
  priorityLabel,
  priorityVariant,
  str,
  taskStatusLabel,
  taskStatusOptions,
  taskStatusVariant,
  taskTypeLabel,
  toDateTimeLocal,
} from "@/lib/crm";

const TASK_COLUMNS =
  "id, company_id, title, description, status, priority, task_type, due_at, completed_at, created_at, updated_at, created_by, assigned_to, lead_id, conversation_id, appointment_id, quote_id, job_id, invoice_id, contract_id, voice_call_id";

export type TeamMember = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_current_user: boolean;
};

type TaskDetail = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  task_type: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
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

type FormState = {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_at: string;
  assigned_to: string;
};

const LINK_LABELS: Array<[keyof TaskDetail, string]> = [
  ["lead_id", "Lead"],
  ["conversation_id", "Konversation"],
  ["appointment_id", "Termin"],
  ["quote_id", "Angebot"],
  ["job_id", "Auftrag"],
  ["invoice_id", "Rechnung"],
  ["contract_id", "Wartungsvertrag"],
  ["voice_call_id", "Telefonat"],
];

export function memberLabel(member: TeamMember) {
  const name = str(member.full_name) ?? str(member.email) ?? "Teammitglied";
  return member.is_current_user ? `${name} (ich)` : name;
}

export function TaskDetailSheet({
  taskId,
  members,
  open,
  onOpenChange,
  onChanged,
}: {
  taskId: string | null;
  members: TeamMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError(null);

    const { data, error: loadError } = await supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("id", taskId)
      .maybeSingle();

    if (loadError || !data) {
      setError("Die Aufgabe konnte nicht geladen werden.");
      setTask(null);
      setForm(null);
    } else {
      const detail = data as TaskDetail;
      setTask(detail);
      setForm({
        title: detail.title,
        description: detail.description ?? "",
        status: detail.status,
        priority: detail.priority,
        due_at: toDateTimeLocal(detail.due_at),
        assigned_to: detail.assigned_to ?? "",
      });
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    if (!open || !taskId) return;
    setConfirmDelete(false);
    setSaveError(null);
    void load();
  }, [open, taskId, load]);

  async function handleSave() {
    if (!task || !form) return;

    const title = form.title.trim();
    if (!title) {
      setSaveError("Bitte einen Titel eingeben.");
      return;
    }
    if (!form.assigned_to) {
      setSaveError("Bitte eine zuständige Person auswählen.");
      return;
    }

    setSaveError(null);
    setSaving(true);

    // Nur die per Spaltenrechten erlaubten Felder. completed_at/updated_at setzt das Backend.
    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        title,
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        due_at: form.due_at ? fromDateTimeLocal(form.due_at) : null,
        assigned_to: form.assigned_to,
      })
      .eq("id", task.id);

    setSaving(false);

    if (updateError) {
      setSaveError("Die Änderungen konnten nicht gespeichert werden.");
      return;
    }

    await load();
    onChanged();
  }

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", task.id);
    setDeleting(false);

    if (deleteError) {
      setSaveError("Die Aufgabe konnte nicht gelöscht werden.");
      return;
    }
    onChanged();
    onOpenChange(false);
  }

  const links = task
    ? LINK_LABELS.filter(([key]) => typeof task[key] === "string" && task[key])
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{task ? task.title : "Aufgabe"}</SheetTitle>
          <SheetDescription>
            {task
              ? `${taskTypeLabel(task.task_type)} · erstellt am ${formatDateTime(task.created_at)}`
              : "Details der Aufgabe"}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Aufgabe wird geladen …
          </div>
        ) : error ? (
          <div className="space-y-3 px-4 py-16 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Erneut versuchen
            </Button>
          </div>
        ) : task && form ? (
          <div className="space-y-6 px-4 pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={taskStatusVariant(task.status)}>{taskStatusLabel(task.status)}</Badge>
              <Badge variant={priorityVariant(task.priority)}>{priorityLabel(task.priority)}</Badge>
              <Badge variant="outline">{taskTypeLabel(task.task_type)}</Badge>
              {isTaskOverdue(task.status, task.due_at) ? (
                <Badge variant="destructive">Überfällig</Badge>
              ) : null}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Fällig</dt>
                <dd>{formatDateTime(task.due_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Erledigt am</dt>
                <dd>{formatDateTime(task.completed_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Zuletzt geändert</dt>
                <dd>{formatDateTime(task.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Zuständig</dt>
                <dd>
                  {members.find((m) => m.user_id === task.assigned_to)
                    ? memberLabel(members.find((m) => m.user_id === task.assigned_to)!)
                    : "—"}
                </dd>
              </div>
            </dl>

            {links.length > 0 ? (
              <div className="rounded-md border p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Verknüpfung</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {links.map(([key, label]) => (
                    <li key={String(key)} className="flex justify-between gap-3">
                      <span>{label}</span>
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {String(task[key])}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Separator />

            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="task-title">Titel</Label>
                <Input
                  id="task-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="task-description">Beschreibung</Label>
                <Textarea
                  id="task-description"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) => setForm({ ...form, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {taskStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Priorität</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(value) => setForm({ ...form, priority: value })}
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
                  <Label htmlFor="task-due">Fällig am</Label>
                  <Input
                    id="task-due"
                    type="datetime-local"
                    value={form.due_at}
                    onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Zuständig</Label>
                  <Select
                    value={form.assigned_to}
                    onValueChange={(value) => setForm({ ...form, assigned_to: value })}
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

              {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void handleSave()} disabled={saving}>
                  {saving ? "Wird gespeichert …" : "Änderungen speichern"}
                </Button>
                <Button variant="outline" onClick={() => void load()} disabled={saving}>
                  Zurücksetzen
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Gefahrenzone</p>
              {confirmDelete ? (
                <div className="space-y-2 rounded-md border border-destructive/40 p-3">
                  <p className="text-sm">
                    Diese Aufgabe wird endgültig gelöscht. Möchten Sie fortfahren?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDelete()}
                      disabled={deleting}
                    >
                      {deleting ? "Wird gelöscht …" : "Endgültig löschen"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" />
                  Aufgabe löschen
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
