import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Building2, CreditCard, ImageIcon, Key, Loader2, User } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { applyTheme } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/einstellungen")({
  head: () => ({
    meta: [
      { title: "Einstellungen – ZunftEcho" },
      {
        name: "description",
        content: "Verwalten Sie Ihre Kontoeinstellungen in ZunftEcho.",
      },
      { property: "og:title", content: "Einstellungen – ZunftEcho" },
      {
        property: "og:description",
        content: "Kontoeinstellungen, Benachrichtigungen und allgemeine Konfiguration.",
      },
    ],
  }),
  component: SettingsPage,
});

type Preferences = {
  language: string;
  timezone: string;
  dark_mode: boolean;
};

type NotificationChannel = { in_app: boolean; email: boolean; sms: boolean };
type NotificationEvent =
  | "new_lead"
  | "handoff"
  | "handoff_overdue"
  | "angry_customer"
  | "appointment_upcoming"
  | "payment_failed"
  | "pilot_expiring";

type NotificationPreferences = {
  event_channels: Record<NotificationEvent, NotificationChannel>;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  sms_number: string;
};

const notificationLabels: Record<NotificationEvent, string> = {
  new_lead: "Neuer Lead",
  handoff: "Mitarbeiter benötigt",
  handoff_overdue: "SLA überschritten",
  angry_customer: "Unzufriedener Kunde",
  appointment_upcoming: "Termin steht bevor",
  payment_failed: "Zahlung fehlgeschlagen",
  pilot_expiring: "Pilotphase endet",
};

const defaultNotificationPreferences: NotificationPreferences = {
  event_channels: Object.fromEntries(
    Object.keys(notificationLabels).map((event) => [
      event,
      {
        in_app: true,
        email: [
          "handoff",
          "handoff_overdue",
          "angry_customer",
          "payment_failed",
          "pilot_expiring",
        ].includes(event),
        sms: false,
      },
    ]),
  ) as Record<NotificationEvent, NotificationChannel>,
  quiet_hours_enabled: false,
  quiet_hours_start: "20:00",
  quiet_hours_end: "07:00",
  timezone: "Europe/Berlin",
  sms_number: "",
};

function parseNotificationPreferences(value: unknown): NotificationPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return defaultNotificationPreferences;
  const row = value as Record<string, unknown>;
  const rawEvents =
    row["event_channels"] && typeof row["event_channels"] === "object"
      ? (row["event_channels"] as Record<string, unknown>)
      : {};
  const eventChannels = { ...defaultNotificationPreferences.event_channels };
  for (const event of Object.keys(notificationLabels) as NotificationEvent[]) {
    const raw = rawEvents[event];
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const channel = raw as Record<string, unknown>;
      eventChannels[event] = {
        in_app: channel["in_app"] !== false,
        email: channel["email"] === true,
        sms: channel["sms"] === true,
      };
    }
  }
  return {
    event_channels: eventChannels,
    quiet_hours_enabled: row["quiet_hours_enabled"] === true,
    quiet_hours_start:
      typeof row["quiet_hours_start"] === "string" ? row["quiet_hours_start"].slice(0, 5) : "20:00",
    quiet_hours_end:
      typeof row["quiet_hours_end"] === "string" ? row["quiet_hours_end"].slice(0, 5) : "07:00",
    timezone: typeof row["timezone"] === "string" ? row["timezone"] : "Europe/Berlin",
    sms_number: typeof row["sms_number"] === "string" ? row["sms_number"] : "",
  };
}

const defaultPreferences: Preferences = {
  language: "Deutsch",
  timezone: "Europe/Berlin",
  dark_mode: false,
};

function parsePreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultPreferences;
  const raw = value as Record<string, unknown>;
  return {
    language: typeof raw["language"] === "string" ? raw["language"] : defaultPreferences.language,
    timezone: typeof raw["timezone"] === "string" ? raw["timezone"] : defaultPreferences.timezone,
    dark_mode: typeof raw["dark_mode"] === "boolean" ? raw["dark_mode"] : false,
  };
}

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [originalEmail, setOriginalEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);

  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState(
    defaultNotificationPreferences,
  );
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [notificationNotice, setNotificationNotice] = useState<string | null>(null);
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoNotice, setLogoNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userError || !userData.user) {
        setLoadError("Sie sind nicht angemeldet.");
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);
      setOriginalEmail(userData.user.email ?? "");
      setEmail(userData.user.email ?? "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, preferences, company_id")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        setLoadError("Die Einstellungen konnten nicht geladen werden.");
        setLoading(false);
        return;
      }

      setFullName(profile?.full_name ?? "");
      setCompanyId(profile?.company_id ?? null);
      const prefs = parsePreferences(profile?.preferences);
      setPreferences(prefs);
      applyTheme(prefs.dark_mode);
      if (profile?.company_id) {
        const [notificationResult, companyResult] = await Promise.all([
          supabase
            .from("user_notification_preferences")
            .select(
              "event_channels, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone, sms_number",
            )
            .eq("user_id", userData.user.id)
            .maybeSingle(),
          supabase.from("companies").select("logo_path").eq("id", profile.company_id).single(),
        ]);
        if (!cancelled) {
          setNotificationPreferences(parseNotificationPreferences(notificationResult.data));
          const path = companyResult.data?.logo_path ?? null;
          setLogoPath(path);
          if (path) {
            const { data: signed } = await supabase.storage
              .from("company-files")
              .createSignedUrl(path, 3600);
            if (!cancelled) setLogoUrl(signed?.signedUrl ?? null);
          }
        }
      }
      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveAccount = async () => {
    if (accountSaving || !userId) return;
    setAccountSaving(true);
    setAccountError(null);
    setAccountSuccess(null);

    const messages: string[] = [];

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null })
      .eq("id", userId);

    if (profileError) {
      setAccountError(`Fehler beim Speichern des Namens: ${profileError.message}`);
      setAccountSaving(false);
      return;
    }
    messages.push("Name gespeichert.");

    const nextEmail = email.trim();
    if (nextEmail && nextEmail !== originalEmail) {
      const { error: emailError } = await supabase.auth.updateUser({ email: nextEmail });
      if (emailError) {
        setAccountError(`Fehler beim Ändern der E-Mail: ${emailError.message}`);
        setAccountSaving(false);
        return;
      }
      messages.push("Bestätigungs-E-Mail zur Adressänderung versendet.");
    }

    if (password.trim()) {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) {
        setAccountError(`Fehler beim Ändern des Passworts: ${passwordError.message}`);
        setAccountSaving(false);
        return;
      }
      setPassword("");
      messages.push("Passwort aktualisiert.");
    }

    setAccountSaving(false);
    setAccountSuccess(messages.join(" "));
  };

  const handleSaveGeneral = async () => {
    if (generalSaving || !userId) return;
    setGeneralSaving(true);
    setGeneralError(null);
    setGeneralSuccess(null);

    const [{ error }, { error: notificationTimezoneError }] = await Promise.all([
      supabase.from("profiles").update({ preferences }).eq("id", userId),
      supabase
        .from("user_notification_preferences")
        .update({ timezone: preferences.timezone })
        .eq("user_id", userId),
    ]);

    setGeneralSaving(false);

    if (error || notificationTimezoneError) {
      setGeneralError(`Fehler beim Speichern: ${(error ?? notificationTimezoneError)?.message}`);
      return;
    }
    setGeneralSuccess("Einstellungen gespeichert.");
  };

  const updateNotificationChannel = (
    event: NotificationEvent,
    channel: keyof NotificationChannel,
    checked: boolean,
  ) => {
    setNotificationPreferences((current) => ({
      ...current,
      event_channels: {
        ...current.event_channels,
        [event]: { ...current.event_channels[event], [channel]: checked },
      },
    }));
  };

  const handleSaveNotifications = async () => {
    if (!userId || !companyId || notificationSaving) return;
    setNotificationSaving(true);
    setNotificationNotice(null);
    const { error } = await supabase.from("user_notification_preferences").upsert({
      user_id: userId,
      company_id: companyId,
      event_channels: notificationPreferences.event_channels,
      quiet_hours_enabled: notificationPreferences.quiet_hours_enabled,
      quiet_hours_start: notificationPreferences.quiet_hours_start,
      quiet_hours_end: notificationPreferences.quiet_hours_end,
      timezone: preferences.timezone,
      sms_number: notificationPreferences.sms_number.trim() || null,
      updated_at: new Date().toISOString(),
    });
    setNotificationSaving(false);
    setNotificationNotice(
      error
        ? `Benachrichtigungen konnten nicht gespeichert werden: ${error.message}`
        : "Ihre persönlichen Benachrichtigungen wurden gespeichert.",
    );
  };

  const uploadCompanyLogo = async (file: File) => {
    if (!companyId || logoSaving) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setLogoNotice("Bitte wählen Sie ein Bild mit höchstens 2 MB.");
      return;
    }
    setLogoSaving(true);
    setLogoNotice(null);
    const extension =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${companyId}/branding/logo-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("company-files")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setLogoSaving(false);
      setLogoNotice("Das Logo konnte nicht hochgeladen werden.");
      return;
    }
    const { error: updateError } = await supabase
      .from("companies")
      .update({ logo_path: path })
      .eq("id", companyId);
    if (updateError) {
      await supabase.storage.from("company-files").remove([path]);
      setLogoSaving(false);
      setLogoNotice("Das Logo konnte nicht gespeichert werden.");
      return;
    }
    if (logoPath) await supabase.storage.from("company-files").remove([logoPath]);
    const { data: signed } = await supabase.storage
      .from("company-files")
      .createSignedUrl(path, 3600);
    setLogoPath(path);
    setLogoUrl(signed?.signedUrl ?? null);
    setLogoSaving(false);
    setLogoNotice("Unternehmenslogo gespeichert.");
  };

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="Einstellungen" description="Verwalten Sie Ihre Kontoeinstellungen." />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Einstellungen werden geladen …
        </div>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <PageHeader title="Einstellungen" description="Verwalten Sie Ihre Kontoeinstellungen." />
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {loadError}
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Einstellungen" description="Verwalten Sie Ihre Kontoeinstellungen." />

      <Tabs defaultValue="konto">
        <TabsList className="max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="konto">Konto</TabsTrigger>
          <TabsTrigger value="benachrichtigungen">Benachrichtigungen</TabsTrigger>
          <TabsTrigger value="allgemein">Allgemein</TabsTrigger>
        </TabsList>

        <TabsContent value="konto" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-4" />
                  Kontodaten
                </CardTitle>
                <CardDescription>Ihre persönlichen Anmeldedaten verwalten.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Ihr Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Neues Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nur ausfüllen, wenn Sie es ändern möchten"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSaveAccount} disabled={accountSaving}>
                    {accountSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                    Speichern
                  </Button>
                </div>
                {accountError ? (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">
                    {accountError}
                  </p>
                ) : null}
                {accountSuccess ? (
                  <p className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-primary sm:col-span-2">
                    {accountSuccess}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="size-4" /> Unternehmenslogo
                  </CardTitle>
                  <CardDescription>
                    Wird für das Unternehmensprofil und zukünftige Kundendokumente verwendet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Unternehmenslogo"
                      className="h-20 max-w-56 rounded-md border object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-20 w-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                      Noch kein Logo
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={logoSaving}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadCompanyLogo(file);
                      event.target.value = "";
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG oder WebP · maximal 2 MB.
                  </p>
                  {logoNotice ? (
                    <p className="text-xs text-muted-foreground">{logoNotice}</p>
                  ) : null}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="size-4" /> Unternehmen und Abonnement
                  </CardTitle>
                  <CardDescription>
                    Firmendaten, Zahlungsverwaltung und Rechnungsverlauf.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to="/unternehmen">
                      <Building2 className="size-4" /> Firmendaten bearbeiten
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/abonnement">
                      <CreditCard className="size-4" /> Abo und Rechnungen
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="benachrichtigungen" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-4" />
                Benachrichtigungen
              </CardTitle>
              <CardDescription>
                Eigene Regeln für Ereignisse, Kanäle und Ruhezeiten.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="overflow-x-auto rounded-md border">
                <div className="grid min-w-[620px] grid-cols-[1fr_100px_100px_100px] border-b bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Ereignis</span>
                  <span className="text-center">Dashboard</span>
                  <span className="text-center">E-Mail</span>
                  <span className="text-center">SMS</span>
                </div>
                {(Object.keys(notificationLabels) as NotificationEvent[]).map((event) => (
                  <div
                    key={event}
                    className="grid min-w-[620px] grid-cols-[1fr_100px_100px_100px] items-center border-b px-4 py-3 last:border-b-0"
                  >
                    <span className="text-sm font-medium">{notificationLabels[event]}</span>
                    <div className="flex justify-center">
                      <Switch
                        checked={notificationPreferences.event_channels[event].in_app}
                        onCheckedChange={(checked) =>
                          updateNotificationChannel(event, "in_app", checked)
                        }
                        aria-label={`${notificationLabels[event]} im Dashboard`}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={notificationPreferences.event_channels[event].email}
                        onCheckedChange={(checked) =>
                          updateNotificationChannel(event, "email", checked)
                        }
                        aria-label={`${notificationLabels[event]} per E-Mail`}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch checked={false} disabled aria-label="SMS noch nicht verfügbar" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                SMS ist architektonisch vorbereitet, bleibt aber bis zur Anbindung eines
                DSGVO-tauglichen Providers deaktiviert.
              </p>

              <div className="rounded-md border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Ruhezeiten</p>
                    <p className="text-xs text-muted-foreground">
                      Nicht-kritische E-Mails werden außerhalb dieser Zeiten zurückgehalten.
                      Notfälle und eskalierte Übergaben bleiben sofort.
                    </p>
                  </div>
                  <Switch
                    checked={notificationPreferences.quiet_hours_enabled}
                    onCheckedChange={(checked) =>
                      setNotificationPreferences((current) => ({
                        ...current,
                        quiet_hours_enabled: checked,
                      }))
                    }
                  />
                </div>
                {notificationPreferences.quiet_hours_enabled ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="quiet-start">Beginn</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={notificationPreferences.quiet_hours_start}
                        onChange={(event) =>
                          setNotificationPreferences((current) => ({
                            ...current,
                            quiet_hours_start: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quiet-end">Ende</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={notificationPreferences.quiet_hours_end}
                        onChange={(event) =>
                          setNotificationPreferences((current) => ({
                            ...current,
                            quiet_hours_end: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <Button onClick={() => void handleSaveNotifications()} disabled={notificationSaving}>
                {notificationSaving ? <Loader2 className="size-4 animate-spin" /> : null}{" "}
                Benachrichtigungen speichern
              </Button>
              {notificationNotice ? (
                <p className="text-sm text-muted-foreground">{notificationNotice}</p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allgemein" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="size-4" />
                Allgemeine Konfiguration
              </CardTitle>
              <CardDescription>Grundeinstellungen für Ihr Konto.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language">Sprache</Label>
                <Input
                  id="language"
                  placeholder="Deutsch"
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Zeitzone</Label>
                <Input
                  id="timezone"
                  placeholder="Europe/Berlin"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Dunkles Erscheinungsbild aktivieren.
                  </p>
                </div>
                <Switch
                  checked={preferences.dark_mode}
                  onCheckedChange={(checked) => {
                    setPreferences({ ...preferences, dark_mode: checked });
                    applyTheme(checked);
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={handleSaveGeneral} disabled={generalSaving}>
                  {generalSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Speichern
                </Button>
              </div>
              {generalError ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2">
                  {generalError}
                </p>
              ) : null}
              {generalSuccess ? (
                <p className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-primary sm:col-span-2">
                  {generalSuccess}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
