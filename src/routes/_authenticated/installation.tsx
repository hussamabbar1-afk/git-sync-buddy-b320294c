import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  Code2,
  Copy,
  ExternalLink,
  Globe2,
  Loader2,
  MonitorSmartphone,
  PlugZap,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  parseWebsiteOrigin,
  widgetPlatformGuides,
  type WidgetPlatformId,
} from "@/lib/widget-installation";

export const Route = createFileRoute("/_authenticated/installation")({
  head: () => ({
    meta: [
      { title: "Widget installieren – ZunftEcho" },
      {
        name: "description",
        content:
          "ZunftEcho-Chat auf WordPress, Wix, Shopify, Webflow, Squarespace, Jimdo oder einer eigenen Website installieren und prüfen.",
      },
      { property: "og:title", content: "Widget installieren – ZunftEcho" },
      {
        property: "og:description",
        content: "Geführte Website-Installation mit Live-Status und Plattformanleitungen.",
      },
    ],
  }),
  component: InstallationPage,
});

type EmbedInfo = {
  configured?: boolean;
  agent_id?: string;
  agent_name?: string;
  widget_key?: string;
  active?: boolean;
  script_tag?: string;
  public_widget_base_url?: string | null;
  ready_to_embed?: boolean;
};

type Installation = {
  origin?: string;
  platform?: string | null;
  last_seen_at?: string | null;
  loads_count?: number | null;
};

type DistributionEntry = {
  agent_id?: string;
  installations?: Installation[];
};

type VerificationResult = {
  kind: "success" | "warning" | "error";
  title: string;
  description: string;
};

const installationPlatformLabels: Record<string, string> = {
  wordpress: "WordPress",
  wix: "Wix",
  shopify: "Shopify",
  webflow: "Webflow",
  squarespace: "Squarespace",
  jimdo: "Jimdo",
  custom: "Eigene Website",
  generic: "Website",
  unknown: "Nicht erkannt",
};

function InstallationPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingCompany, setMissingCompany] = useState(false);
  const [missingAgent, setMissingAgent] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [embed, setEmbed] = useState<EmbedInfo | null>(null);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<WidgetPlatformId>("wordpress");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Sie sind nicht angemeldet. Bitte melden Sie sich erneut an.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      setError(`Unternehmensprofil konnte nicht geladen werden: ${profileError.message}`);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!profile?.company_id) {
      setMissingCompany(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data: agent, error: agentError } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("company_id", profile.company_id)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (agentError) {
      setError(`KI-Mitarbeiter konnte nicht geladen werden: ${agentError.message}`);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!agent) {
      setMissingAgent(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setAgentId(agent.id);
    const [embedRes, distributionRes, securityRes] = await Promise.all([
      supabase.rpc("get_widget_embed_info", { p_ai_agent_id: agent.id }),
      supabase.rpc("get_widget_distribution_status"),
      supabase
        .from("widget_security_settings")
        .select("enabled, allowed_origins")
        .eq("ai_agent_id", agent.id)
        .maybeSingle(),
    ]);

    const loadError = embedRes.error ?? distributionRes.error ?? securityRes.error;
    if (loadError) {
      setError(`Installationsdaten konnten nicht geladen werden: ${loadError.message}`);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const embedInfo = (embedRes.data ?? null) as EmbedInfo | null;
    const entries = (distributionRes.data ?? []) as DistributionEntry[];
    const distribution = Array.isArray(entries)
      ? entries.find((entry) => entry.agent_id === agent.id)
      : undefined;
    const origins = (securityRes.data?.allowed_origins ?? []).map((origin) => origin.toLowerCase());

    setEmbed(embedInfo);
    setInstallations(distribution?.installations ?? []);
    setAllowedOrigins(origins);
    setSecurityEnabled(Boolean(securityRes.data?.enabled));
    setWebsiteUrl((current) => current || origins[0] || "");
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const platform = useMemo(
    () =>
      widgetPlatformGuides.find((guide) => guide.id === selectedPlatform) ??
      widgetPlatformGuides[0]!,
    [selectedPlatform],
  );

  const scriptTag = embed?.script_tag ?? "";
  const published = Boolean(embed?.public_widget_base_url);
  const domainReady = securityEnabled && allowedOrigins.length > 0;
  const installationDetected = installations.length > 0;
  const readinessSteps = [Boolean(embed?.active), published, domainReady, installationDetected];
  const readinessProgress = readinessSteps.filter(Boolean).length * 25;

  const copyCode = async () => {
    if (!scriptTag) return;
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(scriptTag);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(
        "Der Code konnte nicht automatisch kopiert werden. Bitte markieren Sie ihn manuell.",
      );
    }
  };

  const verifyWebsite = () => {
    const parsed = parseWebsiteOrigin(websiteUrl);
    if (!parsed.ok) {
      setVerification({ kind: "error", title: "Adresse prüfen", description: parsed.error });
      return;
    }

    setWebsiteUrl(parsed.origin);
    const allowed = allowedOrigins.includes(parsed.origin);
    const detected = installations.find(
      (installation) => installation.origin?.toLowerCase() === parsed.origin,
    );

    if (!allowed) {
      setVerification({
        kind: "warning",
        title: "Domain noch nicht freigegeben",
        description: `${parsed.origin} muss zuerst in den erlaubten Website-Domains gespeichert werden.`,
      });
      return;
    }

    if (detected) {
      setVerification({
        kind: "success",
        title: "Installation erfolgreich erkannt",
        description: `ZunftEcho wurde auf ${parsed.hostname} geladen. Der Website-Chat ist verbunden.`,
      });
      return;
    }

    setVerification({
      kind: "warning",
      title: "Code noch nicht erkannt",
      description:
        "Die Domain ist freigegeben. Veröffentlichen Sie den Code, öffnen Sie die öffentliche Website und prüfen Sie anschließend erneut.",
    });
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader
          title="Widget installieren"
          description="Website-Chat in wenigen Schritten verbinden und prüfen."
        />
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Installationsdaten werden geladen …
        </div>
      </AppShell>
    );
  }

  if (error || missingCompany || missingAgent || !embed) {
    return (
      <AppShell>
        <PageHeader
          title="Widget installieren"
          description="Website-Chat in wenigen Schritten verbinden und prüfen."
        />
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <PlugZap className="size-5 text-muted-foreground" />
            </span>
            <div>
              <p className="font-medium">
                {missingCompany
                  ? "Unternehmensprofil fehlt"
                  : missingAgent
                    ? "KI-Mitarbeiter fehlt"
                    : "Installationsdaten nicht verfügbar"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error ??
                  "Schließen Sie zuerst die Einrichtung ab. Danach steht der persönliche Einbettungscode bereit."}
              </p>
            </div>
            <Button asChild>
              <Link to={missingAgent ? "/ki-mitarbeiter" : "/einrichtung"}>
                Einrichtung fortsetzen <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Widget installieren"
        description="Geführte Einbindung, Live-Status und Anleitungen für Ihre Website-Plattform."
        action={
          <Button variant="outline" onClick={() => void load(true)} disabled={refreshing}>
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            Status aktualisieren
          </Button>
        }
      />

      <section className="relative overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-primary)_9%,var(--color-card)),var(--color-card)_55%,color-mix(in_oklab,var(--color-accent)_10%,var(--color-card)))] p-5 shadow-sm sm:p-7">
        <div className="absolute -top-16 -right-12 size-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={embed.ready_to_embed ? "secondary" : "outline"}>
                {embed.ready_to_embed ? "Bereit zur Installation" : "Vorbereitung erforderlich"}
              </Badge>
              <Badge variant="outline">{embed.agent_name ?? "KI-Mitarbeiter"}</Badge>
            </div>
            <h2 className="mt-4 max-w-2xl text-2xl font-semibold sm:text-3xl">
              Ihr Website-Chat ist nur einen Code-Schnipsel entfernt.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Plattform auswählen, persönlichen Code kopieren und die öffentliche Website öffnen.
              ZunftEcho erkennt die erfolgreiche Verbindung automatisch.
            </p>
          </div>
          <div className="rounded-xl border bg-card/85 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Inbetriebnahme</span>
              <span className="font-semibold text-primary">{readinessProgress}%</span>
            </div>
            <Progress value={readinessProgress} className="mt-3" />
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <StatusLine done={Boolean(embed.active)}>KI aktiv</StatusLine>
              <StatusLine done={published}>Veröffentlicht</StatusLine>
              <StatusLine done={domainReady}>Domain freigegeben</StatusLine>
              <StatusLine done={installationDetected}>Website erkannt</StatusLine>
            </div>
          </div>
        </div>
      </section>

      {!domainReady ? (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />
            <div>
              <p className="font-medium">Website-Domain zuerst freigeben</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Der Sicherheitsfilter blockiert unbekannte Domains automatisch.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/ki-mitarbeiter">Domain konfigurieren</Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="h-fit xl:sticky xl:top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorSmartphone className="size-5 text-primary" /> 1. Plattform wählen
            </CardTitle>
            <CardDescription>Die Anleitung passt sich Ihrer Website an.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
            {widgetPlatformGuides.map((guide) => {
              const selected = guide.id === selectedPlatform;
              return (
                <button
                  key={guide.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedPlatform(guide.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "hover:border-primary/35 hover:bg-muted/40"
                  }`}
                >
                  <span
                    className={`flex size-8 items-center justify-center rounded-lg text-[11px] font-bold ${
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {guide.shortName}
                  </span>
                  <span className="mt-2 block text-sm font-medium">{guide.name}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                      {platform.shortName}
                    </span>
                    Installation auf {platform.name}
                  </CardTitle>
                  <CardDescription className="mt-2">{platform.description}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={platform.officialGuide} target="_blank" rel="noreferrer">
                    Plattform-Hilfe <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/35 p-4">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Menüpfad
                  </p>
                  <p className="mt-2 text-sm font-medium">{platform.navigation}</p>
                </div>
                <div className="rounded-xl border bg-muted/35 p-4">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Einfügeposition
                  </p>
                  <p className="mt-2 text-sm font-medium">{platform.codeLocation}</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
                <ol className="space-y-4">
                  {platform.steps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <p className="pt-0.5 text-sm leading-6 text-muted-foreground">{step}</p>
                    </li>
                  ))}
                </ol>
                <PlatformVisual platform={platform.name} location={platform.codeLocation} />
              </div>

              {platform.note ? (
                <p className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3 text-xs leading-5 text-amber-900 dark:text-amber-100">
                  <strong>Hinweis:</strong> {platform.note}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="size-5 text-primary" /> Lokale HTML-Datei testen
              </CardTitle>
              <CardDescription>
                Sicherer Vorschauweg für eine selbst erstellte Testdatei – ohne sie öffentlich zu
                veröffentlichen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="leading-6 text-muted-foreground">
                Eine direkt geöffnete <code>file://</code>-Datei besitzt keine prüfbare Domain und
                wird deshalb bewusst blockiert. Öffnen Sie ein Terminal im Ordner der HTML-Datei und
                starten Sie stattdessen:
              </p>
              <pre className="overflow-x-auto rounded-xl border bg-muted p-3 font-mono text-xs">
                python -m http.server 5500
              </pre>
              <p className="text-xs leading-5 text-muted-foreground">
                Danach <strong>http://localhost:5500</strong> öffnen und diese Origin während des
                Tests unter „KI-Mitarbeiter → Erlaubte Website-Domains“ freigeben. Für den
                ZunftEcho-Demobetrieb ist sie bereits vorkonfiguriert.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="size-5 text-primary" /> 2. Persönlichen Code kopieren
              </CardTitle>
              <CardDescription>
                Der Schlüssel gehört zu Ihrem KI-Mitarbeiter. Fügen Sie den Code genau einmal ein.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scriptTag ? (
                <>
                  <div className="relative overflow-hidden rounded-xl border bg-slate-950 p-4 text-slate-100 shadow-inner">
                    <div className="mb-3 flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-red-400" />
                      <span className="size-2.5 rounded-full bg-amber-400" />
                      <span className="size-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-6">
                      {scriptTag}
                    </pre>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={() => void copyCode()}>
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied ? "Code kopiert" : "Code kopieren"}
                    </Button>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ShieldCheck className="size-3.5 text-emerald-600" /> Keine Passwörter oder
                      API-Schlüssel im Code
                    </span>
                  </div>
                  {copyError ? <p className="text-xs text-destructive">{copyError}</p> : null}
                </>
              ) : (
                <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                  Der Einbettungscode wird bereitgestellt, sobald das Widget veröffentlicht ist.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SearchCheck className="size-5 text-primary" /> 3. Installation prüfen
              </CardTitle>
              <CardDescription>
                Keine Zugangsdaten nötig: ZunftEcho prüft, ob das Widget von Ihrer Domain geladen
                wurde.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="url"
                  inputMode="url"
                  value={websiteUrl}
                  onChange={(event) => {
                    setWebsiteUrl(event.target.value);
                    setVerification(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") verifyWebsite();
                  }}
                  placeholder="https://www.mein-betrieb.de"
                  aria-label="Adresse der zu prüfenden Website"
                />
                <Button onClick={verifyWebsite} className="shrink-0">
                  Jetzt prüfen
                </Button>
              </div>

              {verification ? <VerificationNotice result={verification} /> : null}

              <div className="grid gap-3 sm:grid-cols-3">
                <MiniCheck done={domainReady} label="Domain freigegeben" />
                <MiniCheck done={Boolean(scriptTag)} label="Code verfügbar" />
                <MiniCheck done={installationDetected} label="Ladevorgang erkannt" />
              </div>

              {installations.length > 0 ? (
                <div className="overflow-hidden rounded-xl border">
                  <div className="flex items-center justify-between border-b bg-muted/35 px-4 py-3">
                    <p className="text-sm font-medium">Erkannte Websites</p>
                    <Badge variant="secondary">{installations.length}</Badge>
                  </div>
                  <ul className="divide-y">
                    {installations.map((installation, index) => (
                      <li
                        key={`${installation.origin ?? "origin"}-${index}`}
                        className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{installation.origin ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {installationPlatformLabels[installation.platform ?? "unknown"] ??
                              installation.platform ??
                              "Nicht erkannt"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                          <span>{installation.loads_count ?? 0} Aufrufe</span>
                          <span>
                            {installation.last_seen_at
                              ? new Date(installation.last_seen_at).toLocaleString("de-DE", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </span>
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center">
                  <Globe2 className="mx-auto size-6 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">Noch keine öffentliche Website erkannt</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nach dem Veröffentlichen die Website einmal öffnen und den Status aktualisieren.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6 overflow-hidden border-primary/25 bg-primary/[0.03]">
        <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="font-semibold">Nach der Installation: echten Anfrageweg testen</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Öffnen Sie Ihre Website im privaten Fenster, senden Sie eine realistische
                Testanfrage und prüfen Sie anschließend Gespräch, Lead und Benachrichtigung im
                Dashboard.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/konversationen">
              Zu den Gesprächen <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function StatusLine({ done, children }: { done: boolean; children: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {done ? (
        <CheckCircle2 className="size-3.5 text-emerald-600" />
      ) : (
        <CircleDashed className="size-3.5" />
      )}
      {children}
    </span>
  );
}

function MiniCheck({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/25 p-3 text-xs">
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
      ) : (
        <CircleDashed className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className={done ? "font-medium" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

function VerificationNotice({ result }: { result: VerificationResult }) {
  const styles =
    result.kind === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
      : result.kind === "error"
        ? "border-destructive/40 bg-destructive/10 text-destructive"
        : "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100";
  const Icon = result.kind === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${styles}`} role="status">
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-sm font-medium">{result.title}</p>
        <p className="mt-1 text-xs leading-5 opacity-80">{result.description}</p>
      </div>
    </div>
  );
}

function PlatformVisual({ platform, location }: { platform: string; location: string }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm" aria-hidden="true">
      <div className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-2">
        <span className="size-2 rounded-full bg-red-400" />
        <span className="size-2 rounded-full bg-amber-400" />
        <span className="size-2 rounded-full bg-emerald-400" />
        <span className="ml-2 truncate text-[10px] text-muted-foreground">
          {platform} · Website-Einstellungen
        </span>
      </div>
      <div className="grid min-h-52 grid-cols-[4.5rem_1fr]">
        <div className="space-y-2 border-r bg-muted/25 p-2">
          <span className="block h-2 w-10 rounded bg-muted-foreground/20" />
          <span className="block h-2 w-12 rounded bg-muted-foreground/20" />
          <span className="block h-6 rounded bg-primary/15" />
          <span className="block h-2 w-11 rounded bg-muted-foreground/20" />
        </div>
        <div className="p-3">
          <p className="text-[10px] font-semibold">Benutzerdefinierter Code</p>
          <p className="mt-1 text-[8px] text-muted-foreground">{location}</p>
          <div className="mt-3 rounded-md bg-slate-950 p-2 font-mono text-[7px] leading-3 text-sky-200">
            &lt;script async
            <br />
            &nbsp;&nbsp;src=&quot;.../widget-loader?key=...&quot;
            <br />
            &gt;&lt;/script&gt;
          </div>
          <span className="mt-3 inline-flex rounded bg-primary px-2 py-1 text-[8px] font-medium text-primary-foreground">
            Speichern
          </span>
        </div>
      </div>
    </div>
  );
}
