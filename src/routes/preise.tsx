import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/preise")({
  head: () => ({
    meta: [
      { title: "Preise – ZunftEcho" },
      {
        name: "description",
        content:
          "Transparente Preise für den ZunftEcho-Pilot und den anschließenden Monatsbetrieb.",
      },
      { property: "og:title", content: "ZunftEcho Preise" },
      {
        property: "og:description",
        content: "30-Tage-Pilot für 99 € netto, danach 149 € netto pro Monat.",
      },
      { property: "og:url", content: "https://zunftecho.de/preise" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/preise" }],
  }),
  component: PricingPage,
});

const sharedFeatures = [
  "KI-Website-Assistent für Ihren Betrieb",
  "Lead-Erfassung und Qualifizierung",
  "Terminvorbereitung und menschliche Übergaben",
  "E-Mail-Alarme für kritische Vorgänge",
  "Dashboard, Analytics und Teamzugang",
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_55%,#fff8ed_100%)] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BrandMark className="size-9" />
            </span>
            <span className="font-display text-lg font-semibold">ZunftEcho</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/login">Anmelden</Link>
            </Button>
            <Button asChild>
              <Link to="/registrieren">Pilot anfragen</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Klare Preise</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
            Erst im Betrieb beweisen, dann monatlich weiterführen.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Keine Jahresbindung. Der Pilot wird persönlich eingerichtet und kann danach bewusst in
            den Regelbetrieb übernommen werden.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border-2 border-primary bg-white p-7 shadow-xl shadow-primary/10 sm:p-9">
            <p className="text-sm font-semibold text-primary">30-Tage-Pilot</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-5xl font-semibold">99 €</span>
              <span className="pb-1 text-sm text-slate-500">netto · einmalig</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Persönliche Einrichtung, technischer Funktionstest und ein Optimierungstermin sind
              enthalten.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-slate-700">
              {[
                "Alle Kernfunktionen",
                "Persönliche Einrichtung",
                "Kein automatischer Übergang",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {item}
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-8 w-full" asChild>
              <Link to="/registrieren" search={{ source: "pricing-pilot" } as never}>
                Pilot unverbindlich anfragen <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white shadow-xl sm:p-9">
            <p className="text-sm font-semibold text-sky-300">Regelbetrieb</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-5xl font-semibold">149 €</span>
              <span className="pb-1 text-sm text-slate-400">netto · pro Monat</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Monatlich kündbar. Aktivierung erst nach erfolgreichem Pilot und ausdrücklicher
              Zustimmung.
            </p>
            <ul className="mt-7 space-y-3 text-sm text-slate-200">
              {sharedFeatures.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" /> {item}
                </li>
              ))}
            </ul>
            <Button size="lg" variant="secondary" className="mt-8 w-full" asChild>
              <Link to="/registrieren" search={{ source: "pricing-monthly" } as never}>
                Einstieg besprechen <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>
        </div>

        <div className="mx-auto mt-10 flex max-w-4xl items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          Alle Preise verstehen sich zuzüglich gesetzlicher Umsatzsteuer, sofern diese anfällt.
          Zahlungsdaten werden erst beim verbindlichen Auftrag erfasst.
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-7 text-center text-sm text-slate-500">
        <Link to="/impressum" className="hover:text-slate-950">
          Impressum
        </Link>
        <span className="mx-3">·</span>
        <Link to="/datenschutz" className="hover:text-slate-950">
          Datenschutz
        </Link>
        <span className="mx-3">·</span>
        <Link to="/agb" className="hover:text-slate-950">
          AGB
        </Link>
      </footer>
    </div>
  );
}
