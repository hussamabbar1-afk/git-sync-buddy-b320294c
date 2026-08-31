import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  ChartNoAxesColumnIncreasing,
  CheckSquare,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  FileText,
  Flame,
  LifeBuoy,
  Loader2,
  MoonStar,
  Siren,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  asRecord,
  bool,
  customerName,
  formatCents,
  formatDate,
  formatDateTime,
  num,
  optionalNum,
  priorityLabel,
  priorityVariant,
  resolveExistingRoute,
  str,
  temperatureLabel,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard – ZunftEcho" },
      {
        name: "description",
        content:
          "Übersicht über Gespräche, Leads und die Auslastung Ihres KI-Mitarbeiters im SHK-Betrieb.",
      },
      { property: "og:title", content: "Dashboard – ZunftEcho" },
      {
        property: "og:description",
        content: "Kennzahlen zu Gesprächen, Leads und Terminanfragen auf einen Blick.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

type DashboardMetrics = {
  new_leads_7d: number;
  open_leads: number;
  appointments_today: number;
  upcoming_appointments: number;
  open_jobs: number;
  in_progress_jobs: number;
  open_tasks: number;
  overdue_tasks: number;
  needs_human: number;
  overdue_handoffs: number;
  open_quotes: number;
  expiring_quotes: number;
};

type AiMetrics = {
  conversations: number;
  leads: number;
  appointments: number;
  handoffs: number;
  booking_conversion_rate_percent: number;
  lead_conversion_rate_percent: number;
};

type FinanceMetrics = {
  quotes_open_value_cents: number;
  quotes_accepted_value_cents: number;
  jobs_open_estimated_value_cents: number;
  jobs_completed_final_value_cents_30d: number;
};

type SetupCore = {
  company_profile: boolean;
  contact: boolean;
  services: number;
  service_areas: number;
  open_days: number;
  ai_agent: boolean;
  knowledge_items: number;
};

type Overview = {
  dashboard: DashboardMetrics;
  ai: AiMetrics;
  finance: FinanceMetrics;
  setupScore: number;
  setupCore: SetupCore;
  companyId: string | null;
};

type TopLead = {
  id: string;
  name: string | null;
  issue_type: string | null;
  priority: string | null;
  lead_score: number | null;
  temperature: string | null;
  estimated_value_cents: number | null;
  follow_up_at: string | null;
};

type AttentionItem = {
  item_type: string;
  entity_id: string;
  title: string | null;
  subtitle: string | null;
  due_at: string | null;
  priority: string | null;
  route: string | null;
};

type SeriesPoint = {
  day: string;
  conversations: number;
  leads: number;
  appointments: number;
};

type PilotValueMetrics = {
  days: number;
  conversations: number;
  after_hours_conversations: number;
  leads: number;
  appointments: number;
  handoffs: number;
  lead_conversion_rate_percent: number;
  booking_conversion_rate_percent: number;
};

type GrowthMetric = {
  current: number;
  previous: number;
  changePercent: number;
};

type GrowthAnalytics = {
  days: number;
  leads: GrowthMetric;
  conversations: GrowthMetric;
  appointments: GrowthMetric;
  sources: Array<{ source: string; count: number }>;
  busiestHours: Array<{ hour: number; count: number }>;
};

const itemTypeLabels: Record<string, string> = {
  handoff: "Übergabe",
  lead_sla: "Lead-Reaktion",
  follow_up: "Wiedervorlage",
  task: "Aufgabe",
  appointment: "Termin",
  job: "Auftrag",
  quote: "Angebot",
};

function parseOverview(payload: unknown): Overview {
  const root = asRecord(payload);
  const dashboard = asRecord(root["dashboard"]);
  const ai = asRecord(root["ai"]);
  const quotes = asRecord(root["quotes"]);
  const jobs = asRecord(root["jobs"]);
  const setup = asRecord(root["setup"]);
  const core = asRecord(setup["core"]);

  return {
    dashboard: {
      new_leads_7d: num(dashboard["new_leads_7d"]),
      open_leads: num(dashboard["open_leads"]),
      appointments_today: num(dashboard["appointments_today"]),
      upcoming_appointments: num(dashboard["upcoming_appointments"]),
      open_jobs: num(dashboard["open_jobs"]),
      in_progress_jobs: num(dashboard["in_progress_jobs"]),
      open_tasks: num(dashboard["open_tasks"]),
      overdue_tasks: num(dashboard["overdue_tasks"]),
      needs_human: num(dashboard["needs_human"]),
      overdue_handoffs: num(dashboard["overdue_handoffs"]),
      open_quotes: num(dashboard["open_quotes"]),
      expiring_quotes: num(dashboard["expiring_quotes"]),
    },
    ai: {
      conversations: num(ai["conversations"]),
      leads: num(ai["leads"]),
      appointments: num(ai["appointments"]),
      handoffs: num(ai["handoffs"]),
      booking_conversion_rate_percent: num(ai["booking_conversion_rate_percent"]),
      lead_conversion_rate_percent: num(ai["lead_conversion_rate_percent"]),
    },
    finance: {
      quotes_open_value_cents: num(quotes["open_value_cents"]),
      quotes_accepted_value_cents: num(quotes["accepted_value_cents"]),
      jobs_open_estimated_value_cents: num(jobs["open_estimated_value_cents"]),
      jobs_completed_final_value_cents_30d: num(jobs["completed_final_value_cents_30d"]),
    },
    setupScore: Math.max(0, Math.min(100, num(setup["score"]))),
    setupCore: {
      company_profile: bool(core["company_profile"]),
      contact: bool(core["contact"]),
      services: num(core["services"]),
      service_areas: num(core["service_areas"]),
      open_days: num(core["open_days"]),
      ai_agent: bool(core["ai_agent"]),
      knowledge_items: num(core["knowledge_items"]),
    },
    companyId: str(setup["company_id"]),
  };
}

function parsePilotValue(payload: unknown): PilotValueMetrics {
  const root = asRecord(payload);
  return {
    days: num(root["days"]),
    conversations: num(root["conversations"]),
    after_hours_conversations: num(root["after_hours_conversations"]),
    leads: num(root["leads"]),
    appointments: num(root["appointments"]),
    handoffs: num(root["handoffs"]),
    lead_conversion_rate_percent: num(root["lead_conversion_rate_percent"]),
    booking_conversion_rate_percent: num(root["booking_conversion_rate_percent"]),
  };
}

function parseGrowthAnalytics(payload: unknown): GrowthAnalytics {
  const root = asRecord(payload);
  const parseMetric = (value: unknown): GrowthMetric => {
    const metric = asRecord(value);
    return {
      current: num(metric["current"]),
      previous: num(metric["previous"]),
      changePercent: num(metric["change_percent"]),
    };
  };
  const sources = Array.isArray(root["sources"]) ? root["sources"] : [];
  const busiestHours = Array.isArray(root["busiest_hours"]) ? root["busiest_hours"] : [];

  return {
    days: num(root["days"]),
    leads: parseMetric(root["leads"]),
    conversations: parseMetric(root["conversations"]),
    appointments: parseMetric(root["appointments"]),
    sources: sources.map((value) => {
      const item = asRecord(value);
      return { source: str(item["source"]) || "Direkt", count: num(item["count"]) };
    }),
    busiestHours: busiestHours.map((value) => {
      const item = asRecord(value);
      return { hour: num(item["hour"]), count: num(item["count"]) };
    }),
  };
}

const chartConfig = {
  conversations: { label: "Gespräche", color: "var(--chart-1)" },
  leads: { label: "Leads", color: "var(--chart-2)" },
  appointments: { label: "Termine", color: "var(--chart-3)" },
} satisfies ChartConfig;

function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [queue, setQueue] = useState<AttentionItem[]>([]);
  const [topLeads, setTopLeads] = useState<TopLead[]>([]);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [pilotValue, setPilotValue] = useState<PilotValueMetrics | null>(null);
  const [growth, setGrowth] = useState<GrowthAnalytics | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [seriesError, setSeriesError] = useState<string | null>(null);
  const [pilotValueError, setPilotValueError] = useState<string | null>(null);
  const [growthError, setGrowthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setQueueError(null);
      setLeadsError(null);
      setSeriesError(null);
      setPilotValueError(null);
      setGrowthError(null);

      const [overviewRes, queueRes, leadsRes, seriesRes, pilotValueRes, growthRes] =
        await Promise.all([
          supabase.rpc("get_business_overview", { p_days: 30 }),
          supabase.rpc("get_attention_queue", { p_limit: 8 }),
          supabase.rpc("get_top_leads", { p_limit: 5 }),
          supabase.rpc("get_dashboard_series", { p_days: 14 }),
          supabase.rpc("get_pilot_value_metrics", { p_days: 30 }),
          supabase.rpc("get_growth_analytics", { p_days: 30 }),
        ]);

      if (cancelled) return;

      if (overviewRes.error) {
        setError("Die Kennzahlen konnten nicht geladen werden.");
        setLoading(false);
        return;
      }

      const parsed = parseOverview(overviewRes.data);
      if (!parsed.companyId) {
        setError("Bitte schließen Sie zuerst die Einrichtung Ihres Unternehmens ab.");
        setLoading(false);
        return;
      }

      setOverview(parsed);

      if (queueRes.error) {
        setQueueError("Die Aufgabenliste konnte nicht geladen werden.");
        setQueue([]);
      } else {
        setQueue(
          (queueRes.data ?? []).map((row) => ({
            item_type: row.item_type,
            entity_id: row.entity_id,
            title: row.title,
            subtitle: row.subtitle,
            due_at: row.due_at,
            priority: row.priority,
            route: row.route,
          })),
        );
      }

      if (leadsRes.error) {
        setLeadsError("Die Top-Leads konnten nicht geladen werden.");
        setTopLeads([]);
      } else {
        setTopLeads(
          (leadsRes.data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            issue_type: row.issue_type,
            priority: row.priority,
            lead_score: optionalNum(row.lead_score),
            temperature: row.temperature,
            estimated_value_cents: optionalNum(row.estimated_value_cents),
            follow_up_at: row.follow_up_at,
          })),
        );
      }

      if (seriesRes.error) {
        setSeriesError("Der Aktivitätsverlauf konnte nicht geladen werden.");
        setSeries([]);
      } else {
        setSeries(
          (seriesRes.data ?? []).map((row) => ({
            day: row.day,
            conversations: num(row.conversations),
            leads: num(row.leads),
            appointments: num(row.appointments),
          })),
        );
      }

      if (pilotValueRes.error) {
        setPilotValueError("Der Pilot-Nutzen konnte nicht geladen werden.");
        setPilotValue(null);
      } else {
        setPilotValue(parsePilotValue(pilotValueRes.data));
      }

      if (growthRes.error) {
        setGrowthError("Der Periodenvergleich konnte nicht geladen werden.");
        setGrowth(null);
      } else {
        setGrowth(parseGrowthAnalytics(growthRes.data));
      }

      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Daten werden geladen …
        </div>
      </AppShell>
    );
  }

  if (error || !overview) {
    return (
      <AppShell>
        <PageHeader title="Übersicht" description="Ihre Kennzahlen auf einen Blick." />
        <Card>
          <CardContent className="space-y-4 py-10 text-center">
            <p className="text-sm text-destructive">
              {error ?? "Die Kennzahlen konnten nicht geladen werden."}
            </p>
            <Button variant="outline" asChild>
              <Link to="/einrichtung">Zur Einrichtung</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const d = overview.dashboard;
  const ai = overview.ai;
  const finance = overview.finance;

  const nextStep =
    d.overdue_handoffs > 0
      ? {
          tone: "critical" as const,
          eyebrow: "Sofort handeln",
          title: `${d.overdue_handoffs} menschliche ${d.overdue_handoffs === 1 ? "Übergabe wartet" : "Übergaben warten"} länger als vereinbart.`,
          description:
            "Öffnen Sie die Gespräche jetzt, damit dringende Kundenanfragen nicht verloren gehen.",
          label: "Jetzt bearbeiten",
          to: "/konversationen" as const,
          icon: Siren,
        }
      : d.overdue_tasks > 0
        ? {
            tone: "warning" as const,
            eyebrow: "Nächster Schritt",
            title: `${d.overdue_tasks} ${d.overdue_tasks === 1 ? "Aufgabe ist" : "Aufgaben sind"} überfällig.`,
            description: "Priorisieren Sie die fälligen Aufgaben, bevor Sie neue Arbeit einplanen.",
            label: "Aufgaben prüfen",
            to: "/aufgaben" as const,
            icon: AlertTriangle,
          }
        : d.open_leads > 0
          ? {
              tone: "default" as const,
              eyebrow: "Nächster Schritt",
              title: `${d.open_leads} offene ${d.open_leads === 1 ? "Anfrage wartet" : "Anfragen warten"} auf Bearbeitung.`,
              description: "Kontaktieren Sie zuerst die Leads mit hoher Priorität und kurzer SLA.",
              label: "Leads bearbeiten",
              to: "/leads" as const,
              icon: Users,
            }
          : overview.setupScore < 100
            ? {
                tone: "default" as const,
                eyebrow: "Nächster Schritt",
                title: `Einrichtung zu ${overview.setupScore} % abgeschlossen.`,
                description:
                  "Vervollständigen Sie die fehlenden Angaben, damit der KI-Mitarbeiter zuverlässig antwortet.",
                label: "Einrichtung fortsetzen",
                to: "/einrichtung" as const,
                icon: Bot,
              }
            : {
                tone: "success" as const,
                eyebrow: "Alles im Plan",
                title: "Aktuell gibt es keine überfälligen Vorgänge.",
                description:
                  "ZunftEcho überwacht neue Anfragen und meldet sich bei Handlungsbedarf.",
                label: "Gespräche ansehen",
                to: "/konversationen" as const,
                icon: CircleCheckBig,
              };

  const cards = [
    {
      label: "Neue Leads (7 Tage)",
      value: d.new_leads_7d,
      hint: `${d.open_leads} offene Leads`,
      icon: Users,
      to: "/leads" as const,
    },
    {
      label: "Termine heute",
      value: d.appointments_today,
      hint: `${d.upcoming_appointments} kommende Termine`,
      icon: CalendarClock,
      to: "/termine" as const,
    },
    {
      label: "Offene Aufträge",
      value: d.open_jobs,
      hint: `${d.in_progress_jobs} in Arbeit`,
      icon: ClipboardList,
      to: "/auftraege" as const,
    },
    {
      label: "Offene Aufgaben",
      value: d.open_tasks,
      hint: d.overdue_tasks > 0 ? `${d.overdue_tasks} überfällig` : "Keine überfälligen Aufgaben",
      icon: d.overdue_tasks > 0 ? AlertTriangle : CheckSquare,
      to: "/aufgaben" as const,
    },
    {
      label: "Menschliche Übergaben",
      value: d.needs_human,
      hint: d.overdue_handoffs > 0 ? `${d.overdue_handoffs} über SLA` : "Innerhalb der SLA",
      icon: LifeBuoy,
      to: "/konversationen" as const,
    },
    {
      label: "Offene Angebote",
      value: d.open_quotes,
      hint: d.expiring_quotes > 0 ? `${d.expiring_quotes} laufen bald ab` : "Keine ablaufenden",
      icon: FileText,
      to: "/angebote" as const,
    },
  ];

  const setupChecks = [
    { label: "Unternehmensprofil hinterlegt", done: overview.setupCore.company_profile },
    { label: "Kontaktdaten vollständig", done: overview.setupCore.contact },
    { label: "Leistungen aktiv", done: overview.setupCore.services > 0 },
    { label: "Servicegebiete definiert", done: overview.setupCore.service_areas > 0 },
    { label: "Öffnungszeiten gepflegt", done: overview.setupCore.open_days > 0 },
    { label: "KI-Mitarbeiter aktiv", done: overview.setupCore.ai_agent },
    { label: "Wissensdatenbank gefüllt", done: overview.setupCore.knowledge_items > 0 },
  ];

  const aiStats = [
    { label: "Gespräche", value: String(ai.conversations) },
    { label: "Leads", value: String(ai.leads) },
    { label: "Termine", value: String(ai.appointments) },
    { label: "Übergaben", value: String(ai.handoffs) },
    { label: "Lead-Quote", value: `${ai.lead_conversion_rate_percent} %` },
    { label: "Buchungsquote", value: `${ai.booking_conversion_rate_percent} %` },
  ];

  const financeStats = [
    { label: "Angebote offen", value: formatCents(finance.quotes_open_value_cents) },
    { label: "Angebote angenommen", value: formatCents(finance.quotes_accepted_value_cents) },
    { label: "Aufträge geplant", value: formatCents(finance.jobs_open_estimated_value_cents) },
    {
      label: "Abgeschlossen (30 Tage)",
      value: formatCents(finance.jobs_completed_final_value_cents_30d),
    },
  ];

  const hasSeriesData = series.some(
    (point) => point.conversations > 0 || point.leads > 0 || point.appointments > 0,
  );
  const maxSourceCount = Math.max(1, ...(growth?.sources.map((source) => source.count) ?? []));

  return (
    <AppShell>
      <PageHeader
        title="Übersicht"
        description="Operativer Stand aus Leads, Gesprächen, Terminen und Aufträgen."
        action={
          <Button asChild>
            <Link to="/konversationen">Zu den Gesprächen</Link>
          </Button>
        }
      />

      <Card
        className={`mb-6 overflow-hidden ${
          nextStep.tone === "critical"
            ? "border-red-300 bg-red-50/80 dark:border-red-900 dark:bg-red-950/25"
            : nextStep.tone === "warning"
              ? "border-amber-300 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/25"
              : nextStep.tone === "success"
                ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20"
                : "border-primary/25 bg-primary/[0.04]"
        }`}
      >
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                nextStep.tone === "critical"
                  ? "bg-red-600 text-white"
                  : nextStep.tone === "warning"
                    ? "bg-amber-500 text-white"
                    : nextStep.tone === "success"
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-primary-foreground"
              }`}
            >
              <nextStep.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {nextStep.eyebrow}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{nextStep.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{nextStep.description}</p>
            </div>
          </div>
          <Button
            className="shrink-0"
            variant={nextStep.tone === "success" ? "outline" : "default"}
            asChild
          >
            <Link to={nextStep.to}>
              {nextStep.label}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((stat) => {
          const overdueHandoffCard =
            stat.label === "Menschliche Übergaben" && d.overdue_handoffs > 0;
          return (
            <Card
              key={stat.label}
              className={`h-full transition-colors ${
                overdueHandoffCard
                  ? "border-red-300 bg-red-50/70 shadow-sm shadow-red-100 hover:border-red-400 dark:border-red-900 dark:bg-red-950/25 dark:shadow-none"
                  : "hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-medium ${
                    overdueHandoffCard ? "text-red-700 dark:text-red-300" : "text-muted-foreground"
                  }`}
                >
                  {stat.label}
                </CardTitle>
                <stat.icon
                  className={`size-4 ${
                    overdueHandoffCard ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                  }`}
                />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p
                    className={`text-3xl font-semibold ${
                      overdueHandoffCard ? "text-red-700 dark:text-red-300" : ""
                    }`}
                  >
                    {stat.value}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      overdueHandoffCard
                        ? "font-semibold text-red-700 dark:text-red-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stat.hint}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={overdueHandoffCard ? "default" : "ghost"}
                  className={
                    overdueHandoffCard
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "-ml-3 text-muted-foreground"
                  }
                  asChild
                >
                  <Link to={stat.to}>
                    {overdueHandoffCard ? "Jetzt bearbeiten" : "Öffnen"}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aktivität der letzten 14 Tage</CardTitle>
          </CardHeader>
          <CardContent>
            {seriesError ? (
              <p className="py-10 text-center text-sm text-destructive">{seriesError}</p>
            ) : !hasSeriesData ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Noch keine Aktivität in den letzten 14 Tagen.
              </p>
            ) : (
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <LineChart data={series} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value: string) => formatDate(value).slice(0, 6)}
                  />
                  <YAxis width={28} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="conversations"
                    type="monotone"
                    stroke="var(--color-conversations)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="leads"
                    type="monotone"
                    stroke="var(--color-leads)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="appointments"
                    type="monotone"
                    stroke="var(--color-appointments)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-4" /> KI-Leistung (30 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {aiStats.map((stat) => (
              <div key={stat.label}>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-semibold">{stat.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartNoAxesColumnIncreasing className="size-5 text-primary" />
              Entwicklung gegenüber dem vorherigen Zeitraum
            </CardTitle>
          </CardHeader>
          <CardContent>
            {growthError ? (
              <p className="py-6 text-center text-sm text-destructive">{growthError}</p>
            ) : growth ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Gespräche", metric: growth.conversations },
                  { label: "Leads", metric: growth.leads },
                  { label: "Termine", metric: growth.appointments },
                ].map(({ label, metric }) => (
                  <div key={label} className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <p className="text-2xl font-semibold">{metric.current}</p>
                      <Badge
                        variant={metric.changePercent < 0 ? "destructive" : "secondary"}
                        className={
                          metric.changePercent > 0
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : ""
                        }
                      >
                        {metric.changePercent > 0 ? "+" : ""}
                        {metric.changePercent} %
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Vorher: {metric.previous} · je {growth.days} Tage
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Noch keine Vergleichsdaten vorhanden.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="size-4" /> Stärkste Anfragezeiten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {growth?.busiestHours.length ? (
              growth.busiestHours.map((item) => (
                <div key={item.hour} className="flex items-center justify-between gap-4 text-sm">
                  <span>
                    {String(item.hour).padStart(2, "0")}:00–
                    {String((item.hour + 1) % 24).padStart(2, "0")}:00 Uhr
                  </span>
                  <Badge variant="outline">{item.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Noch keine Anfragezeiten verfügbar.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Lead-Quellen der letzten 30 Tage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {growth?.sources.length ? (
            growth.sources.map((source) => (
              <div key={source.source} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{source.source}</span>
                  <span>{source.count}</span>
                </div>
                <Progress value={(source.count / maxSourceCount) * 100} />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Noch keine Lead-Quellen verfügbar.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-primary/25 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" /> Pilot-Nutzen (30 Tage)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pilotValueError ? (
            <p className="text-sm text-destructive">{pilotValueError}</p>
          ) : pilotValue ? (
            <div className="space-y-5">
              <div className="rounded-lg border bg-background p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <MoonStar className="size-4 text-primary" />
                  {pilotValue.after_hours_conversations} Anfragen außerhalb Ihrer Öffnungszeiten
                  aufgenommen
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Genau diese Zahl macht sichtbar, welchen zusätzlichen Kundenzugang ZunftEcho Ihrem
                  Betrieb ermöglicht.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Anfragen erfasst", value: pilotValue.conversations },
                  { label: "Leads gewonnen", value: pilotValue.leads },
                  { label: "Termine gebucht", value: pilotValue.appointments },
                  {
                    label: "Lead-Quote",
                    value: `${pilotValue.lead_conversion_rate_percent} %`,
                  },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Noch keine Pilotdaten vorhanden.</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Benötigt Ihre Aufmerksamkeit</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {queueError ? (
              <p className="py-8 text-center text-sm text-destructive">{queueError}</p>
            ) : queue.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Derzeit gibt es nichts Dringendes.
              </p>
            ) : (
              queue.map((item) => {
                const target = resolveExistingRoute(item.route);
                const body = (
                  <div className="flex w-full items-start justify-between gap-4 py-3 text-left">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.title ?? "Ohne Titel"}</p>
                      {item.subtitle ? (
                        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                      ) : null}
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{itemTypeLabels[item.item_type] ?? item.item_type}</span>
                        {item.due_at ? <span>Fällig: {formatDateTime(item.due_at)}</span> : null}
                        {!target ? <span>Ansicht noch nicht verfügbar</span> : null}
                      </p>
                    </div>
                    <Badge variant={priorityVariant(item.priority)}>
                      {priorityLabel(item.priority)}
                    </Badge>
                  </div>
                );

                return target ? (
                  <Link
                    key={`${item.item_type}-${item.entity_id}`}
                    to={target}
                    search={{ id: item.entity_id } as never}
                    className="block hover:bg-muted/40"
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    key={`${item.item_type}-${item.entity_id}`}
                    className="cursor-default opacity-70"
                  >
                    {body}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Einrichtung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Fortschritt</span>
                <span className="font-medium">{overview.setupScore} %</span>
              </div>
              <Progress value={overview.setupScore} className="mt-2" />
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {setupChecks.map((check) => (
                <li key={check.label}>
                  {check.done ? "✓" : "○"} {check.label}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/einrichtung">
                {overview.setupScore >= 100 ? "Einrichtung bearbeiten" : "Einrichtung fortsetzen"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Priorisierte Leads</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leads">Alle Leads</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y">
            {leadsError ? (
              <p className="py-8 text-center text-sm text-destructive">{leadsError}</p>
            ) : topLeads.length === 0 ? (
              <div className="space-y-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aktuell sind keine offenen Leads vorhanden.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/leads">Zu den Leads</Link>
                </Button>
              </div>
            ) : (
              topLeads.map((lead) => (
                <Link
                  key={lead.id}
                  to="/leads"
                  search={{ id: lead.id } as never}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{customerName(lead.name)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.issue_type ?? "Kein Anliegen hinterlegt"}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {lead.lead_score !== null ? <span>Score: {lead.lead_score}</span> : null}
                      {lead.temperature ? (
                        <span className="inline-flex items-center gap-1">
                          <Flame className="size-3" />
                          {temperatureLabel(lead.temperature)}
                        </span>
                      ) : null}
                      {lead.estimated_value_cents !== null ? (
                        <span>{formatCents(lead.estimated_value_cents)}</span>
                      ) : null}
                      {lead.follow_up_at ? (
                        <span>Wiedervorlage: {formatDateTime(lead.follow_up_at)}</span>
                      ) : null}
                    </p>
                  </div>
                  <Badge variant={priorityVariant(lead.priority)}>
                    {priorityLabel(lead.priority)}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Werte im Überblick</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {financeStats.map((stat) => (
              <div key={stat.label}>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-base font-semibold">{stat.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
