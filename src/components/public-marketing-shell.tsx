import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu } from "lucide-react";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { useCampaignSource } from "@/lib/campaign-source";

type PublicMarketingShellProps = {
  children: ReactNode;
  source: string;
};

export function PublicMarketingShell({ children, source }: PublicMarketingShellProps) {
  const campaignSource = useCampaignSource(source);
  const sourceQuery = `source=${encodeURIComponent(campaignSource)}`;
  const requestHref = `/registrieren?source=${encodeURIComponent(campaignSource)}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="relative mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5" aria-label="ZunftEcho Startseite">
            <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <BrandMark className="size-10" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">ZunftEcho</span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex">
            <a className="shrink-0 hover:text-slate-950" href={`/anfrage-check?${sourceQuery}`}>
              Anfrage-Check
            </a>
            <a className="shrink-0 hover:text-slate-950" href={`/demo?${sourceQuery}`}>
              Live-Demo
            </a>
            <a className="shrink-0 hover:text-slate-950" href={`/wissen?${sourceQuery}`}>
              Wissen
            </a>
            <a className="shrink-0 hover:text-slate-950" href={`/partner?${sourceQuery}`}>
              Partner
            </a>
            <a className="shrink-0 hover:text-slate-950" href={`/preise?${sourceQuery}`}>
              Preise
            </a>
            <a className="shrink-0 hover:text-slate-950" href={`/vertrauen?${sourceQuery}`}>
              Vertrauen
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <a href={requestHref}>
                Pilot anfragen <ArrowRight />
              </a>
            </Button>

            <details className="group relative lg:hidden">
              <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <Menu className="size-5" aria-hidden="true" />
                <span className="sr-only">Navigation öffnen</span>
              </summary>
              <nav className="absolute top-[calc(100%+0.75rem)] right-0 z-50 grid w-[min(19rem,calc(100vw-2.5rem))] gap-1 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 shadow-xl">
                <a
                  className="rounded-lg px-3 py-2.5 hover:bg-slate-50"
                  href={`/anfrage-check?${sourceQuery}`}
                >
                  Anfrage-Check
                </a>
                <a
                  className="rounded-lg px-3 py-2.5 hover:bg-slate-50"
                  href={`/demo?${sourceQuery}`}
                >
                  Live-Demo
                </a>
                <a
                  className="rounded-lg px-3 py-2.5 hover:bg-slate-50"
                  href={`/wissen?${sourceQuery}`}
                >
                  Wissen
                </a>
                <a
                  className="rounded-lg px-3 py-2.5 hover:bg-slate-50"
                  href={`/partner?${sourceQuery}`}
                >
                  Partner
                </a>
                <a
                  className="rounded-lg px-3 py-2.5 hover:bg-slate-50"
                  href={`/preise?${sourceQuery}`}
                >
                  Preise
                </a>
                <a
                  className="rounded-lg px-3 py-2.5 hover:bg-slate-50"
                  href={`/vertrauen?${sourceQuery}`}
                >
                  Vertrauen & Sicherheit
                </a>
                <a
                  className="mt-1 flex items-center justify-between rounded-lg bg-primary px-3 py-2.5 font-semibold text-white sm:hidden"
                  href={requestHref}
                >
                  Pilot anfragen <ArrowRight className="size-4" />
                </a>
              </nav>
            </details>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] lg:px-10">
          <div>
            <div className="flex items-center gap-2.5 text-white">
              <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white">
                <BrandMark className="size-9" />
              </span>
              <span className="font-display text-lg font-semibold">ZunftEcho</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
              Digitale Kundenkommunikation für SHK-Betriebe: Anfragen vollständig aufnehmen,
              priorisieren und vorbereitet ans Team übergeben.
            </p>
          </div>
          <div className="flex flex-wrap content-start gap-x-5 gap-y-3 text-sm">
            <a className="hover:text-white" href={`/anfrage-check?${sourceQuery}`}>
              Anfrage-Check
            </a>
            <a className="hover:text-white" href={`/wissen?${sourceQuery}`}>
              Wissen
            </a>
            <a className="hover:text-white" href={`/partner?${sourceQuery}`}>
              Partner
            </a>
            <a className="hover:text-white" href={`/preise?${sourceQuery}`}>
              Preise
            </a>
            <a className="hover:text-white" href={`/vertrauen?${sourceQuery}`}>
              Vertrauen & Sicherheit
            </a>
            <Link className="hover:text-white" to="/impressum">
              Impressum
            </Link>
            <Link className="hover:text-white" to="/datenschutz">
              Datenschutz
            </Link>
            <Link className="hover:text-white" to="/agb">
              AGB
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
