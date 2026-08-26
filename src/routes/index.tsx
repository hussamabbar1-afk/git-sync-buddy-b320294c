import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Code2,
  MessageSquareText,
  PhoneCall,
  PlugZap,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { InteractiveChatDemo } from "@/components/interactive-chat-demo";

const benefits = [
  {
    icon: MessageSquareText,
    title: "Anfragen vollständig erfassen",
    text: "Ihre digitale Assistentin fragt Problem, Kontaktdaten, Einsatzort und Terminwunsch strukturiert ab.",
  },
  {
    icon: ShieldAlert,
    title: "Dringende Fälle erkennen",
    text: "Bei Gefahrenhinweisen gibt der Assistent Sicherheitshinweise und übergibt an einen Menschen.",
  },
  {
    icon: ClipboardCheck,
    title: "Saubere Übergabe ans Team",
    text: "Jede qualifizierte Anfrage landet als übersichtlicher Lead im ZunftEcho-Dashboard.",
  },
];

const steps = [
  {
    number: "01",
    title: "Wir richten Ihren Betrieb ein",
    text: "Name, Ton, Leistungen, Einsatzgebiete und Öffnungszeiten Ihrer digitalen Assistentin werden gemeinsam konfiguriert.",
  },
  {
    number: "02",
    title: "Der Assistent übernimmt Website-Anfragen",
    text: "Kunden schildern ihr Anliegen im Chat. Ihre Assistentin stellt die fehlenden Fragen und sammelt alle wichtigen Angaben.",
  },
  {
    number: "03",
    title: "Ihr Team übernimmt vorbereitet",
    text: "Neue Leads, Termine und Gesprächsverläufe sind zentral sichtbar. Bei Bedarf wird direkt an einen Mitarbeiter übergeben.",
  },
];

const pilotIncludes = [
  "Persönliche Einrichtung für Ihren SHK-Betrieb",
  "Website-Assistentin mit frei wählbarem Namen, Ihrem Firmennamen und Ihren Leistungen",
  "Qualifizierung von Anfragen und Erfassung von Terminwünschen",
  "Lead-, Kunden- und Gesprächsübersicht im Dashboard",
  "Gemeinsame Inbetriebnahme und ein Optimierungstermin",
];

