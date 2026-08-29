import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  ClipboardCheck,
  Clock3,
  MessageSquareText,
  SearchCheck,
  Wrench,
} from "lucide-react";

import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { Button } from "@/components/ui/button";
import { useCampaignSource } from "@/lib/campaign-source";

const guides = [
  {
    to: "/anfrage-check" as const,
    icon: SearchCheck,
    label: "Kostenloses Werkzeug",
    title: "Website-Anfrage-Check für SHK-Betriebe",
    description:
      "Acht Fragen, eine sofortige Auswertung und drei konkrete Verbesserungen – anonym und ohne Anmeldung.",
  },
  {
    to: "/shk-anfragen-automatisieren" as const,
    icon: ClipboardCheck,
    label: "Praxisleitfaden",
    title: "SHK-Anfragen automatisieren, ohne die persönliche Kontrolle zu verlieren",
    description:
      "Ein klarer Ablauf für Problem, Kontaktdaten, Einsatzort, Dringlichkeit und Terminwunsch.",
  },
  {
    to: "/chatbot-fuer-handwerksbetriebe" as const,
    icon: Bot,
    label: "Entscheidungshilfe",
    title: "Chatbot für Handwerksbetriebe: Was er können muss – und was nicht",
    description:
      "Qualifizierung, Notfälle, Übergaben und Datenschutz aus Sicht eines Handwerksbetriebs.",
  },
  {
    to: "/kontaktformular-oder-chatbot" as const,
    icon: MessageSquareText,
    label: "Vergleich",
    title: "Kontaktformular oder Chatbot: Was passt zum Betrieb?",
    description:
      "Eine praktische Entscheidungshilfe für Mobilansicht, Dringlichkeit, Übergabe und Bestätigung.",
  },
];

const principles = [
  {
    icon: Clock3,
    title: "Zeit sparen",
    text: "Fehlende Angaben werden vor dem Rückruf strukturiert erfasst.",
  },
  {
    icon: Wrench,
    title: "Für SHK gedacht",
    text: "Leistungen, Gebiete und Dringlichkeit bilden den Betriebsalltag ab.",
  },
  {
    icon: ClipboardCheck,
    title: "Kontrolle behalten",
    text: "Menschen übernehmen, sobald Gefahr, Ärger oder Sonderfälle auftreten.",
  },
];

export const Route = createFileRoute("/wissen")({
  head: () => ({
    meta: [
      { title: "Praxiswissen zu digitalen Kundenanfragen im SHK-Handwerk – ZunftEcho" },
      {
        name: "description",
        content:
          "Praxisleitfäden für SHK-Betriebe: Website-Anfragen strukturieren, Chatbots bewerten und Kunden schneller vorbereitet zurückrufen.",
      },
      { property: "og:title", content: "ZunftEcho Wissen für SHK-Betriebe" },
      {
        property: "og:description",
        content:
          "Konkrete Leitfäden statt KI-Schlagworte: Anfragen, Übergaben und Termine im SHK-Alltag.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zunftecho.de/wissen" },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/wissen" }],
  }),
  component: KnowledgeHub,
});

function KnowledgeHub() {
  const campaignSource = useCampaignSource("wissen-hub");

  return (
    <PublicMarketingShell source="wissen-hub">
      <main>
        <section className="bg-[radial-gradient(circle_at_top_left,#dff3ff_0,transparent_36%),linear-gradient(145deg,#f8fbff_0%,#fffaf3_100%)]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
                ZunftEcho Wissen
              </p>
              <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
                Weniger Rückfragen. Besser vorbereitete Aufträge.
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Praktische Leitfäden für SHK-Betriebe, die digitale Kundenanfragen verbessern wollen
                – ohne Marketingfloskeln und ohne den persönlichen Kontakt abzugeben.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide) => (
              <a
                key={guide.to}
                href={`${guide.to}?source=${encodeURIComponent(campaignSource)}`}
                className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-primary">
                  <guide.icon className="size-6" />
                </span>
                <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                  {guide.label}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{guide.title}</h2>
                <p className="mt-4 leading-7 text-slate-600">{guide.description}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                  Leitfaden lesen{" "}
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 md:grid-cols-3 lg:px-10">
            {principles.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <item.icon className="size-6 text-primary" />
                <h2 className="mt-4 font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight">Den Ablauf lieber direkt sehen?</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Die ZunftEcho-Demo zeigt Kundenanfrage, Qualifizierung, Team-Alarm und Terminbestätigung
            in wenigen Minuten – ohne Anmeldung.
          </p>
          <Button asChild size="lg" className="mt-7">
            <a href={`/demo?source=${encodeURIComponent(campaignSource)}`}>
              Interaktive Demo öffnen <ArrowRight />
            </a>
          </Button>
        </section>
      </main>
    </PublicMarketingShell>
  );
}
