import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot } from "lucide-react";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutz – ZunftEcho" },
      {
        name: "description",
        content: "Datenschutzhinweise für die Website und Plattform ZunftEcho.",
      },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: DatenschutzPage,
});

function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="size-5" />
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
          <h1 className="font-display text-4xl font-semibold">Datenschutzhinweise</h1>
          <p className="mt-3 text-sm text-slate-500">Stand: 24. August 2026</p>

          <div className="mt-10 space-y-9 leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-950">1. Verantwortlicher</h2>
              <p className="mt-3">
                Mohamad Hosam Alabar, ZunftEcho, Coloniaallee 34, 12524 Berlin, Deutschland
                <br />
                E-Mail:{" "}
                <a
                  className="font-medium text-primary hover:underline"
                  href="mailto:hussamabbar4@gmail.com"
                >
                  hussamabbar4@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">2. Aufruf dieser Website</h2>
              <p className="mt-3">
                Beim Aufruf werden technisch erforderliche Verbindungsdaten verarbeitet,
                insbesondere IP-Adresse, Zeitpunkt, aufgerufene Adresse, Referrer, Browser- und
                Geräteangaben. Die Verarbeitung dient der sicheren, stabilen und schnellen
                Bereitstellung der Website und beruht auf Art. 6 Abs. 1 lit. f DSGVO.
              </p>
              <p className="mt-3">
                Die Website wird über Cloudflare Workers und das Cloudflare-Netzwerk bereitgestellt.
                Dienstleister ist Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA.
                Cloudflare verarbeitet Verbindungs- und Sicherheitsdaten in unserem Auftrag.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                3. Pilot- und Kontaktanfragen
              </h2>
              <p className="mt-3">
                Das Pilotformular überträgt keine Daten automatisch. Es erstellt lokal eine E-Mail
                in Ihrem E-Mail-Programm. Erst wenn Sie diese dort absenden, erhalten wir die von
                Ihnen eingetragenen Angaben. Wir verarbeiten sie zur Beantwortung Ihrer Anfrage und
                zur Vorbereitung eines möglichen Vertrags nach Art. 6 Abs. 1 lit. b DSGVO. Soweit
                keine Geschäftsbeziehung entsteht, löschen wir die Anfrage grundsätzlich spätestens
                nach zwölf Monaten, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                4. Kundenkonto und Plattformdaten
              </h2>
              <p className="mt-3">
                Für eingerichtete Kundenkonten verarbeiten wir Anmeldedaten, Unternehmensprofil,
                Konfigurationen, Kundenanfragen, Leads, Termine sowie die im Arbeitsbereich
                angelegten Geschäftsdokumente. Dies ist für Bereitstellung, Sicherheit und Support
                der Plattform erforderlich und beruht auf Art. 6 Abs. 1 lit. b und lit. f DSGVO.
              </p>
              <p className="mt-3">
                Authentifizierung und Datenbank werden über Supabase bereitgestellt. Dienstleister
                ist Supabase, Inc., 970 Toa Payoh North #07-04, Singapore 318992. Zugriff erhalten
                nur berechtigte Nutzer des jeweiligen Betriebs und eingesetzte Auftragsverarbeiter.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                5. KI-Chat und Automatisierung
              </h2>
              <p className="mt-3">
                Wenn ein Betrieb den ZunftEcho-Chat einsetzt, werden Chatnachrichten, Kontaktdaten
                und Angaben zum Anliegen zur Beantwortung und Lead-Qualifizierung verarbeitet. Für
                Automatisierungen nutzen wir n8n Cloud der n8n GmbH, Novalisstraße 10, 10115 Berlin.
                Abhängig von der Kundenkonfiguration kann zusätzlich ein KI-Dienst eingebunden sein;
                der jeweilige Betrieb informiert seine Websitebesucher über den konkret eingesetzten
                Anbieter. ZunftEcho verarbeitet diese Daten im Regelfall als Auftragsverarbeiter des
                jeweiligen Betriebs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                6. Versand von Geschäftsdokumenten
              </h2>
              <p className="mt-3">
                Wenn ein Nutzer Angebote, Auftragsbestätigungen oder Rechnungen per E-Mail
                versendet, werden Empfängeradresse und Dokumentinhalt an den Versanddienst Brevo der
                Sendinblue GmbH, Köpenicker Straße 126, 10179 Berlin, übermittelt. Rechtsgrundlage
                ist Art. 6 Abs. 1 lit. b DSGVO.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                7. Technisch erforderlicher Speicher
              </h2>
              <p className="mt-3">
                Wir verwenden derzeit keine Werbe- oder Reichweitenmessungs-Cookies. Für Anmeldung,
                Sicherheit und die Fortsetzung einer Chat-Sitzung können technisch erforderliche
                Cookies oder Browser-Speicher eingesetzt werden. Diese Funktionen sind für den
                angeforderten Dienst erforderlich.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                8. Empfänger und Drittlandtransfer
              </h2>
              <p className="mt-3">
                Daten erhalten nur Personen und Dienstleister, die sie für Betrieb, Support oder
                Vertragserfüllung benötigen. Soweit Anbieter Daten außerhalb des Europäischen
                Wirtschaftsraums verarbeiten, erfolgt die Übermittlung auf Grundlage eines
                Angemessenheitsbeschlusses oder geeigneter Garantien wie
                EU-Standardvertragsklauseln.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">9. Speicherdauer</h2>
              <p className="mt-3">
                Wir speichern personenbezogene Daten nur so lange, wie sie für den jeweiligen Zweck,
                die Vertragsabwicklung, Missbrauchsabwehr oder gesetzliche Aufbewahrungspflichten
                benötigt werden. Danach werden sie gelöscht oder anonymisiert.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">10. Ihre Rechte</h2>
              <p className="mt-3">
                Sie haben nach Maßgabe der DSGVO Rechte auf Auskunft, Berichtigung, Löschung,
                Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Eine erteilte
                Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Außerdem
                können Sie sich bei einer Datenschutzaufsichtsbehörde beschweren, insbesondere bei
                der Berliner Beauftragten für Datenschutz und Informationsfreiheit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">11. Änderungen</h2>
              <p className="mt-3">
                Wir aktualisieren diese Hinweise, wenn sich Funktionen, Dienstleister oder
                rechtliche Anforderungen ändern. Maßgeblich ist die hier veröffentlichte Fassung.
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
