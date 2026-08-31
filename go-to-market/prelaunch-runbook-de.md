# ZunftEcho - kostenfreier Vorbereitungsplan bis 10. September 2026

Stand: 29. August 2026

Video-Freigabe: Seit 31. August 2026 ist die letzte vor Runway produzierte ElevenLabs-Fassung das
offizielle Hauptvideo. Runway-Fassungen bleiben unveröffentlicht; Details stehen in
`docs/marketing-video-status-2026-08-31.md`.

## Grundsatz

Der technische Produktumfang ist für Demo und Pilotvorbereitung freigegeben. Bis Gewerbe,
Steuerdaten und Stripe vollständig bereit sind, werden keine automatische Abrechnung und keine
formelle Rechnung aktiviert. Die verbleibende Zeit dient nicht mehr dem wahllosen Ausbau, sondern
einer kontrollierten Vorbereitung auf den ersten zahlenden Pilotkunden.

## Bereits abgeschlossen

- technische Produktionsabnahme einschließlich Auth, Mobilansicht, Widget, Chat, Termine,
  Benachrichtigungen, Teamzugang und Automationen;
- öffentliche interaktive Demo unter `https://zunftecho.de/demo`;
- Kampagnen-Weitergabe von Brief-QR bis zur Pilotanfrage;
- zehn personalisierte, druckfertige A4-Briefe für die erste Welle;
- organische 30-Tage-Kampagne mit Wissenszentrum, zwei Fachartikeln, Partnerseite, zwölf
  LinkedIn-Beiträgen und vier kurzen Videoskripten;
- Pilotangebot: 30 Tage für 99 EUR netto, anschließend optional 149 EUR netto monatlich;
- rechtliche Seiten, technisches Monitoring und sichere Deaktivierung der Abrechnung.

## 29.-31. August: Verkaufsablauf festziehen

**Digital am 29. August abgeschlossen.** Zehn betriebsspezifische
Demo-Szenarien und ein visuell geprüfter zehnseitiger Drucksatz sind vorbereitet.
Offen bleiben nur das laute persönliche Durchspielen und der physische
Probedruck mit dem gelieferten Papier und Umschlag.

- Den 15-Minuten-Demo-Leitfaden zweimal laut durchspielen.
- Für jeden der zehn Zielbetriebe ein passendes Demo-Szenario festlegen.
- Die Briefe einmal auf Normalpapier drucken und QR, Ränder, Faltung und Fensterposition prüfen.
- Keine Briefe oder Werbe-E-Mails vorzeitig versenden.

**Ergebnis:** Die Demo ist in maximal 15 Minuten verständlich und der Brief führt ohne Anmeldung
zur passenden Produktansicht.

## 1.-3. September: Pilot-Onboarding proben

**Vorzeitig am 29. August abgeschlossen.** Der vollständige Produktionsdurchlauf ist in
`docs/operational-rehearsal-2026-08-29.md` dokumentiert; sämtliche gekennzeichneten Testdaten
wurden danach kontrolliert entfernt.

- Mit dem Demo-Betrieb einen vollständigen Self-Service-Onboarding-Durchlauf ausführen.
- Leistungen, Gebiete, Zeiten und Assistentennamen einmal ändern und wieder zurücksetzen.
- Widget-Einbau anhand der HTML-Vorschau und der Installationsseite proben.
- Einen Lead, eine menschliche Übergabe und einen Termin ausschließlich mit gekennzeichneten
  Testdaten durchspielen; danach Testdaten kontrolliert entfernen oder als Test markieren.

**Ergebnis:** Ein echter Betrieb kann ohne Improvisation eingerichtet werden.

## 4.-5. September: Reaktionsprozess vorbereiten

**Vorzeitig am 29. August abgeschlossen.** Das öffentliche Pilotformular, die
Quellenübernahme und die Benachrichtigung wurden mit gekennzeichneten Testdaten geprüft. Der
verbindliche interne Ablauf steht in `go-to-market/pilot-anfrage-prozess-de.md`; der Testdatensatz
wurde anschließend entfernt.

- Pilotanfragen im Supabase-Dashboard und die zugehörige Benachrichtigungs-E-Mail prüfen.
- Für eine neue Anfrage eine Reaktionszeit von maximal einem Werktag festlegen.
- Ein kurzes internes Gesprächsprotokoll vorbereiten: Bedarf, Einwand, nächster Schritt, Termin.
- Keine automatisierte Werbe-Nachfassserie aktivieren; vorhandene Re-Engagement-Automation gilt
  nur für freiwillig eingegangene Pilotanfragen.

**Ergebnis:** Keine echte Anfrage bleibt unbeantwortet oder ohne klaren nächsten Schritt.

## 6.-7. September: Druck und erste Welle

