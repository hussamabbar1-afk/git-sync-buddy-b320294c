import { BookOpen, CheckCircle2, Edit3, Loader2, Plus, Trash2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type KnowledgeItem = Database["public"]["Tables"]["knowledge_items"]["Row"];
type TerminologyItem = Database["public"]["Tables"]["ai_terminology"]["Row"];
type KnowledgeGap = Database["public"]["Tables"]["knowledge_gaps"]["Row"];

type KnowledgeForm = {
  title: string;
  category: string;
  content: string;
  keywords: string;
  is_active: boolean;
};

type TerminologyForm = {
  term: string;
  canonical_label: string;
  category: string;
  definition: string;
  aliases: string;
  is_active: boolean;
};

const emptyKnowledge: KnowledgeForm = {
  title: "",
  category: "FAQ",
  content: "",
  keywords: "",
  is_active: true,
};

const emptyTerminology: TerminologyForm = {
  term: "",
  canonical_label: "",
  category: "Fachbegriff",
  definition: "",
  aliases: "",
  is_active: true,
};

const splitList = (value: string) =>
  Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

export function AiKnowledgeCard({
  companyId,
  canManage,
}: {
  companyId: string;
  canManage: boolean;
}) {
  const [tab, setTab] = useState("knowledge");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [terminology, setTerminology] = useState<TerminologyItem[]>([]);
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [knowledgeId, setKnowledgeId] = useState<string | null>(null);
  const [termId, setTermId] = useState<string | null>(null);
  const [knowledgeForm, setKnowledgeForm] = useState<KnowledgeForm>(emptyKnowledge);
  const [terminologyForm, setTerminologyForm] = useState<TerminologyForm>(emptyTerminology);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [knowledgeRes, terminologyRes, gapsRes] = await Promise.all([
      supabase
        .from("knowledge_items")
        .select("*")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("ai_terminology")
        .select("*")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("knowledge_gaps")
        .select("*")
        .eq("company_id", companyId)
        .order("status", { ascending: true })
        .order("occurrence_count", { ascending: false }),
    ]);

    const loadError = knowledgeRes.error ?? terminologyRes.error ?? gapsRes.error;
    if (loadError) {
      setError(`KI-Wissen konnte nicht geladen werden: ${loadError.message}`);
    } else {
      setKnowledge(knowledgeRes.data ?? []);
      setTerminology(terminologyRes.data ?? []);
      setGaps(gapsRes.data ?? []);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refreshGaps = () => void load();
    window.addEventListener("zunftecho:knowledge-gap-updated", refreshGaps);
    return () => window.removeEventListener("zunftecho:knowledge-gap-updated", refreshGaps);
  }, [load]);

  const resetKnowledge = () => {
    setKnowledgeId(null);
    setKnowledgeForm(emptyKnowledge);
  };

  const resetTerminology = () => {
    setTermId(null);
    setTerminologyForm(emptyTerminology);
  };

  const saveKnowledge = async () => {
    if (!canManage || saving) return;
    const title = knowledgeForm.title.trim();
    const content = knowledgeForm.content.trim();
    const category = knowledgeForm.category.trim() || "FAQ";
    if (!title || !content) {
      setError("Titel und Antwort/Inhalt des Wissenseintrags sind erforderlich.");
      return;
    }
    if (title.length > 160 || content.length > 12_000 || category.length > 80) {
      setError("Der Wissenseintrag überschreitet die zulässige Feldlänge.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload = {
      title,
      content,
      category,
      keywords: splitList(knowledgeForm.keywords),
      is_active: knowledgeForm.is_active,
    };
    const result = knowledgeId
      ? await supabase.from("knowledge_items").update(payload).eq("id", knowledgeId)
      : await supabase.from("knowledge_items").insert({ company_id: companyId, ...payload });
    setSaving(false);
    if (result.error) {
      setError(`Wissenseintrag konnte nicht gespeichert werden: ${result.error.message}`);
      return;
    }
    setSuccess(knowledgeId ? "Wissenseintrag aktualisiert." : "Wissenseintrag angelegt.");
    resetKnowledge();
    await load();
  };

  const editKnowledge = (item: KnowledgeItem) => {
    setKnowledgeId(item.id);
    setKnowledgeForm({
      title: item.title,
      category: item.category,
      content: item.content,
      keywords: item.keywords.join(", "),
      is_active: item.is_active,
    });
    setTab("knowledge");
  };

  const deleteKnowledge = async (item: KnowledgeItem) => {
    if (!canManage || !window.confirm(`Wissenseintrag „${item.title}“ wirklich löschen?`)) return;
    const { error: deleteError } = await supabase
      .from("knowledge_items")
      .delete()
      .eq("id", item.id);
    if (deleteError) setError(`Löschen fehlgeschlagen: ${deleteError.message}`);
    else {
      setSuccess("Wissenseintrag gelöscht.");
      await load();
    }
  };

  const saveTerminology = async () => {
    if (!canManage || saving) return;
    const term = terminologyForm.term.trim();
    if (!term) {
      setError("Bitte geben Sie einen Fachbegriff ein.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload = {
      term,
      canonical_label: terminologyForm.canonical_label.trim() || null,
      category: terminologyForm.category.trim() || null,
      definition: terminologyForm.definition.trim() || null,
      aliases: splitList(terminologyForm.aliases),
      is_active: terminologyForm.is_active,
    };
    const result = termId
      ? await supabase.from("ai_terminology").update(payload).eq("id", termId)
      : await supabase.from("ai_terminology").insert({ company_id: companyId, ...payload });
    setSaving(false);
    if (result.error) {
      setError(`Fachbegriff konnte nicht gespeichert werden: ${result.error.message}`);
      return;
    }
    setSuccess(termId ? "Fachbegriff aktualisiert." : "Fachbegriff angelegt.");
    resetTerminology();
    await load();
  };

  const editTerminology = (item: TerminologyItem) => {
    setTermId(item.id);
    setTerminologyForm({
      term: item.term,
      canonical_label: item.canonical_label ?? "",
      category: item.category ?? "Fachbegriff",
      definition: item.definition ?? "",
      aliases: item.aliases.join(", "),
      is_active: item.is_active,
    });
    setTab("terminology");
  };

  const deleteTerminology = async (item: TerminologyItem) => {
    if (!canManage || !window.confirm(`Fachbegriff „${item.term}“ wirklich löschen?`)) return;
    const { error: deleteError } = await supabase.from("ai_terminology").delete().eq("id", item.id);
    if (deleteError) setError(`Löschen fehlgeschlagen: ${deleteError.message}`);
    else {
      setSuccess("Fachbegriff gelöscht.");
      await load();
    }
  };

  const updateGap = async (gap: KnowledgeGap, status: "resolved" | "ignored") => {
    setError(null);
    const { error: updateError } = await supabase
      .from("knowledge_gaps")
      .update({
        status,
        resolution_note:
          status === "resolved"
            ? "Im KI-Wissenscenter als gelöst markiert."
            : "Im KI-Wissenscenter ignoriert.",
      })
      .eq("id", gap.id);
    if (updateError)
      setError(`Wissenslücke konnte nicht aktualisiert werden: ${updateError.message}`);
    else {
      setSuccess(status === "resolved" ? "Wissenslücke gelöst." : "Wissenslücke ignoriert.");
      await load();
    }
  };

  const prepareGapAsKnowledge = (gap: KnowledgeGap) => {
    setKnowledgeId(null);
    setKnowledgeForm({
      ...emptyKnowledge,
      title: gap.question.slice(0, 160),
      category: "FAQ",
      keywords: "Kundenfrage",
    });
    setTab("knowledge");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KI-Wissenscenter</CardTitle>
          <CardDescription>Wissen, Fachbegriffe und offene Kundenfragen.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Wissenscenter wird geladen …
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-5" /> KI-Wissenscenter
        </CardTitle>
        <CardDescription>
          Inhalte hier werden im allgemeinen Auskunftspfad des Chats gesucht. Wissenslücken
          entstehen automatisch aus unbeantworteten oder negativ bewerteten Antworten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
            {success}
          </p>
        ) : null}
        {!canManage ? (
          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            Sie können die Inhalte ansehen. Änderungen sind Eigentümern und Administratoren
            vorbehalten.
          </p>
        ) : null}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger value="knowledge">Wissen ({knowledge.length})</TabsTrigger>
            <TabsTrigger value="terminology">Fachbegriffe ({terminology.length})</TabsTrigger>
            <TabsTrigger value="gaps">
              Lücken ({gaps.filter((gap) => gap.status === "open").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge" className="space-y-4">
            {canManage ? (
              <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="knowledge-title">Titel / Kundenfrage</Label>
                  <Input
                    id="knowledge-title"
                    maxLength={160}
                    value={knowledgeForm.title}
                    onChange={(event) =>
                      setKnowledgeForm((form) => ({ ...form, title: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="knowledge-category">Kategorie</Label>
                  <Input
                    id="knowledge-category"
                    maxLength={80}
                    value={knowledgeForm.category}
                    onChange={(event) =>
                      setKnowledgeForm((form) => ({ ...form, category: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="knowledge-content">Verbindliche Antwort / Inhalt</Label>
                  <Textarea
                    id="knowledge-content"
                    rows={5}
                    maxLength={12_000}
                    value={knowledgeForm.content}
                    onChange={(event) =>
                      setKnowledgeForm((form) => ({ ...form, content: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="knowledge-keywords">Suchbegriffe (durch Komma getrennt)</Label>
                  <Input
                    id="knowledge-keywords"
                    value={knowledgeForm.keywords}
                    onChange={(event) =>
                      setKnowledgeForm((form) => ({ ...form, keywords: event.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <Label htmlFor="knowledge-active">Im Chat verwenden</Label>
                  <Switch
                    id="knowledge-active"
                    checked={knowledgeForm.is_active}
                    onCheckedChange={(value) =>
                      setKnowledgeForm((form) => ({ ...form, is_active: value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  {knowledgeId ? (
                    <Button variant="outline" onClick={resetKnowledge}>
                      Abbrechen
                    </Button>
                  ) : null}
                  <Button onClick={() => void saveKnowledge()} disabled={saving}>
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {knowledgeId ? "Änderungen speichern" : "Wissen hinzufügen"}
                  </Button>
                </div>
              </div>
            ) : null}

            {knowledge.length ? (
              <div className="space-y-2">
                {knowledge.map((item) => (
                  <div key={item.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{item.title}</p>
                          <Badge variant={item.is_active ? "secondary" : "outline"}>
                            {item.is_active ? "Aktiv" : "Pausiert"}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                          {item.content}
                        </p>
                      </div>
                      {canManage ? (
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="icon" onClick={() => editKnowledge(item)}>
                            <Edit3 className="size-4" />
                            <span className="sr-only">Bearbeiten</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void deleteKnowledge(item)}
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Löschen</span>
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                Noch kein eigenes Wissen hinterlegt. Kundenfragen werden aktuell nur aus Stammdaten,
                Leistungen und Öffnungszeiten beantwortet.
              </p>
            )}
          </TabsContent>

          <TabsContent value="terminology" className="space-y-4">
            {canManage ? (
              <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="term-name">Fachbegriff</Label>
                  <Input
                    id="term-name"
                    value={terminologyForm.term}
                    onChange={(event) =>
                      setTerminologyForm((form) => ({ ...form, term: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term-label">Kundenfreundliche Bezeichnung</Label>
                  <Input
                    id="term-label"
                    value={terminologyForm.canonical_label}
                    onChange={(event) =>
                      setTerminologyForm((form) => ({
                        ...form,
                        canonical_label: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="term-definition">Erklärung für den KI-Mitarbeiter</Label>
                  <Textarea
                    id="term-definition"
                    rows={3}
                    value={terminologyForm.definition}
                    onChange={(event) =>
                      setTerminologyForm((form) => ({ ...form, definition: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term-category">Kategorie</Label>
                  <Input
                    id="term-category"
                    value={terminologyForm.category}
                    onChange={(event) =>
                      setTerminologyForm((form) => ({ ...form, category: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term-aliases">Synonyme (durch Komma getrennt)</Label>
                  <Input
                    id="term-aliases"
                    value={terminologyForm.aliases}
                    onChange={(event) =>
                      setTerminologyForm((form) => ({ ...form, aliases: event.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <Label htmlFor="term-active">Im Chat verwenden</Label>
                  <Switch
                    id="term-active"
                    checked={terminologyForm.is_active}
                    onCheckedChange={(value) =>
                      setTerminologyForm((form) => ({ ...form, is_active: value }))
                    }
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  {termId ? (
                    <Button variant="outline" onClick={resetTerminology}>
                      Abbrechen
                    </Button>
                  ) : null}
                  <Button onClick={() => void saveTerminology()} disabled={saving}>
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {termId ? "Änderungen speichern" : "Fachbegriff hinzufügen"}
                  </Button>
                </div>
              </div>
            ) : null}

            {terminology.length ? (
              <div className="space-y-2">
                {terminology.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-md border p-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.term}</p>
                        {item.canonical_label ? <span>→ {item.canonical_label}</span> : null}
                        <Badge variant={item.is_active ? "secondary" : "outline"}>
                          {item.is_active ? "Aktiv" : "Pausiert"}
                        </Badge>
                      </div>
                      {item.definition ? (
                        <p className="mt-1 text-sm text-muted-foreground">{item.definition}</p>
                      ) : null}
                      {item.aliases.length ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Synonyme: {item.aliases.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    {canManage ? (
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" onClick={() => editTerminology(item)}>
                          <Edit3 className="size-4" />
                          <span className="sr-only">Bearbeiten</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void deleteTerminology(item)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Löschen</span>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                Noch keine betriebsspezifischen Fachbegriffe hinterlegt.
              </p>
            )}
          </TabsContent>

          <TabsContent value="gaps" className="space-y-2">
            {gaps.length ? (
              gaps.map((gap) => (
                <div key={gap.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={gap.status === "open" ? "destructive" : "outline"}>
                          {gap.status === "open"
                            ? "Offen"
                            : gap.status === "resolved"
                              ? "Gelöst"
                              : "Ignoriert"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {gap.occurrence_count}× gefragt
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium">{gap.question}</p>
                    </div>
                    {gap.status === "open" ? (
                      <div className="flex flex-wrap gap-2">
                        {canManage ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => prepareGapAsKnowledge(gap)}
                          >
                            <BookOpen className="size-4" /> Als Wissen übernehmen
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void updateGap(gap, "resolved")}
                        >
                          <CheckCircle2 className="size-4" /> Gelöst
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void updateGap(gap, "ignored")}
                        >
                          <XCircle className="size-4" /> Ignorieren
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
                Noch keine Wissenslücken erkannt.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
