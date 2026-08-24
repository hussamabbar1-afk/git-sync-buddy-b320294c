import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Check, Clock3, Globe, Languages, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { AiKnowledgeCard } from "@/components/ai-knowledge-card";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { WidgetSettingsCard } from "@/components/widget-settings-card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/ki-mitarbeiter")({
  head: () => ({
    meta: [
      { title: "KI-Mitarbeiter – HandwerkAI" },
      {
        name: "description",
        content:
          "Namen, Tonalität, Aufgaben und Website-Chat-Widget Ihres KI-Mitarbeiters konfigurieren.",
      },
      { property: "og:title", content: "KI-Mitarbeiter – HandwerkAI" },
      {
        property: "og:description",
        content: "Konfiguration von Auftreten, Aufgaben und Chat-Widget des KI-Mitarbeiters.",
      },
    ],
  }),
  component: AiEmployeePage,
});

const capabilities = [
  {
    title: "Anfragen entgegennehmen",
    description: "Rund um die Uhr, auch außerhalb der Öffnungszeiten.",
  },
  {
    title: "Anliegen qualifizieren",
    description: "Art der Störung, Dringlichkeit und Objektdaten erfassen.",
  },
  { title: "Terminwunsch aufnehmen", description: "Wunschtermine sammeln und im Lead vermerken." },
  {
    title: "Notfälle erkennen",
    description: "Bei Wasserschaden oder Gasgeruch an das Büro übergeben.",
  },
];

type AgentForm = {
  name: string;
  description: string;
  is_active: boolean;
  language: string;
  response_style: string;
  welcome_message: string;
  fallback_message: string;
  human_handoff_enabled: boolean;
  supported_languages: string[];
  auto_detect_language: boolean;
  staff_summary_language: string;
  translate_staff_summary: boolean;
};

const emptyForm: AgentForm = {
  name: "",
  description: "",
  is_active: true,
  language: "de",
  response_style: "professionell",
  welcome_message: "",
  fallback_message: "",
  human_handoff_enabled: true,
  supported_languages: ["de"],
  auto_detect_language: true,
  staff_summary_language: "de",
  translate_staff_summary: true,
};

const languageOptions = [
  ["de", "Deutsch"],
  ["en", "Englisch"],
  ["ar", "Arabisch"],
  ["tr", "Türkisch"],
  ["pl", "Polnisch"],
  ["ru", "Russisch"],
  ["uk", "Ukrainisch"],
  ["fr", "Französisch"],
  ["es", "Spanisch"],
  ["it", "Italienisch"],
] as const;

function AiEmployeePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [noCompany, setNoCompany] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [handoffSlaMinutes, setHandoffSlaMinutes] = useState(15);
  const [companyTimezone, setCompanyTimezone] = useState("Europe/Berlin");
  const [openingHoursCount, setOpeningHoursCount] = useState(0);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [form, setForm] = useState<AgentForm>(emptyForm);

  const set = <K extends keyof AgentForm>(key: K, value: AgentForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled) {
          setError("Sie sind nicht angemeldet. Bitte melden Sie sich an.");
          setLoading(false);
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        setError(`Fehler beim Laden des Profils: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (!profile?.company_id) {
        setNoCompany(true);
        setLoading(false);
        return;
      }

      setCompanyId(profile.company_id);
      setCanManage(profile.role === "owner" || profile.role === "admin");

      const [agentRes, companyRes, hoursRes] = await Promise.all([
        supabase.from("ai_agents").select("*").eq("company_id", profile.company_id).maybeSingle(),
        supabase
          .from("companies")
          .select("handoff_sla_minutes, timezone")
          .eq("id", profile.company_id)
          .maybeSingle(),
        supabase
          .from("opening_hours")
          .select("id", { count: "exact", head: true })
          .eq("company_id", profile.company_id),
      ]);

      if (cancelled) return;

      const loadError = agentRes.error ?? companyRes.error ?? hoursRes.error;
      if (loadError) {
        setError(`Fehler beim Laden des KI-Mitarbeiters: ${loadError.message}`);
        setLoading(false);
        return;
      }

      const agent = agentRes.data;
      setHandoffSlaMinutes(companyRes.data?.handoff_sla_minutes ?? 15);
      setCompanyTimezone(companyRes.data?.timezone ?? "Europe/Berlin");
      setOpeningHoursCount(hoursRes.count ?? 0);

      if (agent) {
        setAgentId(agent.id);
        setForm({
          name: agent.name ?? "",
          description: agent.description ?? "",
          is_active: agent.is_active ?? true,
          language: agent.language ?? "de",
          response_style: agent.response_style ?? "professionell",
          welcome_message: agent.welcome_message ?? "",
          fallback_message: agent.fallback_message ?? "",
          human_handoff_enabled: agent.human_handoff_enabled ?? true,
          supported_languages: agent.supported_languages ?? [agent.language ?? "de"],
          auto_detect_language: agent.auto_detect_language ?? true,
          staff_summary_language: agent.staff_summary_language ?? "de",
          translate_staff_summary: agent.translate_staff_summary ?? true,
        });
      }

      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;

    if (!canManage || !companyId) {
      setError("Nur Eigentümer und Administratoren können die KI-Konfiguration ändern.");
      setSuccess(null);
      return;
    }

    if (!form.name.trim()) {
      setError("Bitte geben Sie einen Namen für den KI-Mitarbeiter ein.");
      setSuccess(null);
      return;
    }

    if (handoffSlaMinutes < 5 || handoffSlaMinutes > 1440) {
      setError("Die Reaktionszeit für Übergaben muss zwischen 5 und 1.440 Minuten liegen.");
      setSuccess(null);
      return;
    }

    const supportedLanguages = Array.from(new Set([...form.supported_languages, form.language]));
    if (!supportedLanguages.length || supportedLanguages.length > 20) {
      setError("Bitte wählen Sie mindestens eine und höchstens 20 Kundensprachen.");
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(null);
    setSaving(true);

    const agentPayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
      language: form.language,
      response_style: form.response_style,
      welcome_message: form.welcome_message.trim() || null,
      fallback_message: form.fallback_message.trim() || null,
      human_handoff_enabled: form.human_handoff_enabled,
      supported_languages: supportedLanguages,
      auto_detect_language: form.auto_detect_language,
      staff_summary_language: form.staff_summary_language,
      translate_staff_summary: form.translate_staff_summary,
    };

    if (agentId) {
      const [agentUpdate, companyUpdate] = await Promise.all([
        supabase.from("ai_agents").update(agentPayload).eq("id", agentId),
        supabase
          .from("companies")
          .update({ handoff_sla_minutes: handoffSlaMinutes })
          .eq("id", companyId),
      ]);

      setSaving(false);

      const updateError = agentUpdate.error ?? companyUpdate.error;
      if (updateError) {
        setError(`Fehler beim Speichern: ${updateError.message}`);
        return;
      }

      setForm((current) => ({ ...current, supported_languages: supportedLanguages }));
      setSuccess("KI-Mitarbeiter erfolgreich gespeichert.");
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("create_ai_agent_for_current_company", {
      agent_name: form.name.trim(),
      agent_description: form.description.trim(),
      agent_language: form.language,
      agent_response_style: form.response_style,
      agent_welcome_message: form.welcome_message.trim(),
      agent_fallback_message: form.fallback_message.trim(),
      agent_human_handoff_enabled: form.human_handoff_enabled,
    });

    if (rpcError) {
      setSaving(false);
      setError(`Fehler beim Anlegen: ${rpcError.message}`);
      return;
    }

    if (typeof data !== "string") {
      setSaving(false);
      setError("Der KI-Mitarbeiter wurde angelegt, aber die Kennung fehlt.");
      return;
    }

    const [agentUpdate, companyUpdate] = await Promise.all([
      supabase.from("ai_agents").update(agentPayload).eq("id", data),
      supabase
        .from("companies")
        .update({ handoff_sla_minutes: handoffSlaMinutes })
        .eq("id", companyId),
    ]);
    setSaving(false);
    const updateError = agentUpdate.error ?? companyUpdate.error;
    if (updateError) {
      setError(
        `KI-Mitarbeiter angelegt, Zusatzkonfiguration fehlgeschlagen: ${updateError.message}`,
      );
      return;
    }

    setAgentId(data);
    setForm((current) => ({ ...current, supported_languages: supportedLanguages }));
    setSuccess("KI-Mitarbeiter erfolgreich gespeichert.");
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          title="KI-Mitarbeiter"
          description="Legen Sie fest, wie sich Ihr digitaler Mitarbeiter gegenüber Kunden verhält."
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Daten werden geladen …
        </div>
      </AppShell>
    );
  }

  if (noCompany) {
    return (
      <AppShell>
        <PageHeader
          title="KI-Mitarbeiter"
          description="Legen Sie fest, wie sich Ihr digitaler Mitarbeiter gegenüber Kunden verhält."
        />
        <Card>
          <CardHeader>
            <CardTitle>Unternehmensprofil fehlt</CardTitle>
            <CardDescription>
              Bitte vervollständigen Sie zuerst Ihr Unternehmensprofil, bevor Sie einen
              KI-Mitarbeiter einrichten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/einrichtung">Zur Einrichtung</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="KI-Mitarbeiter"
        description="Legen Sie fest, wie sich Ihr digitaler Mitarbeiter gegenüber Kunden verhält."
        action={
          <Button onClick={handleSave} disabled={saving || !canManage}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {agentId ? "Konfiguration speichern" : "KI-Mitarbeiter erstellen"}
          </Button>
        }
      />

      {error ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mb-4 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
          {success}
        </p>
      ) : null}
      {!agentId ? (
        <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          Sie haben noch keinen KI-Mitarbeiter. Füllen Sie die Felder aus und erstellen Sie ihn.
        </p>
      ) : null}
      {!canManage ? (
        <p className="mb-4 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          Die Konfiguration ist schreibgeschützt. Änderungen sind Eigentümern und Administratoren
          vorbehalten.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Auftreten</CardTitle>
            <CardDescription>Name, Ansprache und Begrüßung.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assistant">Name des KI-Mitarbeiters</Label>
              <Input
                id="assistant"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="z. B. Lena"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Antwortstil</Label>
              <Select value={form.response_style} onValueChange={(v) => set("response_style", v)}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professionell">Professionell (Sie)</SelectItem>
                  <SelectItem value="freundlich">Freundlich</SelectItem>
                  <SelectItem value="kurz_und_direkt">Kurz und direkt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Wofür ist dieser KI-Mitarbeiter zuständig?"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="greeting">Begrüßungsnachricht</Label>
              <Textarea
                id="greeting"
                rows={3}
                value={form.welcome_message}
                onChange={(e) => set("welcome_message", e.target.value)}
                placeholder="Guten Tag, wie kann ich Ihnen helfen?"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fallback">Fallback-Nachricht</Label>
              <Textarea
                id="fallback"
                rows={2}
                value={form.fallback_message}
                onChange={(e) => set("fallback_message", e.target.value)}
                placeholder="Das kann ich leider nicht beantworten – ein Mitarbeiter meldet sich."
              />
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border p-4 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Übergabe an Mitarbeiter</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Gespräche bei Bedarf an einen echten Mitarbeiter weiterleiten.
                </p>
              </div>
              <Switch
                checked={form.human_handoff_enabled}
                onCheckedChange={(v) => set("human_handoff_enabled", v)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Status</CardTitle>
                <CardDescription>
                  {form.is_active ? "KI-Mitarbeiter aktiv" : "KI-Mitarbeiter inaktiv"}
                </CardDescription>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Bot className="size-4" /> Modellprofil: Standard
              </p>
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="size-4" /> Standardsprache
                </Label>
                <Select value={form.language} onValueChange={(v) => set("language", v)}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {agentId ? null : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chat-Widget</CardTitle>
                <CardDescription>Einbindung auf Ihrer Website.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Erstellen Sie zuerst den KI-Mitarbeiter, um das Chat-Widget einzurichten.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="size-4" /> Sprachen und Team-Zusammenfassung
            </CardTitle>
            <CardDescription>
              Der Chat erkennt Kundensprachen automatisch und kann interne Zusammenfassungen auf
              Deutsch bereitstellen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {languageOptions.map(([value, label]) => {
                const checked = form.supported_languages.includes(value);
                return (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-md border p-3 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        set(
                          "supported_languages",
                          next
                            ? Array.from(new Set([...form.supported_languages, value]))
                            : form.supported_languages.filter((language) => language !== value),
                        )
                      }
                    />
                    {label}
                  </label>
                );
              })}
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Kundensprache automatisch erkennen</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Antworten werden in einer unterstützten Sprache des Kunden erzeugt.
                </p>
              </div>
              <Switch
                checked={form.auto_detect_language}
                onCheckedChange={(value) => set("auto_detect_language", value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="staff-language">Sprache für Mitarbeiter</Label>
                <Select
                  value={form.staff_summary_language}
                  onValueChange={(value) => set("staff_summary_language", value)}
                >
                  <SelectTrigger id="staff-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <Label>Team-Zusammenfassung übersetzen</Label>
                <Switch
                  checked={form.translate_staff_summary}
                  onCheckedChange={(value) => set("translate_staff_summary", value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4" /> Übergabe und Betriebszeiten
            </CardTitle>
            <CardDescription>
              Der Chat erhält Öffnungszeiten, Betriebsschließungen und Zeitzone automatisch aus den
              Unternehmensdaten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="handoff-sla">Ziel-Reaktionszeit bei Übergabe (Minuten)</Label>
              <Input
                id="handoff-sla"
                type="number"
                min={5}
                max={1440}
                value={handoffSlaMinutes}
                onChange={(event) => setHandoffSlaMinutes(Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Wird dem KI-Mitarbeiter als Erwartung für die menschliche Nachbearbeitung übergeben.
              </p>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <Clock3 className="size-4" /> Öffnungszeiten im KI-Kontext
              </p>
              <p className="mt-2 text-muted-foreground">
                {openingHoursCount >= 7
                  ? `${openingHoursCount} Tagesregeln geladen · Zeitzone ${companyTimezone}`
                  : `Nur ${openingHoursCount} Tagesregeln vorhanden · bitte Unternehmensdaten vervollständigen.`}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/unternehmen">Öffnungszeiten verwalten</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {agentId ? (
        <div className="mt-4 space-y-4">
          {companyId ? <AiKnowledgeCard companyId={companyId} canManage={canManage} /> : null}
          <WidgetSettingsCard
            agentId={agentId}
            welcomeMessage={form.welcome_message}
            canManage={canManage}
          />
        </div>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Aktuelle Fähigkeiten</CardTitle>
          <CardDescription>
            Diese Aufgaben übernimmt Ihr KI-Mitarbeiter bereits. Die Liste ist informativ und nicht
            einzeln konfigurierbar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {capabilities.map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-md border p-4">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}