**Technischer Preflight am 29. August abgeschlossen.** Die zehn finalen Dateien sind einseitige
A4-PDFs, enthalten keine alte Marke und verweisen kampagnenspezifisch auf die Demo. Die physische
Freigabe nach Ankunft des Materials folgt `go-to-market/druckfreigabe-checkliste-de.md`.

- Endgültige PDFs auf dem bestellten Papier drucken.
- QR jedes einzelnen Ausdrucks mit dem Telefon testen.
- Nur die zehn in `go-to-market/erste-briefwelle-10-de.md` freigegebenen Betriebe für Welle 1
  vorbereiten.
- Woermann & Söhne bleibt wegen des dokumentierten Werbewiderspruchs ausgeschlossen.
- Umschläge adressieren, aber Versanddatum und Gewerbe-Status vor Einwurf erneut prüfen.

**Ergebnis:** Zehn fehlerfreie, individuell adressierte Sendungen liegen bereit.

## 8.-9. September: Go/No-Go-Abnahme

**Vorabkontrolle am 31. August bestanden.** Produktions-Build und ESLint liefen ohne Fehler. Der
Live-Smoke-Test bestätigte alle öffentlichen und rechtlichen Seiten, die unveränderte
Kampagnenquelle auf beiden Demo-CTAs, die ZunftEcho-Marke ohne `HandwerkAI`-Altbestand sowie den
weiterhin unveröffentlichten Anfrage-Check (`HTTP 404`). Diese Vorabkontrolle ersetzt nicht die
abschließende Prüfung am 8. oder 9. September.

Technik:

- den reproduzierbaren Basistest mit `npm run check:prelaunch` ausführen; erst nach der
  Gewerbeanmeldung und bewussten Kampagnenfreigabe `-- --marketing=live` verwenden;
- neue Cloudflare-Versionen vor der Freigabe mit
  `npm run check:prelaunch -- --version=<VERSION-ID>` bei 0 Prozent Traffic prüfen;
- `/`, `/demo`, `/registrieren`, `/preise`, `/login` und Widget einmal von Mobilfunk statt nur vom
  Heimnetz öffnen;
- Testmodus auf der Abonnementseite bestätigen;
- Health-Check, Cron-Jobs und ausgehende Nachrichten auf Fehler prüfen;
- keine neuen Fehler in den letzten 24 Stunden akzeptieren.
- vorbereitete Marketingseiten erst nach der Gewerbeanmeldung veröffentlichen und anschließend die
  Sitemap bei den Suchmaschinen einreichen.

Geschäft:

- korrekte Gewerbe-Tätigkeitsbeschreibung bereithalten;
- Geschäftsname ZunftEcho verwenden, sofern die Anmeldung dies in dieser Form zulässt;
- vollständigen Namen nur in Gewerbe-, Steuer-, Vertrags- und Impressumsangaben einsetzen;
- separates Geschäftskonto beziehungsweise Zahlungskonto vorbereiten, ohne kostenpflichtige
  Zusatzdienste vorschnell zu buchen.

**Ergebnis:** Am 10. September fehlt nur die behördliche beziehungsweise externe Freigabe.

## 10. September: Aktivierungsreihenfolge

1. Aufenthaltstitel erhalten und Angaben prüfen.
2. Gewerbeanmeldung einreichen.
3. Steuerliche Erfassung in ELSTER vervollständigen, sobald die dafür nötigen Daten vorliegen.
4. Stripe-Unternehmensdaten im Testkonto ergänzen; Live-Modus erst nach Verifikation aktivieren.
5. Impressum, AGB, Datenschutzerklärung und Rechnungsangaben mit den tatsächlich erteilten Daten
   aktualisieren.
6. Einen vollständigen Testkauf mit Stripe-Testdaten ausführen.
7. Erst nach erfolgreicher Prüfung Live-Zahlungen und automatische Rechnungsausgabe freigeben.
8. Die zehn Briefe versenden oder persönlich einwerfen.

## Stop-Kriterien

Nicht live verkaufen oder abrechnen, wenn einer dieser Punkte offen ist:

- Gewerbe- oder Steuerangaben sind widersprüchlich oder unvollständig;
- Stripe-Verifikation oder Webhook-Test schlägt fehl;
- Rechnung enthält nicht die tatsächlich gültigen Pflichtangaben;
- Produktions-Health-Check zeigt einen wiederholten Fehler;
- QR oder Pilotformular überträgt die Kampagnenquelle nicht korrekt;
- der Betrieb hat der Werbeansprache widersprochen.

## Erfolgskriterium für die erste Welle

- zehn personalisierte Briefe;
- mindestens ein freiwilliger Demo-/Pilotkontakt;
- mindestens ein qualifiziertes 15-Minuten-Gespräch;
- Ziel: ein bezahlter 30-Tage-Pilot, ohne Preisnachlass oder Funktionsversprechen außerhalb des
  veröffentlichten Umfangs.
