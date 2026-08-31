import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck2,
  HeartHandshake,
  LockKeyhole,
  MessagesSquare,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { Button } from "@/components/ui/button";
import { useCampaignSource } from "@/lib/campaign-source";

export const Route = createFileRoute("/vertrauen")({
  head: () => ({
    meta: [
      { title: "Vertrauen & Sicherheit – ZunftEcho" },
      {
        name: "description",
        content:
          "Prüfbare Zusagen, klare KI-Grenzen, Datenschutzinformationen und ein Pilot ohne automatische Verlängerung: So schafft ZunftEcho Vertrauen ohne erfundene Referenzen.",
      },
      { property: "og:title", content: "Vertrauen entsteht durch überprüfbare Zusagen" },
      {
        property: "og:description",
        content:
          "Live-Demo, klarer Pilot, dokumentierte Grenzen und transparente Datenverarbeitung bei ZunftEcho.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zunftecho.de/vertrauen" },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/vertrauen" }],
  }),
  component: TrustPage,
});

const promises = [
  {
    icon: Eye,
    title: "Vorher selbst prüfen",
    text: "Die Live-Demo zeigt den Anfrageablauf ohne Anmeldung. Preise, Leistungsumfang und Grenzen stehen öffentlich auf der Website.",
  },
  {
    icon: RefreshCw,
    title: "Kein stilles Abonnement",
    text: "Der 30-Tage-Pilot endet automatisch. Der Monatsbetrieb startet nur nach einer neuen, ausdrücklichen Entscheidung.",
  },
  {
    icon: HeartHandshake,
    title: "Persönlich statt anonym",
    text: "Einrichtung, Funktionstest und Auswertung erfolgen gemeinsam mit dem Betrieb – mit einem festen Ansprechpartner.",
  },
  {
    icon: BadgeCheck,
    title: "Keine erfundenen Referenzen",
    text: "Wir veröffentlichen Namen, Logos, Aussagen oder Ergebnisse erst nach einem echten Einsatz und einer ausdrücklichen Freigabe.",
  },
];

const verificationLinks = [
  {
    title: "Anfrageablauf testen",
    text: "Erleben Sie selbst, welche Fragen gestellt und wie dringende Fälle übergeben werden.",
    label: "Live-Demo öffnen",
    to: "/demo" as const,
  },
  {
    title: "Kosten und Bindung prüfen",
    text: "Pilotpreis, Monatsbetrieb und der fehlende automatische Übergang sind öffentlich dokumentiert.",
    label: "Preise ansehen",
    to: "/preise" as const,
  },
  {
    title: "Datenwege nachvollziehen",
    text: "Die eingesetzten Dienstleister, Zwecke, Speicherfristen und Betroffenenrechte sind benannt.",
    label: "Datenschutz lesen",
    to: "/datenschutz" as const,
  },
  {
    title: "Anbieter prüfen",
    text: "Die gesetzlich erforderlichen Angaben und ein direkter elektronischer Kontakt sind erreichbar.",
    label: "Impressum öffnen",
    to: "/impressum" as const,
  },
];

const aiBoundaries = [
  ["Anliegen strukturiert aufnehmen", "Ja", "Problem, Kontaktdaten, Einsatzort und Terminwunsch"],
  ["Gefahrenhinweise erkennen", "Ja", "Sicherheitshinweis und priorisierte menschliche Übergabe"],
  ["Verbindlichen Preis versprechen", "Nein", "Entscheidung und Angebot bleiben beim Betrieb"],
  ["Ungeprüft einen Termin zusagen", "Nein", "Terminwunsch und bestätigter Termin werden getrennt"],
  ["Einen Menschen ersetzen", "Nein", "Übergabe, Antwort und Übernahme bleiben sichtbar steuerbar"],
];

const safeguards = [
  "Betriebsbezogene Zugriffsregeln statt eines gemeinsamen offenen Datenbestands",
  "Nicht öffentliche Speicherung hochgeladener Bilder mit Größen- und Mengenbegrenzung",
  "Menschliche Übergaben, kritische Benachrichtigungen und nachvollziehbare Änderungsprotokolle",
  "Technische Zustandsprüfungen und dokumentierte Reaktion auf wiederholte Fehler",
  "Benannte Auftragsverarbeiter und verständliche Informationen in den Datenschutzhinweisen",
];

function TrustPage() {
  const campaignSource = useCampaignSource("trust-center");

  return (
    <PublicMarketingShell source="trust-center">
      <main>
        <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,#dff4ff_0,transparent_34%),linear-gradient(145deg,#f8fbff_0%,#ffffff_55%,#fff8ed_100%)]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-10">
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
                Vertrauen & Sicherheit
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
                Ein neues Produkt muss mehr zeigen – nicht mehr behaupten.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                ZunftEcho startet bewusst mit einer kleinen Pilotgruppe. Deshalb ersetzen wir eine
                große Referenzwand durch überprüfbare Abläufe, klare Grenzen und ein Angebot, bei
                dem der Betrieb die Kontrolle behält.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <a href={`/demo?source=${encodeURIComponent(campaignSource)}`}>
                    Ohne Anmeldung prüfen <ArrowRight />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/preise">Pilotbedingungen ansehen</Link>
                </Button>
              </div>
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,.7)] sm:p-9">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <ShieldCheck className="size-6" />
                </span>
                <div>
                  <p className="font-semibold">Kontrollierter Einführungspilot</p>
                  <p className="text-sm text-slate-400">Maximal fünf Betriebe gleichzeitig</p>
                </div>
              </div>
              <div className="mt-7 space-y-4 text-sm leading-6 text-slate-300">
                {[
                  "30 Tage für einmalig 99 € netto",
                  "Persönliche Einrichtung und Funktionstest enthalten",
                  "Endet automatisch – kein stiller Übergang",
                  "Fortsetzung nur nach ausdrücklicher Zustimmung",
                ].map((item) => (
                  <p key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" /> {item}
                  </p>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary">Unsere vier Vertrauenszusagen</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Risiko reduzieren, bevor Sie sich entscheiden
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {promises.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <Icon className="size-7 text-primary" />
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">Direkt überprüfbar</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Vier Belege, für die Sie uns nicht glauben müssen
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {verificationLinks.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                  <Link
                    to={item.to}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    {item.label} <ArrowRight className="size-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-primary">KI mit klaren Grenzen</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Automatisieren, ohne Verantwortung zu verstecken
              </h2>
              <p className="mt-5 leading-7 text-slate-600">
                Die digitale Assistentin unterstützt den ersten Kontakt. Preise, fachliche Zusagen
                und die Übernahme kritischer Fälle bleiben beim Betrieb und seinem Team.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="hidden grid-cols-[1fr_80px_1.25fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase sm:grid">
                <span>Aufgabe</span>
                <span>Status</span>
                <span>Grenze</span>
              </div>
              {aiBoundaries.map(([task, status, boundary]) => (
                <div
                  key={task}
                  className="grid gap-2 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[1fr_80px_1.25fr] sm:gap-4"
                >
                  <p className="font-medium text-slate-950">{task}</p>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                      status === "Ja"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {status}
                  </span>
                  <p className="text-sm leading-6 text-slate-600">{boundary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:px-10">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
                <LockKeyhole className="size-6" />
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight">Daten und Betrieb</h2>
              <p className="mt-4 leading-7 text-slate-300">
                Datenschutz ist kein Gütesiegel auf dieser Seite. Entscheidend sind dokumentierte
                Datenwege, begrenzte Zugriffe und ein klarer Prozess für Fragen oder Löschung.
              </p>
              <Link
                to="/datenschutz"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
              >
                Vollständige Datenschutzhinweise <ArrowRight className="size-4" />
              </Link>
            </div>
            <ul className="space-y-4">
              {safeguards.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200"
                >
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
              <FileCheck2 className="size-8 text-primary" />
              <p className="mt-5 text-sm font-semibold text-primary">Technischer Prüfstand</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Zuletzt geprüft: 31.08.2026
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Produktions-Build ohne Fehler",
                  "Öffentliche Kernseiten erreichbar",
                  "Demo-Quelle bis zur Anfrage erhalten",
                  "Keine alte Projektmarke öffentlich",
                ].map((item) => (
                  <p
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-6 text-slate-700"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {item}
                  </p>
                ))}
              </div>
              <p className="mt-6 text-xs leading-5 text-slate-500">
                Dies ist ein dokumentierter Funktions- und Markencheck, keine unabhängige
                Zertifizierung und kein Penetrationstest.
              </p>
            </div>

            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-7 sm:p-9">
              <MessagesSquare className="size-8 text-orange-700" />
              <p className="mt-5 text-sm font-semibold text-orange-800">
                Referenzen entstehen erst
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Der erste echte Beleg wird messbar
              </h2>
              <p className="mt-4 leading-7 text-slate-700">
                Vor dem Pilot werden Erfolgskriterien festgelegt: Vollständigkeit der Anfragen, Zeit
                bis zur Übergabe und vermiedene Rückfragen. Nach 30 Tagen erhält der Betrieb eine
                ehrliche Auswertung – unabhängig davon, ob er fortsetzt.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:px-10">
            <div>
              <p className="text-sm font-semibold text-primary">Sie behalten die Entscheidung</p>
              <h2 className="mt-2 text-3xl font-semibold">
                Erst prüfen, dann persönlich sprechen.
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Die Anfrage ist unverbindlich. Wir klären zuerst, ob ZunftEcho zum Betrieb passt und
                halten den vereinbarten Pilotumfang schriftlich fest.
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <a href={`/registrieren?source=${encodeURIComponent(campaignSource)}`}>
                Pilot unverbindlich anfragen <ArrowRight />
              </a>
            </Button>
          </div>
        </section>
      </main>
    </PublicMarketingShell>
  );
}
