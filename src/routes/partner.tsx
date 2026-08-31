import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Handshake,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";

import { PublicMarketingShell } from "@/components/public-marketing-shell";
import { Button } from "@/components/ui/button";
import { useCampaignSource } from "@/lib/campaign-source";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "ZunftEcho für Webagenturen und Digitalisierungspartner im Handwerk" },
      {
        name: "description",
        content:
          "ZunftEcho ergänzt SHK-Websites um strukturierte Kundenanfragen, menschliche Übergaben und Terminwünsche. Informationen für Webagenturen und Digitalisierungspartner.",
      },
      { property: "og:title", content: "Gemeinsam bessere SHK-Websites bauen – ZunftEcho Partner" },
      {
        property: "og:description",
        content:
          "Eine nachvollziehbare Erweiterung für Kundenanfragen auf SHK-Websites – ohne Neuaufbau der Kundenseite.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zunftecho.de/partner" },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/partner" }],
  }),
  component: PartnerPage,
});

function PartnerPage() {
  const campaignSource = useCampaignSource("partner-page");

  return (
    <PublicMarketingShell source="partner-page">
      <main>
        <section className="bg-[radial-gradient(circle_at_top_right,#fee8d4_0,transparent_36%),linear-gradient(145deg,#f8fbff_0%,#ffffff_100%)]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10">
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
                Für Webagenturen und Digitalisierungspartner
              </p>
              <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">
                Aus einer guten SHK-Website wird ein verlässlicher Anfragekanal.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                ZunftEcho lässt sich in bestehende Websites einbauen und erfasst die Angaben, die
                dem Betrieb nach einem normalen Kontaktformular oft fehlen. Die Agentur behält die
                Website – der Betrieb erhält einen klaren Anfrageprozess.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <a href={`/demo?source=${encodeURIComponent(campaignSource)}`}>
                    Partner-Demo öffnen <ArrowRight />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={`/registrieren?source=${encodeURIComponent(campaignSource)}`}>
                    Pilot für Kundenbetrieb anfragen
                  </a>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_28px_70px_-38px_rgba(15,23,42,.45)]">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-primary">
                  <Handshake className="size-6" />
                </span>
                <div>
                  <p className="font-semibold">Klare Rollen</p>
                  <p className="text-sm text-slate-500">Website bleibt bei der Agentur</p>
                </div>
              </div>
              <div className="mt-7 space-y-4">
                {[
                  "Einbau per Script statt Website-Neubau",
                  "Persönliche Einrichtung mit dem SHK-Betrieb",
                  "Testbarer Demo-Ablauf ohne Kundendaten",
                  "Keine White-Label- oder Provisionszusage ohne separate Vereinbarung",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm leading-6 text-slate-700"
                  >
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Was Partner konkret erhalten</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Ein Produkt, das sich live erklären lässt
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: MonitorSmartphone,
                title: "Teilbare Live-Demo",
                text: "Der gesamte Ablauf ist ohne Anmeldung auf Mobilgerät und Desktop nachvollziehbar.",
              },
              {
                icon: Code2,
                title: "Einfacher Einbau",
                text: "WordPress, Wix, Webflow, Jimdo oder HTML benötigen nur einen kleinen Embed-Schritt.",
              },
              {
                icon: ShieldCheck,
                title: "Saubere Grenzen",
                text: "Sicherheit, Datenschutz, Übergabe und Buchung werden nicht als bloße KI-Prompts behandelt.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 p-6">
                <item.icon className="size-7 text-primary" />
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                So läuft ein gemeinsamer Pilot
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Der Kundenbetrieb entscheidet selbst. Eine Empfehlung des Partners löst weder einen
                Auftrag noch eine Zahlung aus.
              </p>
            </div>
            <ol className="space-y-5">
              {[
                "Partner zeigt die neutrale Demo oder teilt den Link.",
                "ZunftEcho prüft den Anwendungsfall in einem kurzen Gespräch.",
                "Der Betrieb bestätigt den 30-Tage-Pilot ausdrücklich.",
                "ZunftEcho richtet den Ablauf ein; die Agentur setzt auf Wunsch das Script ein.",
                "Nach 30 Tagen entscheidet der Betrieb bewusst über die Fortsetzung.",
              ].map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight">
            Ein passender SHK-Kunde im Bestand?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Zeigen Sie zuerst die Demo. Erst wenn der Betrieb Interesse bestätigt, werden
            Kontaktdaten und konkrete Einrichtung besprochen.
          </p>
          <Button asChild size="lg" className="mt-7">
            <a href={`/demo?source=${encodeURIComponent(`${campaignSource}-bottom`.slice(0, 80))}`}>
              Demo für Kundengespräch öffnen <ArrowRight />
            </a>
          </Button>
        </section>
      </main>
    </PublicMarketingShell>
  );
}
