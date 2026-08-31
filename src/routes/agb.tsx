import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

export const Route = createFileRoute("/agb")({
  head: () => ({
    meta: [
      { title: "AGB – ZunftEcho" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen für ZunftEcho." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          <h1 className="font-display text-4xl font-semibold">Allgemeine Geschäftsbedingungen</h1>
          <p className="mt-3 text-sm text-slate-500">Stand: 27. August 2026 · B2B</p>

          <div className="mt-10 space-y-9 leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-950">1. Geltungsbereich</h2>
              <p className="mt-3">
                Diese Bedingungen gelten für Verträge über ZunftEcho zwischen Mohamad Hosam Alabar,
                handelnd unter ZunftEcho, und Unternehmern im Sinne des § 14 BGB. Abweichende
                Bedingungen des Kunden gelten nur, wenn sie ausdrücklich in Textform bestätigt
                wurden. Ein individuelles Angebot geht diesen Bedingungen vor.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">2. Vertragsschluss</h2>
              <p className="mt-3">
                Eine Pilotanfrage ist unverbindlich. Ein Vertrag entsteht erst durch ein konkretes
                Angebot und dessen Annahme oder durch eine ausdrückliche Auftragsbestätigung. Der
                kostenpflichtige Regelbetrieb beginnt nicht automatisch nach dem Pilot, sondern nur
                nach gesonderter Zustimmung.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">3. Leistungsumfang</h2>
              <p className="mt-3">
                ZunftEcho stellt eine webbasierte Plattform zur automatisierten Annahme,
                Strukturierung und Nachverfolgung von Kundenanfragen bereit. Der konkrete Umfang,
                enthaltene Einrichtungstätigkeiten und etwaige Nutzungsgrenzen ergeben sich aus dem
                Angebot. KI-Ausgaben sind Arbeitshilfen und müssen bei fachlichen,
                sicherheitsrelevanten oder rechtsverbindlichen Sachverhalten durch einen Menschen
                geprüft werden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">4. Mitwirkung des Kunden</h2>
              <p className="mt-3">
                Der Kunde stellt richtige Unternehmensdaten, Leistungen, Öffnungszeiten und
                Ansprechpartner bereit, prüft die Konfiguration vor dem produktiven Einsatz und hält
                seine rechtlichen Hinweise auf der eigenen Website aktuell. Zugangsdaten dürfen nur
                berechtigten Personen überlassen werden. Sicherheits- oder Inhaltsfehler sind
                unverzüglich zu melden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">5. Preise und Zahlung</h2>
              <p className="mt-3">
                Es gelten die im individuellen Angebot bestätigten Nettopreise zuzüglich
                gesetzlicher Umsatzsteuer, soweit diese anfällt. Rechnungen sind, sofern nicht
                anders vereinbart, innerhalb von 14 Tagen ohne Abzug fällig. Bei wiederkehrenden
                Zahlungen wird das vereinbarte Zahlungsmittel zum jeweiligen Abrechnungsbeginn
                belastet.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">6. Laufzeit und Kündigung</h2>
              <p className="mt-3">
                Der Einführungspilot endet nach dem vereinbarten Zeitraum, ohne automatisch in ein
                Abonnement überzugehen. Der anschließende Regelbetrieb läuft monatlich und kann,
                sofern das Angebot nichts Abweichendes regelt, zum Ende des laufenden
                Abrechnungsmonats gekündigt werden. Das Recht zur außerordentlichen Kündigung bleibt
                unberührt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                7. Verfügbarkeit und Änderungen
              </h2>
              <p className="mt-3">
                ZunftEcho schuldet eine fachgerechte Bereitstellung, jedoch keine
                unterbrechungsfreie Verfügbarkeit. Wartung, Sicherheitsmaßnahmen und Ausfälle
                externer Infrastruktur können die Nutzung vorübergehend einschränken. Wesentliche,
                für den Kunden nachteilige Änderungen werden rechtzeitig angekündigt, soweit dies
                möglich ist.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">8. Datenschutz</h2>
              <p className="mt-3">
                Soweit ZunftEcho personenbezogene Daten im Auftrag des Kunden verarbeitet, schließen
                die Parteien vor dem produktiven Einsatz eine Vereinbarung zur Auftragsverarbeitung.
                Der Kunde bleibt für die Rechtmäßigkeit der übermittelten Daten und die Information
                seiner Endkunden verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">9. Haftung</h2>
              <p className="mt-3">
                ZunftEcho haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung
                von Leben, Körper oder Gesundheit sowie nach zwingenden gesetzlichen Vorschriften.
                Bei leicht fahrlässiger Verletzung einer wesentlichen Vertragspflicht ist die
                Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Im Übrigen ist
                die Haftung bei leichter Fahrlässigkeit ausgeschlossen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">10. Schlussbestimmungen</h2>
              <p className="mt-3">
                Es gilt deutsches Recht. Ist der Kunde Kaufmann, juristische Person des öffentlichen
                Rechts oder öffentlich-rechtliches Sondervermögen, ist Berlin Gerichtsstand. Sollte
                eine einzelne Bestimmung unwirksam sein, bleiben die übrigen Bestimmungen davon
                unberührt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">Vertragspartner und Kontakt</h2>
              <p className="mt-3">
                Mohamad Hosam Alabar · ZunftEcho · Coloniaallee 34 · 12524 Berlin · Deutschland
                <br />
                E-Mail:{" "}
                <a
                  className="font-medium text-primary hover:underline"
                  href="mailto:kontakt@zunftecho.de"
                >
                  kontakt@zunftecho.de
                </a>
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
