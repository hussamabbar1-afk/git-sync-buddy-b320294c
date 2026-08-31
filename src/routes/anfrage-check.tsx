import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { Button } from "@/components/ui/button";
import { useCampaignSource } from "@/lib/campaign-source";

type AnswerOption = {
  label: string;
  detail: string;
  score: 0 | 1 | 2;
};

type CheckQuestion = {
  title: string;
  context: string;
  recommendation: string;
  options: AnswerOption[];
};

const questions: CheckQuestion[] = [
  {
    title: "Was passiert außerhalb Ihrer Öffnungszeiten?",
    context: "Viele Website-Anfragen entstehen abends oder am Wochenende.",
    recommendation:
      "Außerhalb der Öffnungszeiten sollte mindestens eine sofortige Bestätigung mit klarer Rückruf-Erwartung erfolgen.",
    options: [
      {
        label: "Nur Nachricht oder verpasster Kontakt",
        detail: "Der Kunde weiß nicht, wann und wie es weitergeht.",
        score: 0,
      },
      {
        label: "Automatische Eingangsbestätigung",
        detail: "Der Eingang wird bestätigt, aber Angaben können fehlen.",
        score: 1,
      },
      {
        label: "Strukturierte Aufnahme rund um die Uhr",
        detail: "Anliegen und nächste Schritte werden direkt geklärt.",
        score: 2,
      },
    ],
  },
  {
    title: "Welche Kontaktdaten erhalten Sie zuverlässig?",
    context: "Ein Rückruf scheitert schon an einer fehlenden oder unklaren Telefonnummer.",
    recommendation:
      "Name, erreichbare Telefonnummer und ein bevorzugter Kontaktweg sollten vor dem Absenden geprüft werden.",
    options: [
      {
        label: "Freitext – der Kunde entscheidet",
        detail: "Kontaktdaten fehlen regelmäßig oder stehen im Nachrichtentext.",
        score: 0,
      },
      {
        label: "Name, E-Mail und Telefon als Felder",
        detail: "Die Basisdaten werden getrennt und verpflichtend erfasst.",
        score: 1,
      },
      {
        label: "Kontaktdaten plus Erreichbarkeit",
        detail: "Zusätzlich ist klar, wann und über welchen Kanal der Kunde erreichbar ist.",
        score: 2,
      },
    ],
  },
  {
    title: "Ist der Einsatzort vor dem Rückruf eindeutig?",
    context: "Postleitzahl und Adresse entscheiden, ob ein Auftrag im Servicegebiet liegt.",
    recommendation:
      "Einsatzadresse und Postleitzahl sollten getrennt erfasst und gegen das Servicegebiet geprüft werden.",
    options: [
      {
        label: "Meist erst im Rückruf",
        detail: "Der Einsatzort wird telefonisch nachgefragt.",
        score: 0,
      },
      {
        label: "Adresse als Formularfeld",
        detail: "Die Adresse liegt vor, wird aber nicht automatisch eingeordnet.",
        score: 1,
      },
      {
        label: "Adresse und Servicegebiet werden geprüft",
        detail: "Der Betrieb sieht sofort, ob der Ort grundsätzlich passt.",
        score: 2,
      },
    ],
  },
  {
    title: "Wie erkennen Sie dringende oder gefährliche Fälle?",
    context:
      "Gasgeruch, Wasseraustritt und andere Gefahren dürfen nicht in einer normalen Warteschlange verschwinden.",
    recommendation:
      "Gefahrenhinweise brauchen sofort sichtbare Sicherheitshinweise und eine definierte menschliche Übergabe.",
    options: [
      {
        label: "Nur durch manuelles Lesen",
        detail: "Die Dringlichkeit fällt erst auf, wenn jemand die Nachricht öffnet.",
        score: 0,
      },
      {
        label: "Der Kunde wählt „dringend“",
        detail: "Eine Kennzeichnung ist möglich, aber nicht plausibilisiert.",
        score: 1,
      },
      {
        label: "Hinweise werden erkannt und eskaliert",
        detail: "Sicherheitshinweis, Priorität und Teamübergabe sind definiert.",
        score: 2,
      },
    ],
  },
  {
    title: "Wie werden Terminwünsche aufgenommen?",
    context: "„Am besten morgens“ ist noch kein planbarer Termin.",
    recommendation:
      "Mindestens Datum, Zeitfenster und Rückrufalternative sollten strukturiert erfasst werden.",
    options: [
      {
        label: "Nur als Freitext",
        detail: "Terminwünsche müssen aus der Nachricht herausgelesen werden.",
        score: 0,
      },
      {
        label: "Datum oder Zeitfenster als Auswahl",
        detail: "Der Wunsch ist strukturiert, aber noch nicht gegen Verfügbarkeit geprüft.",
        score: 1,
      },
      {
        label: "Nur tatsächlich freie Zeitfenster",
        detail: "Auswahl, Bestätigung und Konfliktschutz sind verbunden.",
        score: 2,
      },
    ],
  },
  {
    title: "Kann der Kunde freiwillig ein Foto ergänzen?",
    context: "Ein Bild kann die Vorbereitung erleichtern, darf aber nicht unnötig verlangt werden.",
    recommendation:
      "Ein optionaler, begrenzter Foto-Upload sollte Zweck, Dateigröße und zulässige Inhalte erklären.",
    options: [
      {
        label: "Nein oder nur per separater Nachricht",
        detail: "Bild und Anfrage müssen später manuell zusammengeführt werden.",
        score: 0,
      },
      {
        label: "Upload ohne klare Hinweise",
        detail: "Ein Bild ist möglich, Zweck und Grenzen bleiben aber unklar.",
        score: 1,
      },
      {
        label: "Optional, erklärt und direkt zugeordnet",
        detail: "Das Foto ist begrenzt und mit der richtigen Anfrage verbunden.",
        score: 2,
      },
    ],
  },
  {
    title: "Was erhält der Kunde nach dem Absenden?",
    context: "Ohne Bestätigung entstehen Rückfragen und doppelte Kontaktversuche.",
    recommendation:
      "Die Bestätigung sollte Anliegen, Kontaktdaten und den realistischen nächsten Schritt zusammenfassen.",
    options: [
      {
        label: "Nur „Danke für Ihre Nachricht“",
        detail: "Es bleibt offen, was angekommen ist und wann eine Reaktion folgt.",
        score: 0,
      },
      {
        label: "Bestätigung mit Rückrufhinweis",
        detail: "Der nächste Schritt ist bekannt, aber die Angaben sind nicht zusammengefasst.",
        score: 1,
      },
      {
        label: "Zusammenfassung und klarer nächster Schritt",
        detail: "Der Kunde kann Angaben kontrollieren und weiß, wie es weitergeht.",
        score: 2,
      },
    ],
  },
  {
    title: "Wie landet die Anfrage beim zuständigen Mitarbeiter?",
    context:
      "Ein vollständiger Lead hilft nur, wenn er rechtzeitig bei der richtigen Person ankommt.",
    recommendation:
      "Dringlichkeit, Zuständigkeit, Benachrichtigung und Reaktionsfrist sollten gemeinsam sichtbar sein.",
    options: [
      {
        label: "Gemeinsames Postfach ohne Priorität",
        detail: "Jemand muss Nachrichten manuell lesen und verteilen.",
        score: 0,
      },
      {
        label: "Zentrale Liste mit Status",
        detail: "Anfragen sind sichtbar, Zuständigkeit oder Frist bleiben teilweise manuell.",
        score: 1,
      },
      {
        label: "Priorität, Verantwortlicher und Alarm",
        detail: "Kritische Fälle werden außerhalb des Dashboards aktiv gemeldet.",
        score: 2,
      },
    ],
  },
];

