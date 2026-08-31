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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BrandMark className="size-9" />
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
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="font-display text-4xl font-semibold">Impressum</h1>
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
