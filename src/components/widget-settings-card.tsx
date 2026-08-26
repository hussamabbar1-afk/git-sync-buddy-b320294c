import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Check, Code2, Copy, Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ChatWidget } from "@/components/chat-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";

type EmbedInfo = {
  configured?: boolean;
  agent_id?: string;
  agent_name?: string;
  widget_key?: string;
  active?: boolean;
  loader_url?: string;
  script_tag?: string;
  public_widget_base_url?: string | null;
  ready_to_embed?: boolean;
  platform_hints?: Record<string, string>;
};

type Installation = {
  origin?: string;
  platform?: string | null;
  last_seen_at?: string | null;
  loads_count?: number | null;
};

type DistributionEntry = {
  agent_id?: string;
  installed_domains?: number;
  installations?: Installation[];
};

type DisplaySettings = {
  enabled: boolean;
  position: string;
  primary_color: string;
  launcher_label: string;
  show_branding: boolean;
  mobile_fullscreen: boolean;
};

type SecuritySettings = {
  enabled: boolean;
  allowed_origins: string[];
  hourly_request_limit: number;
  max_message_length: number;
};

const platformLabels: Record<string, string> = {
  wordpress: "WordPress",
  wix: "Wix",
  jimdo: "Jimdo",
  webflow: "Webflow",
  shopify: "Shopify",
  custom: "Eigene Website",
  generic: "Allgemein",
  unknown: "Unbekannt",
};

