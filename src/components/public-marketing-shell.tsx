import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
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
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5" aria-label="ZunftEcho Startseite">
            <span className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <BrandMark className="size-10" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">ZunftEcho</span>
          </Link>

          <nav className="order-3 flex w-full items-center gap-4 overflow-x-auto pb-1 text-sm font-medium text-slate-600 sm:order-2 sm:w-auto sm:pb-0">
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
          </nav>

          <Button asChild size="sm" className="order-2 sm:order-3">
            <a href={requestHref}>
              Pilot anfragen <ArrowRight />
            </a>
          </Button>
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
            <a className="hover:text-white" href={`/wissen?${sourceQuery}`}>
              Wissen
            </a>
            <a className="hover:text-white" href={`/partner?${sourceQuery}`}>
              Partner
            </a>
            <a className="hover:text-white" href={`/preise?${sourceQuery}`}>
              Preise
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
