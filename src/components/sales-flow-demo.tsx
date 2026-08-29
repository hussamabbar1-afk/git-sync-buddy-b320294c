import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BellRing,
  Bot,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  MailCheck,
  MapPin,
  MessageSquareText,
  RotateCcw,
  ShieldCheck,
  UserRoundCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type DemoStage = 0 | 1 | 2 | 3;

type Scenario = {
  name: string;
  customerMessage: string;
  service: string;
  location: string;
  urgency: string;
  urgencyTone: "critical" | "normal";
  detailQuestion: string;
  detailAnswer: string;
  slot: string;
  score: number;
};

const scenarios: Scenario[] = [
  {
    name: "Heizung ausgefallen",
    customerMessage: "Unsere Heizung ist komplett ausgefallen. Können Sie heute noch kommen?",
    service: "Heizungsnotdienst",
    location: "12043 Berlin-Neukölln",
    urgency: "Dringend · heute",
    urgencyTone: "critical",
    detailQuestion: "Ist Gasgeruch wahrnehmbar oder tritt Wasser aus?",
    detailAnswer: "Nein, kein Gasgeruch und kein Wasseraustritt.",
    slot: "Heute · 16:00–18:00",
    score: 94,
  },
  {
    name: "Wasserleck",
    customerMessage: "Unter dem Waschbecken tropft es stark und der Schrank wird schon nass.",
    service: "Leckage & Sanitär",
    location: "12347 Berlin-Britz",
    urgency: "Kritisch · schnellstmöglich",
    urgencyTone: "critical",
    detailQuestion: "Können Sie das Eckventil schließen und fließt weiterhin Wasser?",
    detailAnswer: "Das Ventil ist zu. Es tropft nur noch langsam.",
    slot: "Heute · 14:00–16:00",
    score: 97,
  },
  {
    name: "Badmodernisierung",
    customerMessage: "Wir möchten unser kleines Bad modernisieren und hätten gern eine Beratung.",
    service: "Badmodernisierung",
    location: "12524 Berlin-Altglienicke",
    urgency: "Planbar · innerhalb 14 Tagen",
    urgencyTone: "normal",
    detailQuestion: "Soll die Raumaufteilung bestehen bleiben oder verändert werden?",
    detailAnswer: "Die Aufteilung kann bleiben. Gewünscht ist eine bodengleiche Dusche.",
    slot: "Donnerstag · 10:00–11:00",
    score: 82,
  },
];

const stages: Array<{ title: string; subtitle: string }> = [
  { title: "Kundenanfrage", subtitle: "Der Kunde beschreibt sein Anliegen." },
  { title: "Qualifizierung", subtitle: "Fehlende Informationen werden strukturiert ergänzt." },
  { title: "Alarm & Übergabe", subtitle: "Priorität und zuständiges Team stehen sofort fest." },
  { title: "Termin & Ergebnis", subtitle: "Der Kunde erhält eine klare Bestätigung." },
];