const integrationPlatforms = [
  "WordPress",
  "Wix",
  "Shopify",
  "Webflow",
  "Squarespace",
  "Jimdo",
  "HTML",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZunftEcho – Mehr vollständige Anfragen für SHK-Betriebe" },
      {
        name: "description",
        content:
          "ZunftEcho nimmt Website-Anfragen für SHK-Betriebe auf, qualifiziert sie und übergibt vollständige Leads an Ihr Team.",
      },
      {
        property: "og:title",
        content: "ZunftEcho – Der digitale Anfrage-Assistent für SHK-Betriebe",
      },
      {
        property: "og:description",
        content: "Mehr vollständige Kundenanfragen. Weniger Rückrufchaos.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zunftecho.de/" },
      { property: "og:locale", content: "de_DE" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "ZunftEcho",
          url: "https://zunftecho.de/",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          inLanguage: "de-DE",
          description:
            "Digitaler Anfrage-Assistent und Lead-Dashboard für SHK-Betriebe in Berlin und Brandenburg.",
          offers: {
            "@type": "Offer",
            price: "99",
            priceCurrency: "EUR",
            description: "30-Tage-Einführungspilot, netto und einmalig",
            url: "https://zunftecho.de/registrieren",
          },
          provider: {
            "@type": "Organization",
            name: "ZunftEcho",
            url: "https://zunftecho.de/",
            email: "hussamabbar4@gmail.com",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Coloniaallee 34",
              postalCode: "12524",
              addressLocality: "Berlin",
              addressCountry: "DE",
            },
          },
        }),
      },
    ],
  }),
  component: LandingPage,
});

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Bot className="size-5" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">ZunftEcho</span>
    </span>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link to="/" aria-label="ZunftEcho Startseite">
            <Brand />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a className="transition-colors hover:text-slate-950" href="#vorteile">
              Vorteile
            </a>
            <a className="transition-colors hover:text-slate-950" href="#ablauf">
              Ablauf
            </a>
            <a className="transition-colors hover:text-slate-950" href="#integration">
              Installation
            </a>
            <a className="transition-colors hover:text-slate-950" href="#pilot">
              Pilotangebot
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Anmelden</Link>
            </Button>
            <Button asChild>
              <Link to="/registrieren">
                Pilot anfragen <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-slate-200 bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_55%,#fff8ed_100%)]">
          <div className="absolute -top-24 right-0 -z-10 size-[34rem] rounded-full bg-sky-200/30 blur-3xl" />
          <div className="absolute -bottom-40 left-0 -z-10 size-[30rem] rounded-full bg-orange-200/25 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_0.92fr] lg:px-10 lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800">
                <Sparkles className="size-4" /> Für SHK-Betriebe in Berlin & Brandenburg
              </div>
              <h1 className="font-display text-4xl leading-[1.06] font-semibold tracking-[-0.045em] text-balance sm:text-5xl lg:text-[3.65rem]">
                Mehr vollständige Kundenanfragen. Weniger Rückrufchaos.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                ZunftEcho nimmt Website-Anfragen auf, stellt die richtigen Rückfragen und übergibt
                Ihrem Team vollständige Leads – auch wenn gerade alle auf der Baustelle sind.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link to="/registrieren">
                    30-Tage-Pilot anfragen <ArrowRight />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 border-slate-300 bg-white px-6 text-base"
                >
                  <a href="#ablauf">So funktioniert es</a>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" /> 30 Tage · 99 € netto
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Kein Jahresvertrag
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Persönlich eingerichtet
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:mx-0">
              <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-sky-100/80" />
              <InteractiveChatDemo />

              <div className="absolute -right-4 -bottom-7 hidden items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xl sm:flex">
                <span className="flex size-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                  <Clock3 className="size-5" />
                </span>
                <div>
                  <p className="text-xs text-slate-500">Neue Anfrage</p>
                  <p className="text-sm font-semibold">außerhalb der Bürozeit</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="vorteile" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Von der Nachricht zum verwertbaren Lead
              </p>
              <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                Der erste Kundenkontakt, sauber vorbereitet.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Ihr Team sieht nicht nur eine Telefonnummer, sondern versteht vor dem Rückruf, worum
                es geht und wie dringend die Anfrage ist.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.45)]"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-sky-50 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{text}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 grid overflow-hidden rounded-2xl bg-slate-950 text-white md:grid-cols-3">
              <div className="border-b border-white/10 p-6 md:border-r md:border-b-0">
                <Clock3 className="size-5 text-sky-400" />
                <p className="mt-3 font-semibold">Auch nach Feierabend erreichbar</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Der Website-Chat nimmt Anfragen auf, wenn niemand ans Telefon gehen kann.
                </p>
              </div>
              <div className="border-b border-white/10 p-6 md:border-r md:border-b-0">
                <PhoneCall className="size-5 text-sky-400" />
                <p className="mt-3 font-semibold">Gezielter zurückrufen</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Kontaktdaten, Anliegen und Terminwunsch liegen bereits strukturiert vor.
                </p>
              </div>
              <div className="p-6">
                <Wrench className="size-5 text-sky-400" />
                <p className="mt-3 font-semibold">Für den SHK-Alltag eingerichtet</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Leistungen, Gebiete und Öffnungszeiten Ihres Betriebs steuern die Antworten.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="ablauf"
          className="scroll-mt-20 border-y border-slate-200 bg-slate-50 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="text-center">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                In drei Schritten startklar
              </p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Persönlich eingerichtet, im Alltag einfach.
              </h2>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.number}
                  className="relative rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <span className="font-display text-sm font-semibold text-primary">
                    {step.number}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
                  {index < steps.length - 1 ? (
                    <span className="absolute top-1/2 -right-4 z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 lg:flex">
                      <ChevronRight className="size-4" />
                    </span>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="integration"
          className="scroll-mt-20 overflow-hidden bg-slate-950 py-20 text-white sm:py-24"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
            <div>
              <p className="text-sm font-semibold tracking-wide text-sky-400 uppercase">
                Einbau ohne Systemwechsel
              </p>
              <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                In wenigen Minuten auf Ihrer Website.
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
                Ein persönlicher Code-Schnipsel verbindet Ihre bestehende Website mit ZunftEcho. Das
                Dashboard führt Schritt für Schritt durch die passende Plattform und erkennt die
                erfolgreiche Installation automatisch.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  {
                    icon: Code2,
                    title: "1 Code",
                    text: "Einmal websiteweit einfügen",
                  },
                  {
                    icon: PlugZap,
                    title: "7 Plattformen",
                    text: "Geführte Einbauwege",
                  },
                  {
                    icon: SearchCheck,
                    title: "Live-Prüfung",
                    text: "Verbindung automatisch erkannt",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <Icon className="size-5 text-sky-400" />
                    <p className="mt-3 text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                {integrationPlatforms.map((platform) => (
                  <span
                    key={platform}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-16 -z-0 rounded-full bg-sky-500/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-red-400" />
                    <span className="size-2.5 rounded-full bg-amber-400" />
                    <span className="size-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-500">ZunftEcho · Installation</span>
                </div>
                <div className="p-5 sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Persönlicher Website-Code</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Sicher, asynchron und updatefähig
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      Bereit
                    </span>
                  </div>
                  <div className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs leading-6 text-sky-300">
                    &lt;script async
                    <br />
                    &nbsp;&nbsp;src=&quot;https://.../widget-loader?key=••••&quot;
                    <br />
                    &gt;&lt;/script&gt;
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ["01", "Plattform wählen"],
                      ["02", "Code einfügen"],
                      ["03", "Website prüfen"],
                    ].map(([number, label]) => (
                      <div
                        key={number}
                        className="rounded-xl border border-white/10 bg-white/5 p-3"
                      >
                        <span className="text-xs font-semibold text-sky-400">{number}</span>
                        <p className="mt-2 text-xs font-medium text-slate-200">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-100">
                        Installation automatisch erkannt
                      </p>
                      <p className="mt-1 text-xs text-emerald-200/65">
                        Domain, letzter Aufruf und Verbindungsstatus werden sichtbar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pilot" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
            <div>
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Einführungspilot
              </p>
              <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                30 Tage im echten Betrieb testen.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Kein anonymer Selbstbedienungs-Test: Wir richten ZunftEcho gemeinsam ein und prüfen
                mit echten Anfragen, ob es Ihrem Betrieb Arbeit abnimmt.
              </p>
              <div className="mt-7 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-950">
                <strong>Bewusst klarer Umfang:</strong> Telefonie, WhatsApp und individuelle
                Buchhaltungsintegrationen sind im Einführungspilot nicht enthalten.
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_32px_80px_-36px_rgba(15,23,42,0.4)]">
              <div className="border-b border-slate-200 bg-slate-950 p-7 text-white sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-sky-300">30-Tage-Einführungspilot</p>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="font-display text-5xl font-semibold">99 €</span>
                      <span className="pb-1 text-sm text-slate-400">netto · einmalig</span>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium">
                    Max. 5 Betriebe gleichzeitig
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Inklusive Einrichtung. Keine Kreditkarte und kein Jahresvertrag erforderlich.
                </p>
              </div>

              <div className="p-7 sm:p-8">
                <ul className="space-y-4">
                  {pilotIncludes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-6 text-slate-700"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="size-3.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="mt-7 h-12 w-full text-base">
                  <Link to="/registrieren">
                    Pilot unverbindlich anfragen <ArrowRight />
                  </Link>
                </Button>
                <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                  Erst nach dem Pilot entscheiden Sie über die Fortsetzung für 149 € netto pro
                  Monat, monatlich kündbar. Bei Fortsetzung fällt keine neue Einrichtungsgebühr an.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary py-16 text-primary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-5 sm:px-8 lg:flex-row lg:items-center lg:px-10">
            <div>
              <h2 className="text-3xl font-semibold">Passt ZunftEcho zu Ihrem Betrieb?</h2>
              <p className="mt-3 max-w-2xl text-primary-foreground/80">
                Senden Sie uns Ihre Eckdaten. Wir melden uns persönlich und klären, ob der Pilot für
                Ihre aktuellen Anfragen sinnvoll ist.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="h-12 shrink-0 bg-white px-6 text-base text-slate-950 hover:bg-slate-100"
            >
              <Link to="/registrieren">
                Pilot anfragen <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <Brand />
          <div className="flex flex-wrap items-center gap-5">
            <a className="hover:text-slate-950" href="#vorteile">
              Vorteile
            </a>
            <a className="hover:text-slate-950" href="#pilot">
              Pilotangebot
            </a>
            <a className="hover:text-slate-950" href="#integration">
              Installation
            </a>
            <Link className="hover:text-slate-950" to="/login">
              Kundenlogin
            </Link>
            <Link className="hover:text-slate-950" to="/impressum">
              Impressum
            </Link>
            <Link className="hover:text-slate-950" to="/datenschutz">
              Datenschutz
            </Link>
          </div>
          <p>© {new Date().getFullYear()} ZunftEcho</p>
        </div>
      </footer>
    </div>
  );
}
