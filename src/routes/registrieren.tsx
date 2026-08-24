import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bot, Check, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const PILOT_EMAIL = "hussamabbar4@gmail.com";

type PilotRequestResponse = {
  ok?: boolean;
  message?: string;
};

type RequestState = "idle" | "submitting" | "success" | "error";

export const Route = createFileRoute("/registrieren")({
  head: () => ({
    meta: [
      { title: "30-Tage-Pilot anfragen – ZunftEcho" },
      {
        name: "description",
        content:
          "Fragen Sie den persönlich eingerichteten 30-Tage-Pilot von ZunftEcho für Ihren SHK-Betrieb an.",
      },
      { property: "og:title", content: "ZunftEcho Pilot anfragen" },
      {
        property: "og:description",
        content: "30 Tage, 99 € netto inklusive persönlicher Einrichtung, ohne Jahresvertrag.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zunftecho.de/registrieren" },
      { property: "og:locale", content: "de_DE" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/registrieren" }],
  }),
  component: PilotRequestPage,
});

function PilotRequestPage() {
  const [requestState, setRequestState] = useState<RequestState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const requestSource = new URLSearchParams(window.location.search).get("source")?.trim() ?? "";

    setRequestState("submitting");

    try {
      const { data, error } = await supabase.functions.invoke<PilotRequestResponse>(
        "pilot-request",
        {
          body: {
            company: value("company"),
            contact: value("contact"),
            email: value("email"),
            phone: value("phone"),
            website: value("website"),
            message: value("message"),
            fax: value("fax"),
            source: /^[a-z0-9][a-z0-9:-]{0,79}$/i.test(requestSource)
              ? requestSource.toLowerCase()
              : "website",
          },
        },
      );

      if (error || !data?.ok) {
        setRequestState("error");
        return;
      }

      formElement.reset();
      setRequestState("success");
    } catch {
      setRequestState("error");
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_55%,#fff8ed_100%)]">
      <header className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold">ZunftEcho</span>
          </Link>
          <Button asChild variant="ghost">
            <Link to="/login">Kundenlogin</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <section>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="size-4" /> Zurück zur Startseite
          </Link>

          <p className="mt-10 text-sm font-semibold tracking-wide text-primary uppercase">
            30-Tage-Einführungspilot
          </p>
          <h1 className="mt-3 text-4xl leading-tight font-semibold">
            Prüfen wir gemeinsam, ob ZunftEcho zu Ihrem Betrieb passt.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Senden Sie uns ein paar Eckdaten. Wir besprechen die Einrichtung persönlich, bevor ein
            Auftrag entsteht.
          </p>

          <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-semibold">99 €</span>
              <span className="pb-1 text-sm text-slate-400">netto · einmalig</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              30 Tage inklusive persönlicher Einrichtung
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              {[
                "Kein Jahresvertrag",
                "Website-Assistentin für Ihren Betrieb",
                "Qualifizierte Leads im Dashboard",
                "Ein Optimierungstermin im Pilotzeitraum",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="mb-7">
            <h2 className="text-2xl font-semibold">Pilot anfragen</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Die Anfrage ist unverbindlich. Ein kostenpflichtiger Pilot startet erst nach Ihrer
              ausdrücklichen Bestätigung.
            </p>
          </div>

          {requestState === "success" ? (
            <div
              role="status"
              className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"
            >
              <CircleCheck className="mt-0.5 size-4 shrink-0" />
              <span>
                Vielen Dank. Ihre Pilotanfrage ist bei uns eingegangen. Wir melden uns persönlich
                zur Abstimmung der nächsten Schritte.
              </span>
            </div>
          ) : null}

          {requestState === "error" ? (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950"
            >
              Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es erneut oder
              schreiben Sie an{" "}
              <a className="font-semibold underline" href={`mailto:${PILOT_EMAIL}`}>
                {PILOT_EMAIL}
              </a>
              .
            </div>
          ) : null}

          <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="fax">Fax</Label>
              <Input id="fax" name="fax" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Firmenname *</Label>
              <Input id="company" name="company" autoComplete="organization" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Ansprechpartner *</Label>
              <Input id="contact" name="contact" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Geschäftliche E-Mail *</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" type="tel" autoComplete="tel" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="url" placeholder="https://" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="message">Was passiert heute mit neuen Website-Anfragen?</Label>
              <Textarea
                id="message"
                name="message"
                className="min-h-28"
                placeholder="Zum Beispiel: Anfragen kommen per Formular und werden am nächsten Morgen zurückgerufen."
              />
            </div>

            <div className="sm:col-span-2">
              <Button
                type="submit"
                size="lg"
                className="h-12 w-full text-base"
                disabled={requestState === "submitting"}
              >
                {requestState === "submitting" ? (
                  <>
                    Anfrage wird gesendet <LoaderCircle className="animate-spin" />
                  </>
                ) : (
                  <>
                    Pilot unverbindlich anfragen <Send />
                  </>
                )}
              </Button>
              <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                Wir verwenden Ihre Angaben ausschließlich zur Bearbeitung der Anfrage. Hinweise
                finden Sie in unserer{" "}
                <Link to="/datenschutz" className="font-medium text-primary hover:underline">
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </div>
          </form>

          <div className="mt-7 border-t border-slate-200 pt-6 text-sm text-slate-600">
            Sie möchten lieber eine E-Mail schreiben? Erreichen Sie uns direkt unter{" "}
            <a className="font-medium text-primary hover:underline" href={`mailto:${PILOT_EMAIL}`}>
              {PILOT_EMAIL}
            </a>
            <ArrowRight className="ml-1 inline size-3.5" />
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-500">
        <Link to="/impressum" className="hover:text-slate-950">
          Impressum
        </Link>
        <span className="mx-3">·</span>
        <Link to="/datenschutz" className="hover:text-slate-950">
          Datenschutz
        </Link>
      </footer>
    </div>
  );
}
