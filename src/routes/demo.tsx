import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { SalesFlowDemo } from "@/components/sales-flow-demo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Live-Demo – ZunftEcho" },
      {
        name: "description",
        content:
          "Erleben Sie interaktiv, wie ZunftEcho eine Website-Anfrage qualifiziert, das Team informiert und einen Termin bestätigt.",
      },
      { property: "og:title", content: "ZunftEcho Live-Demo" },
      {
        property: "og:description",
        content:
          "Vom ersten Kundensatz bis zum vollständigen Lead – kostenlos und ohne Anmeldung testen.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zunftecho.de/demo" },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/demo" }],
  }),
  component: DemoPage,
});

function DemoPage() {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const rawSource = search["source"];
  const source =
    typeof rawSource === "string"
      ? rawSource.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || undefined
      : undefined;
  const registrationSource = source ?? "live-demo";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_52%,#fff8ed_100%)] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5" aria-label="ZunftEcho Startseite">
            <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <BrandMark className="size-10" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">ZunftEcho</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/preise">Preise</Link>
            </Button>
            <Button asChild>
              <Link to="/registrieren" search={{ source: registrationSource } as never}>
                Pilot anfragen <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Interaktive Live-Demo
              </p>
              <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
                Eine Anfrage. Vollständig qualifiziert. Sofort im Betrieb.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Klicken Sie sich durch einen realistischen Ablauf – von der ersten Nachricht über
                die dringende Übergabe bis zur Terminbestätigung. Ohne Anmeldung und ohne
                Datenspeicherung.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Drei reale SHK-Szenarien
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Kunden- und Betriebssicht
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" /> Keine Echtdaten
                </span>
              </div>
            </div>

            <div className="mt-10 sm:mt-12">
              <SalesFlowDemo />
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-5 py-14 text-white sm:px-8 sm:py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <p className="text-sm font-semibold text-sky-300">Bereit für Ihren eigenen Ablauf?</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
              30 Tage im eigenen Betrieb erproben.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Wir richten Leistungen, Einsatzgebiete, Öffnungszeiten und die Assistentin passend zu
              Ihrem Betrieb ein. Kein Jahresvertrag und kein automatischer Übergang.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link to="/registrieren" search={{ source: registrationSource } as never}>
                Pilot unverbindlich anfragen <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
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