const maxScore = questions.length * 2;

export const Route = createFileRoute("/anfrage-check")({
  head: () => ({
    meta: [
      { title: "Kostenloser Website-Anfrage-Check für SHK-Betriebe – ZunftEcho" },
      {
        name: "description",
        content:
          "Prüfen Sie in zwei Minuten, wie vollständig und planbar Kundenanfragen über Ihre SHK-Website ankommen. Anonym und ohne Datenspeicherung.",
      },
      { property: "og:title", content: "Wie gut nimmt Ihre SHK-Website Anfragen auf?" },
      {
        property: "og:description",
        content: "Kostenloser Zwei-Minuten-Check mit konkreten Verbesserungsvorschlägen.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zunftecho.de/anfrage-check" },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/anfrage-check" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "ZunftEcho Website-Anfrage-Check",
          url: "https://zunftecho.de/anfrage-check",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: "de-DE",
          isAccessibleForFree: true,
          description:
            "Interaktiver Selbstcheck für die Qualität der digitalen Anfrageaufnahme in SHK-Betrieben.",
        }),
      },
    ],
  }),
  component: AnfrageCheck,
});

function getResult(score: number) {
  if (score <= 5) {
    return {
      label: "Deutliches Verbesserungspotenzial",
      color: "text-orange-700",
      background: "bg-orange-50 ring-orange-200",
      text: "Viele Angaben müssen vermutlich erst im Rückruf geklärt werden. Beginnen Sie mit Kontaktdaten, Einsatzort und Dringlichkeit.",
    };
  }
  if (score <= 10) {
    return {
      label: "Solide Grundlage mit Lücken",
      color: "text-amber-700",
      background: "bg-amber-50 ring-amber-200",
      text: "Die Basis funktioniert, aber einzelne Medienbrüche oder fehlende Angaben verursachen noch vermeidbare Rückfragen.",
    };
  }
  if (score <= 13) {
    return {
      label: "Gut vorbereitet",
      color: "text-sky-700",
      background: "bg-sky-50 ring-sky-200",
      text: "Ihre Anfrageaufnahme ist bereits strukturiert. Mit klareren Übergaben und Bestätigungen lässt sich der Ablauf weiter beruhigen.",
    };
  }
  return {
    label: "Sehr stark aufgestellt",
    color: "text-emerald-700",
    background: "bg-emerald-50 ring-emerald-200",
    text: "Ihre Website deckt die wichtigsten Schritte bereits ab. Prüfen Sie regelmäßig Mobilansicht, Eskalationen und tatsächliche Teamreaktionen.",
  };
}

