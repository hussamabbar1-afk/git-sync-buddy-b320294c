import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type PilotRequestResponse = {
  ok?: boolean;
  message?: string;
};

type RequestState = "idle" | "submitting" | "success" | "error";

const selectClassName =
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export const Route = createFileRoute("/registrieren")({
  head: () => ({
    meta: [
      { title: "Gründungspilot vormerken – ZunftEcho" },
      {
        name: "description",
        content:
          "Merken Sie Ihren SHK-Betrieb unverbindlich für einen von fünf persönlich begleiteten ZunftEcho-Gründungspiloten vor.",
      },
      { property: "og:title", content: "Einer von fünf ZunftEcho-Gründungspiloten" },
      {
        property: "og:description",
        content:
          "Unverbindlich vormerken: 30 Tage, 99 € netto inklusive persönlicher Einrichtung, ohne Jahresvertrag.",
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
            phone: "",
            website: value("website"),
            team_size_range: value("team_size_range"),
            monthly_inquiry_range: value("monthly_inquiry_range"),
            primary_challenge: value("primary_challenge"),
            preferred_start_window: value("preferred_start_window"),
            audit_requested: form.get("audit_requested") === "on",
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
    <div className="ze-auth-surface min-h-screen">
      <header className="border-b border-slate-200/70 bg-white/86 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="ze-mark-shell flex size-9 items-center justify-center rounded-lg bg-white">
              <BrandMark className="size-9" />
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

          <p className="ze-kicker mt-10">5 Gründungspiloten · Berlin & Brandenburg</p>
          <h1 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
            Einer von fünf Betrieben, die ZunftEcho zuerst im Alltag prüfen.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Merken Sie Ihren Betrieb unverbindlich vor. Wir prüfen persönlich, ob Ihr Anfrageablauf
            zum Pilot passt, bevor eine Zahlung oder ein Auftrag entsteht.
          </p>

          <div className="ze-dark-grid relative mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-[0_28px_60px_-38px_rgba(15,23,42,0.8)]">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-sky-400/8" />
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
                "Start erst nach finaler Freigabe und Ihrer Bestätigung",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-white/90 bg-white/86 p-6 shadow-[0_32px_80px_-44px_rgba(15,23,42,0.5)] backdrop-blur sm:p-8">
          <div className="mb-7">
            <h2 className="text-2xl font-semibold">Pilotplatz unverbindlich vormerken</h2>
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
                Vielen Dank. Ihr Betrieb ist für die persönliche Pilotprüfung vorgemerkt. Wir
                antworten Ihnen persönlich per E-Mail – ohne Anruf und ohne automatische Werbung.
              </span>
            </div>
          ) : null}

          {requestState === "error" ? (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950"
            >
              Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es in wenigen
              Minuten erneut.
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
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="url" placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team_size_range">Teamgröße *</Label>
              <select
                id="team_size_range"
                name="team_size_range"
                className={selectClassName}
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Bitte auswählen
                </option>
                <option value="solo">Solo-Betrieb</option>
                <option value="2-5">2–5 Mitarbeitende</option>
                <option value="6-10">6–10 Mitarbeitende</option>
                <option value="11-plus">Mehr als 10 Mitarbeitende</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly_inquiry_range">Website-Anfragen pro Monat *</Label>
              <select
                id="monthly_inquiry_range"
                name="monthly_inquiry_range"
                className={selectClassName}
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Bitte auswählen
                </option>
                <option value="0-5">0–5</option>
                <option value="6-15">6–15</option>
                <option value="16-30">16–30</option>
                <option value="31-plus">Mehr als 30</option>
                <option value="unknown">Noch unbekannt</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_challenge">Größte Herausforderung *</Label>
              <select
                id="primary_challenge"
                name="primary_challenge"
                className={selectClassName}
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Bitte auswählen
                </option>
                <option value="incomplete-details">Wichtige Angaben fehlen</option>
                <option value="slow-response">Antworten dauern zu lange</option>
                <option value="appointment-coordination">Termine kosten zu viel Abstimmung</option>
                <option value="callback-load">Zu viele Rückrufe</option>
                <option value="other">Etwas anderes</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_start_window">Bevorzugter Start *</Label>
              <select
                id="preferred_start_window"
                name="preferred_start_window"
                className={selectClassName}
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Bitte auswählen
                </option>
                <option value="after-clearance">Sobald der Pilot freigegeben ist</option>
                <option value="september">Im September</option>
                <option value="october">Im Oktober</option>
                <option value="later">Später</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="message">Was sollten wir über Ihren Ablauf wissen?</Label>
              <Textarea
                id="message"
                name="message"
                className="min-h-28"
                placeholder="Zum Beispiel: Anfragen kommen per Formular und werden am nächsten Morgen zurückgerufen."
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="audit_requested"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <Checkbox id="audit_requested" name="audit_requested" className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    Kostenlosen manuellen Website-Anfrage-Check anfordern
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Wir prüfen Formular, mobile Bedienung und fehlende Anfrageinformationen – ohne
                    Tracker und ohne Änderungen an Ihrer Website.
                  </span>
                </span>
              </label>
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
                    Pilotplatz unverbindlich vormerken <Send />
                  </>
                )}
              </Button>
              <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                Wir verwenden Ihre Angaben ausschließlich zur Bearbeitung dieser Anfrage und
                antworten persönlich per E-Mail. Kein Telefonanruf, kein Newsletter, keine
                automatische Werbeserie. Hinweise finden Sie in unserer{" "}
                <Link to="/datenschutz" className="font-medium text-primary hover:underline">
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </div>
          </form>
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
