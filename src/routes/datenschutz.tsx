import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

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
          <h1 className="mt-3 break-words font-display text-3xl font-semibold sm:text-4xl">
            Datenschutzhinweise
          </h1>
          <p className="mt-3 text-sm text-slate-500">Stand: 28. August 2026</p>

          <div className="mt-10 space-y-9 leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-950">1. Verantwortlicher</h2>
              <p className="mt-3">
                Mohamad Hosam Alabar, ZunftEcho, Coloniaallee 34, 12524 Berlin, Deutschland
                <br />
                E-Mail:{" "}
                <a
                  className="font-medium text-primary hover:underline"
                  href="mailto:datenschutz@zunftecho.de"
                >
                  datenschutz@zunftecho.de
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
                Wenn Sie das Pilotformular absenden, verarbeiten wir Firmenname, Ansprechpartner,
                geschäftliche E-Mail-Adresse sowie Ihre freiwilligen Angaben zu Telefon, Website und
                Anliegen. Die Angaben werden in unserer über Supabase bereitgestellten Datenbank
                gespeichert und zur Benachrichtigung per E-Mail über Brevo verarbeitet. Zur
                Missbrauchsabwehr bilden wir vorübergehend einen nicht öffentlich zugänglichen,
                pseudonymisierten Prüfwert aus Verbindungs- und Anfragedaten. Rechtsgrundlage ist
                Art. 6 Abs. 1 lit. b und lit. f DSGVO. Soweit keine Geschäftsbeziehung entsteht,
                löschen wir die Anfrage grundsätzlich spätestens nach zwölf Monaten, sofern keine
                gesetzlichen Aufbewahrungspflichten entgegenstehen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                4. Kundenkonto und Plattformdaten
              </h2>
              <p className="mt-3">
                Für eingerichtete Kundenkonten verarbeiten wir Anmeldedaten, Unternehmensprofil,
                Teamrollen und Einladungen, Konfigurationen, Kundenanfragen, Leads, Termine,
                Qualitätsbewertungen sowie die im Arbeitsbereich angelegten Geschäftsdokumente. Dies
                ist für Bereitstellung, Sicherheit und Support der Plattform erforderlich und beruht
                auf Art. 6 Abs. 1 lit. b und lit. f DSGVO.
              </p>
              <p className="mt-3">
                Authentifizierung, Datenbank und serverseitige Funktionen werden über Supabase
                bereitgestellt. Das Projekt wird in der Region Frankfurt betrieben. Zugriff erhalten
                nur berechtigte Nutzer des jeweiligen Betriebs und eingesetzte Auftragsverarbeiter.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                5. KI-Chat und Automatisierung
              </h2>
              <p className="mt-3">
                Wenn ein Betrieb den ZunftEcho-Chat einsetzt, werden Chatnachrichten, Kontaktdaten
                und Angaben zum Anliegen zur Beantwortung, Lead-Qualifizierung, Terminvorbereitung,
                Gefahrenerkennung und menschlichen Übergabe verarbeitet. Die technische
                Orchestrierung erfolgt in Supabase Edge Functions. Für die Sprach- und
                Inhaltsanalyse verwenden wir die OpenAI API. Inhalte aus der API werden nach den
                Bedingungen für Geschäftskunden standardmäßig nicht zum Training der Modelle
                verwendet.
              </p>
              <p className="mt-3">
                Die KI bereitet Anfragen und Vorschläge vor; rechtsverbindliche Entscheidungen mit
                vergleichbarer erheblicher Wirkung trifft sie nicht allein. Kritische oder eindeutig
                verärgerte Anfragen werden an einen Menschen übergeben. ZunftEcho verarbeitet
                Chatdaten im Regelfall als Auftragsverarbeiter des jeweiligen Betriebs; der Betrieb
                bleibt für die Information seiner Websitebesucher verantwortlich.
              </p>
              <p className="mt-3">
                Besucher können ihren Standort ausschließlich nach einer ausdrücklichen Aktion im
                Chat freigeben. Der Browser zeigt dabei seine eigene Berechtigungsabfrage; ohne
                Zustimmung erfolgt kein Zugriff. Alternativ kann die Adresse manuell eingegeben
                werden. Bei einer Standortfreigabe werden Koordinaten einmalig zur Ermittlung einer
                lesbaren Adresse an den Dienst Nominatim der OpenStreetMap Foundation übermittelt
                und anschließend zusammen mit der bestätigten Einsatzadresse zur Anfrage
                gespeichert.
              </p>
              <p className="mt-3">
                Optional hochgeladene Störungsfotos werden vor der Übertragung im Browser
                komprimiert, in einem nicht öffentlichen Supabase-Speicher abgelegt und eindeutig
                der jeweiligen Anfrage zugeordnet. Pro Anfrage sind höchstens drei Bilder möglich;
                zugriffsberechtigt sind nur Nutzer des zuständigen Betriebs. Standortangaben und
                Bilder sind für die Nutzung des Chats nicht verpflichtend.
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
                Cookies oder Browser-Speicher eingesetzt werden. Dazu gehört auch die lokale
                Speicherung der gewählten Darstellung (hell oder dunkel) sowie einer anonymen
                Chat-Sitzungskennung. Team-Einladungstokens verbleiben ausschließlich im jeweiligen
                Einladungslink und werden nicht dauerhaft im Browser gespeichert. Diese Funktionen
                sind für den angeforderten Dienst erforderlich.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-950">
                8. Empfänger und Drittlandtransfer
              </h2>
              <p className="mt-3">
                Daten erhalten nur Personen und Dienstleister, die sie für Betrieb, Support oder
                Vertragserfüllung benötigen. Dazu gehören insbesondere Cloudflare für Hosting und
                Schutz, Supabase für Datenbank und serverseitige Funktionen, OpenAI für die
                KI-Analyse und Brevo für E-Mail-Versand. Soweit Anbieter Daten außerhalb des
                Europäischen Wirtschaftsraums verarbeiten, erfolgt die Übermittlung auf Grundlage
                eines Angemessenheitsbeschlusses oder geeigneter Garantien wie
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