function AnfrageCheck() {
  const campaignSource = useCampaignSource("anfrage-check");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() => questions.map(() => null));
  const [shareLabel, setShareLabel] = useState("Ergebnis teilen");
  const complete = step >= questions.length;
  const currentQuestion = questions[Math.min(step, questions.length - 1)]!;
  const score = answers.reduce<number>((total, answer) => total + (answer ?? 0), 0);
  const progress = complete ? 100 : Math.round((step / questions.length) * 100);
  const result = getResult(score);
  const resultSource = `${campaignSource.slice(0, 70)}-s${score}`;

  const priorities = useMemo(
    () =>
      questions
        .map((question, index) => ({ ...question, score: answers[index] ?? 0 }))
        .filter((question) => question.score < 2)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3),
    [answers],
  );

  function choose(scoreValue: number) {
    setAnswers((current) => current.map((value, index) => (index === step ? scoreValue : value)));
  }

  function restart() {
    setAnswers(questions.map(() => null));
    setStep(0);
  }

  async function shareResult() {
    const shareText = `Mein Website-Anfrage-Check: ${score}/${maxScore} Punkte – ${result.label}.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "ZunftEcho Website-Anfrage-Check",
          text: shareText,
          url: window.location.href,
        });
        setShareLabel("Geteilt");
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
        setShareLabel("In die Zwischenablage kopiert");
      }
    } catch {
      setShareLabel("Teilen nicht möglich");
    }
  }

  return (
    <PublicMarketingShell source="anfrage-check">
      <main>
        <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#dff3ff_0,transparent_38%),linear-gradient(145deg,#f8fbff_0%,#fffaf3_100%)]">
          <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
            <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
              Kostenloser Zwei-Minuten-Check
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Wie gut nimmt Ihre Website Kundenanfragen auf?
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Acht konkrete Fragen zeigen, wo Ihrem SHK-Betrieb Angaben fehlen und welche drei
              Verbesserungen zuerst sinnvoll sind.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" /> Keine Anmeldung
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" /> Keine Speicherung Ihrer
                Antworten
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm font-medium text-slate-600">
              <span>{complete ? "Auswertung" : `Frage ${step + 1} von ${questions.length}`}</span>
              <span>{progress} %</span>
            </div>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {!complete ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
              <p className="text-sm leading-6 text-slate-500">{currentQuestion.context}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {currentQuestion.title}
              </h2>
              <div className="mt-8 grid gap-3">
                {currentQuestion.options.map((option) => {
                  const selected = answers[step] === option.score;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => choose(option.score)}
                      className={`rounded-2xl border p-5 text-left transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                        selected
                          ? "border-primary bg-sky-50 shadow-sm"
                          : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-primary bg-primary text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          <CheckCircle2 className="size-4" />
                        </span>
                        <span>
                          <span className="block font-semibold text-slate-950">{option.label}</span>
                          <span className="mt-1 block text-sm leading-6 text-slate-600">
                            {option.detail}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={step === 0}
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                >
                  <ArrowLeft /> Zurück
                </Button>
                <Button
                  type="button"
                  disabled={answers[step] === null}
                  onClick={() => setStep((current) => current + 1)}
                >
                  {step === questions.length - 1 ? "Auswertung anzeigen" : "Weiter"}
                  <ArrowRight />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              <div className={`rounded-3xl p-7 ring-1 sm:p-9 ${result.background}`}>
                <p className={`text-sm font-semibold uppercase ${result.color}`}>Ihr Ergebnis</p>
                <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-2">
                  <p className="text-5xl font-semibold tracking-tight text-slate-950">
                    {score}/{maxScore}
                  </p>
                  <h2 className="pb-1 text-2xl font-semibold text-slate-950">{result.label}</h2>
                </div>
                <p className="mt-5 max-w-3xl leading-7 text-slate-700">{result.text}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="size-6 text-primary" />
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Ihre nächsten drei Verbesserungen
                  </h2>
                </div>
                {priorities.length ? (
                  <ol className="mt-6 space-y-4">
                    {priorities.map((priority, index) => (
                      <li key={priority.title} className="flex gap-4 rounded-2xl bg-slate-50 p-5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold text-slate-950">{priority.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {priority.recommendation}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-6 rounded-2xl bg-emerald-50 p-5 leading-7 text-emerald-900">
                    Alle Kernbereiche sind abgedeckt. Testen Sie den Ablauf jetzt regelmäßig mit
                    echten mobilen Endgeräten und typischen Kundenfällen.
                  </p>
                )}
              </div>

              <div className="rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
                <h2 className="text-2xl font-semibold">Den vollständigen Ablauf vergleichen?</h2>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                  Die ZunftEcho-Demo zeigt Aufnahme, Dringlichkeit, Übergabe und Terminwunsch ohne
                  Anmeldung und ohne Produktionsdaten.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="secondary" size="lg">
                    <a href={`/demo?source=${encodeURIComponent(resultSource)}`}>
                      Live-Demo öffnen <ArrowRight />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-slate-600 bg-transparent text-white hover:bg-slate-800 hover:text-white"
                  >
                    <a href={`/registrieren?source=${encodeURIComponent(resultSource)}`}>
                      Pilot anfragen
                    </a>
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={shareResult}
                  >
                    <Share2 /> {shareLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                    onClick={restart}
                  >
                    <RefreshCw /> Check wiederholen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </PublicMarketingShell>
  );
}