export function WidgetSettingsCard({
  agentId,
  welcomeMessage,
  canManage,
}: {
  agentId: string;
  welcomeMessage?: string | null;
  canManage: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [embed, setEmbed] = useState<EmbedInfo | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [settings, setSettings] = useState<DisplaySettings | null>(null);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [allowedOrigins, setAllowedOrigins] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [embedRes, distRes, settingsRes, securityRes] = await Promise.all([
      supabase.rpc("get_widget_embed_info", { p_ai_agent_id: agentId }),
      supabase.rpc("get_widget_distribution_status"),
      supabase
        .from("widget_display_settings")
        .select(
          "enabled, position, primary_color, launcher_label, show_branding, mobile_fullscreen",
        )
        .eq("ai_agent_id", agentId)
        .maybeSingle(),
      supabase
        .from("widget_security_settings")
        .select("enabled, allowed_origins, hourly_request_limit, max_message_length")
        .eq("ai_agent_id", agentId)
        .maybeSingle(),
    ]);

    const loadError = embedRes.error ?? distRes.error ?? settingsRes.error ?? securityRes.error;
    if (loadError) {
      setError(`Widget-Informationen konnten nicht geladen werden: ${loadError.message}`);
      setLoading(false);
      return;
    }

    setEmbed((embedRes.data ?? null) as EmbedInfo | null);

    const entries = (distRes.data ?? []) as DistributionEntry[];
    const entry = Array.isArray(entries) ? entries.find((e) => e.agent_id === agentId) : undefined;
    setInstallations(entry?.installations ?? []);

    setSettings(
      settingsRes.data
        ? {
            enabled: settingsRes.data.enabled,
            position: settingsRes.data.position,
            primary_color: settingsRes.data.primary_color,
            launcher_label: settingsRes.data.launcher_label,
            show_branding: settingsRes.data.show_branding,
            mobile_fullscreen: settingsRes.data.mobile_fullscreen,
          }
        : null,
    );

    setSecurity(
      securityRes.data
        ? {
            enabled: securityRes.data.enabled,
            allowed_origins: securityRes.data.allowed_origins,
            hourly_request_limit: securityRes.data.hourly_request_limit,
            max_message_length: securityRes.data.max_message_length,
          }
        : null,
    );
    setAllowedOrigins((securityRes.data?.allowed_origins ?? []).join("\n"));

    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const set = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) =>
    setSettings((s) => (s ? { ...s, [key]: value } : s));

  const setSecurityValue = <K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) =>
    setSecurity((current) => (current ? { ...current, [key]: value } : current));

  const handleSave = async () => {
    if (!settings || !security || saving || !canManage) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!/^#[0-9a-fA-F]{6}$/.test(settings.primary_color)) {
      setSaving(false);
      setError("Bitte geben Sie eine gültige Primärfarbe im Format #111827 ein.");
      return;
    }
    if (!settings.launcher_label.trim() || settings.launcher_label.trim().length > 40) {
      setSaving(false);
      setError("Die Beschriftung muss zwischen 1 und 40 Zeichen lang sein.");
      return;
    }

    const normalizedOrigins: string[] = [];
    for (const raw of allowedOrigins
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean)) {
      try {
        const parsed = new URL(raw);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("invalid protocol");
        normalizedOrigins.push(parsed.origin.toLowerCase());
      } catch {
        setSaving(false);
        setError(`Ungültige erlaubte Domain: ${raw}. Bitte mit https:// oder http:// angeben.`);
        return;
      }
    }
    const uniqueOrigins = Array.from(new Set(normalizedOrigins));
    if (
      security.hourly_request_limit < 10 ||
      security.hourly_request_limit > 5000 ||
      security.max_message_length < 100 ||
      security.max_message_length > 20_000
    ) {
      setSaving(false);
      setError(
        "Rate-Limit oder maximale Nachrichtenlänge liegt außerhalb des zulässigen Bereichs.",
      );
      return;
    }

    // Only display fields are written; company_id, ai_agent_id, widget_key and
    // public_widget_base_url are never editable from the frontend.
    const [displayUpdate, securityUpdate] = await Promise.all([
      supabase
        .from("widget_display_settings")
        .update({
          enabled: settings.enabled,
          position: settings.position,
          primary_color: settings.primary_color,
          launcher_label: settings.launcher_label.trim(),
          show_branding: settings.show_branding,
          mobile_fullscreen: settings.mobile_fullscreen,
        })
        .eq("ai_agent_id", agentId),
      supabase
        .from("widget_security_settings")
        .update({
          enabled: security.enabled,
          allowed_origins: uniqueOrigins,
          hourly_request_limit: security.hourly_request_limit,
          max_message_length: security.max_message_length,
        })
        .eq("ai_agent_id", agentId),
    ]);

    setSaving(false);
    const updateError = displayUpdate.error ?? securityUpdate.error;
    if (updateError) {
      setError(`Speichern fehlgeschlagen: ${updateError.message}`);
      return;
    }
    setAllowedOrigins(uniqueOrigins.join("\n"));
    setSecurity((current) => (current ? { ...current, allowed_origins: uniqueOrigins } : current));
    setSuccess("Widget-Darstellung und Sicherheit gespeichert.");
  };

  const scriptTag = embed?.script_tag ?? null;
  const published = Boolean(embed?.public_widget_base_url);
  const securityReady = Boolean(security?.enabled && security.allowed_origins.length > 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chat-Widget</CardTitle>
          <CardDescription>Einbindung auf Ihrer Website.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Widget-Daten werden geladen …
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat-Widget</CardTitle>
        <CardDescription>Einbindung, Darstellung und Status Ihres Website-Chats.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={embed?.active ? "secondary" : "outline"}>
            {embed?.active ? "KI aktiv" : "KI inaktiv"}
          </Badge>
          <Badge variant={settings?.enabled ? "secondary" : "outline"}>
            {settings?.enabled ? "Widget aktiviert" : "Widget deaktiviert"}
          </Badge>
          <Badge variant={securityReady ? "secondary" : "outline"}>
            {securityReady ? "Domainfreigabe aktiv" : "Domainfreigabe fehlt"}
          </Badge>
          <Badge variant={published ? "secondary" : "outline"}>
            {published ? "Veröffentlicht" : "Noch nicht veröffentlicht"}
          </Badge>
          <Button variant="outline" size="sm" className="sm:ml-auto" asChild>
            <Link to="/installation">
              Geführte Installation <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {!canManage ? (
          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            Die Widget-Konfiguration ist schreibgeschützt. Änderungen sind Eigentümern und
            Administratoren vorbehalten.
          </p>
        ) : null}

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Widget-Schlüssel</Label>
          <code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">
            {embed?.widget_key ?? "—"}
          </code>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Einbettungscode</Label>
          {published && scriptTag ? (
            <>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{scriptTag}</pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(scriptTag);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Kopiert" : "Code kopieren"}
              </Button>
            </>
          ) : (
            <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              Noch nicht veröffentlicht – der Einbettungscode steht zur Verfügung, sobald Ihr
              Chat-Widget freigeschaltet wurde. Bitte wenden Sie sich an den Support.
            </p>
          )}
        </div>

        {settings ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-md border p-3 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Widget aktiv</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Steuert, ob der Chat auf Ihrer Website ausgeliefert wird.
                </p>
              </div>
              <Switch checked={settings.enabled} onCheckedChange={(v) => set("enabled", v)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-position">Position</Label>
              <Select value={settings.position} onValueChange={(v) => set("position", v)}>
                <SelectTrigger id="widget-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom_right">Unten rechts</SelectItem>
                  <SelectItem value="bottom_left">Unten links</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-color">Primärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="widget-color"
                  value={settings.primary_color}
                  onChange={(e) => set("primary_color", e.target.value)}
                  placeholder="#111827"
                />
                <input
                  type="color"
                  aria-label="Farbe wählen"
                  className="h-9 w-10 shrink-0 rounded-md border bg-background"
                  value={
                    /^#[0-9a-fA-F]{6}$/.test(settings.primary_color)
                      ? settings.primary_color
                      : "#111827"
                  }
                  onChange={(e) => set("primary_color", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="widget-label">Beschriftung des Chat-Buttons</Label>
              <Input
                id="widget-label"
                value={settings.launcher_label}
                onChange={(e) => set("launcher_label", e.target.value)}
                placeholder="Chat"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <p className="text-sm font-medium">Mobil im Vollbild</p>
              <Switch
                checked={settings.mobile_fullscreen}
                onCheckedChange={(v) => set("mobile_fullscreen", v)}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border p-3">
              <p className="text-sm font-medium">ZunftEcho-Hinweis zeigen</p>
              <Switch
                checked={settings.show_branding}
                onCheckedChange={(v) => set("show_branding", v)}
              />
            </div>

            <div className="sm:col-span-2"></div>
          </div>
        ) : (
          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            Für diesen KI-Mitarbeiter sind noch keine Widget-Darstellungseinstellungen hinterlegt.
          </p>
        )}

        {security ? (
          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-4" /> Missbrauchsschutz
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Die serverseitige Sicherheitsprüfung läuft vor jeder Chat-Anfrage.
                </p>
              </div>
              <Switch
                checked={security.enabled}
                onCheckedChange={(value) => setSecurityValue("enabled", value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-origins">Erlaubte Website-Domains</Label>
              <Textarea
                id="widget-origins"
                rows={4}
                value={allowedOrigins}
                onChange={(event) => setAllowedOrigins(event.target.value)}
                placeholder={"https://www.mein-betrieb.de\nhttps://mein-betrieb.de"}
              />
              <p className="text-xs text-muted-foreground">
                Eine Origin pro Zeile, einschließlich https://. Pfade werden beim Speichern
                entfernt.
              </p>
              {!allowedOrigins.trim() ? (
                <p className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Ohne Domain-Liste bleibt das
                  Widget serverseitig gesperrt. Tragen Sie vor der Veröffentlichung die produktiven
                  Kundendomains ein.
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="widget-hourly-limit">Anfragen pro Besucher und Stunde</Label>
                <Input
                  id="widget-hourly-limit"
                  type="number"
                  min={10}
                  max={5000}
                  value={security.hourly_request_limit}
                  onChange={(event) =>
                    setSecurityValue("hourly_request_limit", Number(event.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="widget-max-length">Maximale Nachrichtenlänge</Label>
                <Input
                  id="widget-max-length"
                  type="number"
                  min={100}
                  max={20_000}
                  value={security.max_message_length}
                  onChange={(event) =>
                    setSecurityValue("max_message_length", Number(event.target.value))
                  }
                />
              </div>
            </div>

            <Button onClick={() => void handleSave()} disabled={saving || !canManage}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Widget-Darstellung und Sicherheit speichern
            </Button>
          </div>
        ) : (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            Sicherheitskonfiguration fehlt. Bitte den Support kontaktieren, bevor das Widget
            veröffentlicht wird.
          </p>
        )}

        {embed?.platform_hints ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Einbindung nach Plattform</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {Object.entries(embed.platform_hints).map(([platform, hint]) => (
                <li key={platform}>
                  <span className="font-medium text-foreground">
                    {platformLabels[platform] ?? platform}:
                  </span>{" "}
                  {hint}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {installations.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Erkannte Domains</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {installations.map((item, index) => (
                <li key={`${item.origin}-${index}`} className="flex justify-between gap-3">
                  <span className="truncate">{item.origin}</span>
                  <span>
                    {item.last_seen_at
                      ? new Date(item.last_seen_at).toLocaleDateString("de-DE")
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {embed?.widget_key && securityReady ? (
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Code2 className="size-4" /> Testchat
            </p>
            <ChatWidget
              widgetKey={embed.widget_key}
              welcomeMessage={welcomeMessage ?? null}
              metadata={{
                origin: security!.allowed_origins[0]!,
                client_id: `dashboard-test-${agentId}`,
              }}
              maxMessageLength={security?.max_message_length ?? 4000}
            />
          </div>
        ) : embed?.widget_key ? (
          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            Der Testchat wird verfügbar, sobald mindestens eine erlaubte Website-Domain gespeichert
            ist.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