export function SalesFlowDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stage, setStage] = useState<DemoStage>(0);
  const scenario = scenarios[scenarioIndex]!;
  const progress = (stage + 1) * 25;

  const chooseScenario = (index: number) => {
    setScenarioIndex(index);
    setStage(0);
  };

  const reset = () => {
    setScenarioIndex(0);
    setStage(0);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2" aria-label="Demo-Szenario auswählen">
        {scenarios.map((item, index) => (
          <button
            key={item.name}
            type="button"
            onClick={() => chooseScenario(index)}
            aria-pressed={scenarioIndex === index}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${
              scenarioIndex === index
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-sky-50"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <ol className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Demo-Ablauf">
        {stages.map((item, index) => {
          const isActive = index === stage;
          const isComplete = index < stage;
          return (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => setStage(index as DemoStage)}
                aria-current={isActive ? "step" : undefined}
                className={`flex min-h-[76px] w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? "border-primary bg-sky-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isComplete
                      ? "bg-emerald-600 text-white"
                      : isActive
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isComplete ? <Check className="size-4" /> : index + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{item.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {item.subtitle}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.5)] xl:grid-cols-[0.9fr_1.1fr]">
        <section className="border-b border-slate-200 bg-white xl:border-r xl:border-b-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                <BrandMark className="size-9" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Website des Betriebs</p>
                <p className="text-xs text-emerald-600">● Assistent online</p>
              </div>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              Kundensicht
            </span>
          </div>

          <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
            <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
              <span>Anfrage wird vorbereitet</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          <div className="min-h-[480px] space-y-3 bg-slate-50/80 p-4 sm:p-6" aria-live="polite">
            <ChatBubble>
              Guten Tag! Ich helfe Ihnen dabei, Ihr Anliegen vollständig an den Betrieb zu
              übermitteln. Worum geht es?
            </ChatBubble>
            <ChatBubble user>{scenario.customerMessage}</ChatBubble>

            {stage >= 1 ? (
              <>
                <ChatBubble>{scenario.detailQuestion}</ChatBubble>
                <ChatBubble user>{scenario.detailAnswer}</ChatBubble>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ChatFact icon={Wrench} label="Leistung" value={scenario.service} />
                  <ChatFact icon={MapPin} label="Einsatzort" value={scenario.location} />
                </div>
              </>
            ) : (
              <QuickChoices values={scenarios.map((item) => item.name)} />
            )}

            {stage >= 2 ? (
              <ChatBubble>
                {scenario.urgencyTone === "critical"
                  ? "Danke. Ich habe den Fall als dringend markiert und das Team sofort informiert."
                  : "Danke. Ihre Anfrage ist vollständig und wurde dem passenden Team zugeordnet."}
              </ChatBubble>
            ) : null}

            {stage >= 3 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                <p className="flex items-center gap-2 font-semibold">
                  <CalendarCheck className="size-5" /> Termin bestätigt
                </p>
                <p className="mt-2 font-medium">{scenario.slot}</p>
                <p className="mt-1 text-xs leading-5 text-emerald-800">
                  Bestätigung und Änderungslink wurden per E-Mail versendet. Keine interne ID wird
                  angezeigt.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">ZunftEcho Dashboard</p>
                <p className="text-xs text-slate-400">Betriebssicht · Live-Simulation</p>
              </div>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-slate-300">
              keine Echtdaten
            </span>
          </div>

          <div className="min-h-[480px] p-4 sm:p-6" aria-live="polite">
            {stage === 0 ? (
              <EmptyDashboard scenario={scenario} />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">Neue Anfrage · {scenario.service}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          scenario.urgencyTone === "critical"
                            ? "bg-orange-400/15 text-orange-300"
                            : "bg-sky-400/15 text-sky-300"
                        }`}
                      >
                        {scenario.urgency}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Vollständigkeit wird live geprüft</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Lead-Score</span>
                    <span className="rounded-lg bg-emerald-400/15 px-2.5 py-1 text-sm font-bold text-emerald-300">
                      {scenario.score}/100
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DataCard icon={Wrench} label="Anliegen" value={scenario.service} />
                  <DataCard icon={MapPin} label="Einsatzort" value={scenario.location} />
                  <DataCard icon={Clock3} label="Priorität" value={scenario.urgency} />
                  <DataCard
                    icon={MessageSquareText}
                    label="Qualifizierung"
                    value="Pflichtangaben vollständig"
                  />
                </div>

                {stage >= 2 ? (
                  <div
                    className={`rounded-2xl border p-4 ${
                      scenario.urgencyTone === "critical"
                        ? "border-orange-400/30 bg-orange-400/10"
                        : "border-sky-400/30 bg-sky-400/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          scenario.urgencyTone === "critical"
                            ? "bg-orange-400/15 text-orange-300"
                            : "bg-sky-400/15 text-sky-300"
                        }`}
                      >
                        {scenario.urgencyTone === "critical" ? (
                          <AlertTriangle className="size-5" />
                        ) : (
                          <BellRing className="size-5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          {scenario.urgencyTone === "critical"
                            ? "Menschliche Übergabe ausgelöst"
                            : "Zuständiges Team informiert"}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-300">
                          Externe E-Mail-Benachrichtigung wurde simuliert. Der Vorgang erscheint
                          zusätzlich unter „Nächste Schritte“.
                        </p>
                        <Button size="sm" className="mt-3">
                          <UserRoundCheck className="size-4" /> Jetzt übernehmen
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {stage >= 3 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OutcomeCard
                      icon={CalendarCheck}
                      title="Termin reserviert"
                      value={scenario.slot}
                    />
                    <OutcomeCard
                      icon={MailCheck}
                      title="Bestätigungen"
                      value="Betrieb und Kunde informiert"
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          Interaktive Simulation · keine API-Aufrufe · keine Speicherung · keine echten
          Benachrichtigungen
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStage((stage - 1) as DemoStage)}
            disabled={stage === 0}
          >
            <ArrowLeft className="size-4" /> Zurück
          </Button>
          {stage < 3 ? (
            <Button type="button" onClick={() => setStage((stage + 1) as DemoStage)}>
              Weiter <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" onClick={reset}>
              <RotateCcw className="size-4" /> Neu starten
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ children, user = false }: { children: ReactNode; user?: boolean }) {
  return (
    <div
      className={`max-w-[90%] rounded-2xl p-3 text-sm leading-6 shadow-sm ${
        user
          ? "ml-auto rounded-tr-md bg-primary text-white"
          : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
      }`}
    >
      {children}
    </div>
  );
}

function QuickChoices({ values }: { values: string[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-600"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

function ChatFact({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function DataCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Icon className="size-4 text-sky-300" /> {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function OutcomeCard({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
        <Icon className="size-4" /> {title}
      </p>
      <p className="mt-2 text-xs leading-5 text-emerald-100/80">{value}</p>
    </div>
  );
}

function EmptyDashboard({ scenario }: { scenario: Scenario }) {
  return (
    <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
        <Bot className="size-7" />
      </span>
      <h2 className="mt-5 text-lg font-semibold">Anfrage wird gerade erfasst</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
        Sobald die wichtigsten Angaben zu „{scenario.name}“ vorliegen, erscheint hier automatisch
        ein qualifizierter Lead.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <span className="size-2 animate-pulse rounded-full bg-sky-400" /> Live-Simulation läuft
      </div>
    </div>
  );
}
