import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum – ZunftEcho" },
      { name: "description", content: "Anbieterkennzeichnung und Kontakt von ZunftEcho." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: ImpressumPage,
});

function ImpressumPage() {
  return (
    <div className="ze-auth-surface min-h-screen text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/86 backdrop-blur-xl">
        <div className="h-0.5 bg-gradient-to-r from-primary via-sky-400 to-amber-400" />
        <div className="mx-auto flex h-[4.5rem] max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="ze-mark-shell flex size-10 items-center justify-center bg-white">
              <BrandMark className="size-10" />
            </span>
            <span className="font-display text-lg font-semibold">ZunftEcho</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="size-4" /> Startseite
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <article className="rounded-3xl border border-white/90 bg-white/90 p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:p-10">
          <p className="ze-kicker">Rechtliches</p>
          <h1 className="mt-3 font-display text-4xl font-semibold">Impressum</h1>
          <p className="mt-3 text-sm text-slate-500">Angaben gemäß § 5 DDG</p>

          <div className="mt-10 space-y-8 leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-950">Diensteanbieter</h2>
              <p className="mt-3">
                Mohamad Hosam Alabar
                <br />
                handelnd unter ZunftEcho
                <br />
                Coloniaallee 34
                <br />
                12524 Berlin
                <br />
                Deutschland
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">Kontakt</h2>
              <p className="mt-3">
                E-Mail:{" "}
                <a
                  className="font-medium text-primary hover:underline"
                  href="mailto:kontakt@zunftecho.de"
                >
                  kontakt@zunftecho.de
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">Verantwortlich für Inhalte</h2>
              <p className="mt-3">
                Verantwortlich nach § 18 Abs. 2 MStV: Mohamad Hosam Alabar, Anschrift wie oben.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">Verbraucherstreitbeilegung</h2>
              <p className="mt-3">
                Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
