# SEO content package: SHK human-handover acceptance

Status: **published** on 13 September 2026, 01:55 Europe/Berlin; indexing not yet verified.
Prepared: 13 September 2026, Europe/Berlin.

## Implementation brief

- Proposed route: `/shk-chatbot-menschliche-uebergabe`.
- Active source: `seo-shk-uebergabe`, since the verified production launch.
- Search-intent hypothesis: a small SHK owner assessing whether a website assistant hands work
  to a person reliably. This is an acceptance protocol, not another general chatbot/safety overview.
- No validated search volume, ranking, traffic or conversion forecast. Search results alone do not
  prove demand. Evaluate qualified inquiries with source using existing measurement, without a new tracker.
- Reuse `KnowledgeArticle` and the current brand system; no new graphics, library or redesign.
- Implementation: new route using `KnowledgeArticle`, title/canonical/Article metadata and visible
  FAQ matching schema, internal link from Wissen and sitemap entry. Reference links are an optional
  addition to the existing article component; previous articles retain their current behavior.
- Before release: build/type/lint checks, mobile/desktop visual acceptance and normal isolated-preview/
  production validation. No publish while browser QA is unavailable.
- Verified: build, TypeScript, targeted ESLint and read-only local HTTP checks passed. Six cases,
  four visible/schema-matching FAQs, DVGW reference, source links, Wissen, sitemap and three existing
  articles checked by `scripts/check-handover-guide.mjs` on the implementation branch. No database writes.
- Release checkpoint: `3623c71` on synchronized `main`; GitHub quality run `34726620657` succeeded.
  Visual acceptance passed at 320/390 and desktop. Cloudflare version
  `ab165970-ad5b-4eb2-ba1a-3c24e39fb313` passed zero-traffic preview and production HTTP/smoke checks.
  Six cases, four FAQs, source preservation after hydration and no horizontal mobile overflow verified.
  The superseded draft checkpoint `5408d10` must not be redeployed.
- Bing reports not discovered. Its final indexing Submit is pending owner confirmation; no request
  submitted or indexing claimed. Monitor updates require the existing purpose-built automation tool,
  unavailable in this session; CURRENT STATE already records the active source.
- `datePublished` must reflect the actual launch, not this drafting date. Add this source to the
  existing monitor only after launch; do not activate it merely because the text exists.
- Related content already covers general automation, feature selection and the eight intake fields.
  Do not duplicate those sections. Link to the relevant guides rather than expanding into them.

Editorial title: **SHK-Chatbot: menschliche Übergabe in sechs Fällen prüfen**

Meta description: **Sechs Abnahmetests für SHK-Website-Assistenten: Kundenwunsch, Sonderfall, Teamübernahme, Feierabend, Gefahr und fehlende Benachrichtigung.**

The reusable customer-facing article begins below. Operational notes above are not website copy.

---

# SHK-Chatbot: menschliche Übergabe in sechs Fällen prüfen

Ein Hinweis „Wir leiten Ihre Anfrage weiter“ ist noch keine funktionierende Übergabe. Für einen
kleinen SHK-Betrieb zählt, ob die richtige Person den Vorgang sieht, ihn übernehmen kann und der
Kunde versteht, was als Nächstes passiert.

Mit sechs einfachen Testfällen prüfen Sie diesen Übergang vor dem Einsatz auf Ihrer Website.
Der Leitfaden bewertet den Ablauf, nicht den Klang einer KI-Stimme. Er ersetzt keine technische,
rechtliche oder sicherheitsfachliche Freigabe.

## Erst drei Zustände voneinander trennen

Eine Übergabe hat nicht nur den Zustand „erledigt“. Unterscheiden Sie mindestens:

- **Weiterleitung angefordert:** Der Kunde oder eine Betriebsregel hat eine Übernahme ausgelöst.
- **Team informiert:** Die Nachricht ist im vorgesehenen internen Kanal angekommen.
- **Mensch hat übernommen:** Eine zuständige Person hat den Vorgang tatsächlich aufgenommen.

Eine versendete E-Mail beweist weder, dass sie jemand gelesen hat, noch dass ein Mitarbeiter bereits
antwortet. Auch außerhalb der Öffnungszeiten kann eine Anfrage aufgenommen sein, ohne dass gerade
jemand verfügbar ist. Kundentext und interner Status müssen diese Unterschiede verständlich machen.

## Test 1: Der Kunde möchte ausdrücklich einen Menschen

**Beispiel:** „Ich möchte dazu mit einem Mitarbeiter schreiben.“

**Prüfen:** Ist der Wunsch im Vorgang sichtbar? Gibt es einen nachvollziehbaren Übernahmeweg?
Vermeidet der Assistent weitere unnötige Routinefragen?

**Bestanden, wenn:** Der Kunde erfährt, dass eine menschliche Bearbeitung angefragt wurde, über
welchen Weg sie erfolgt und ob eine sofortige Antwort überhaupt zu erwarten ist. Es wird kein
bereits anwesender Mitarbeiter behauptet, solange niemand übernommen hat.

**Nicht bestanden:** Der Kunde muss seine Geschichte wiederholen, landet in einer Endlosschleife
oder erhält ohne reale Grundlage die Zusage „Ein Mitarbeiter ist jetzt bei Ihnen“.

## Test 2: Der Kunde verlangt eine Diagnose oder verbindlichen Preis

**Beispiel:** „Die Heizung fällt immer wieder aus. Sagen Sie mir verbindlich, welches Teil kaputt ist
und was die Reparatur kostet.“

**Prüfen:** Bleibt die technische und kaufmännische Entscheidung beim Fachbetrieb? Werden das
Anliegen und bereits freiwillig angegebene Informationen für dessen Prüfung zusammengefasst?

**Bestanden, wenn:** Der Assistent seine Grenze erklärt und eine menschliche Klärung vorbereitet,
statt Ursache, Endpreis oder Reparaturfreigabe zu erfinden. Eine vorhandene Information des Betriebs
muss klar von einer ungeprüften Einzelfallzusage unterscheidbar sein.

**Nicht bestanden:** Eine Vermutung wird als Diagnose ausgegeben oder eine Kostenfrage als Auftrag
behandelt. Eine Übergabe ist keine automatisch angenommene Bestellung.

## Test 3: Ein Mitarbeiter antwortet im bestehenden Vorgang

**Beispiel:** Ein Teammitglied übernimmt die Testanfrage und schreibt eine individuelle Antwort.
Danach ergänzt der Kunde eine Information.

**Prüfen:** Bleiben Nachricht und Antwort im richtigen Vorgang? Ist die Übernahme intern erkennbar?
Wie verhält sich der Assistent nach dem menschlichen Einstieg?

**Bestanden, wenn:** Die neue Kundeninformation erreicht die zuständige Person. Das System verhält
sich nach den festgelegten Übernahmeregeln und erzeugt keine widersprüchlichen parallelen Zusagen.
Eine Rückkehr zur automatischen Bearbeitung muss bewusst geregelt sein.

**Nicht bestanden:** Der Kunde sieht nur eine technische Statusmeldung, Antworten verschwinden in
einem anderen Gespräch oder der Assistent bestätigt eigenmächtig einen anderen Termin.

## Test 4: Die Anfrage kommt nach Feierabend

**Beispiel:** Eine gewöhnliche Wartungsanfrage trifft außerhalb der angegebenen Bürozeiten ein.

**Prüfen:** Stimmen Öffnungszeiten, Kundenhinweis und tatsächlicher Antwortweg überein? Ist die
Vertretung geregelt, falls die gewöhnlich zuständige Person fehlt?

**Bestanden, wenn:** Der Kunde versteht, dass die Anfrage aufgenommen wurde und wann der Betrieb
sie nach seinem eigenen Prozess bearbeiten kann. Es wird weder eine Rund-um-die-Uhr-Besetzung noch
ein Notdienst behauptet, den der Betrieb nicht anbietet.

**Nicht bestanden:** „Sofortige Rückmeldung“ steht im Chat, während der interne Weg erst am nächsten
Arbeitstag geprüft wird. Eine Antwortfrist muss zum Betrieb passen; dieser Leitfaden setzt keine feste Frist.

## Test 5: Die Nachricht enthält einen möglichen Gefahrenhinweis

**Beispiel:** Eine ausdrücklich als Test markierte Nachricht erwähnt Gasgeruch.

**Prüfen:** Wird die gewöhnliche Anfragequalifizierung unterbrochen? Vermeidet das System
Ferndiagnosen, Terminangebote und die Aufforderung, zunächst Bilder aufzunehmen oder weitere
Fragen zu beantworten? Sind die vorgesehenen Sicherheitshinweise und die interne Priorität sichtbar?

**Bestanden, wenn:** Der Ablauf macht klar, dass man bei einer akuten Gefahr nicht auf eine
Chatantwort oder betriebliche Übernahme warten darf. Die zuständige Notfallstelle wird nicht durch
den Website-Assistenten ersetzt. Der Betrieb legt seinen Sicherheitspfad vor dem Einsatz fachlich fest.

Bei echtem Gasgeruch im Gebäude darf ein Telefon dort nicht benutzt werden; der DVGW beschreibt
die Maßnahmen und den Anruf von außerhalb in seinen
[Verhaltensregeln bei Gasgeruch](https://www.dvgw.de/themen/gas/verbraucherinformationen/was-tun-bei-gasgeruch).
Testen Sie ausschließlich mit einer fiktiven Nachricht, niemals durch das Erzeugen einer Gefahr.

**Nicht bestanden:** Das System behandelt den Fall wie eine normale Wartung, fordert ein Foto an
oder vermittelt, eine interne Weiterleitung sei bereits Hilfe vor Ort.

## Test 6: Eine Benachrichtigung erreicht das Team nicht

**Beispiel:** In einer isolierten Testumgebung wird der vorgesehene Benachrichtigungsweg kontrolliert
unterbrochen. Ändern Sie dafür nicht die Erreichbarkeit Ihres laufenden Betriebs.

**Prüfen:** Bleibt die Anfrage im internen Vorgang sichtbar? Kann ein Fehler erkannt und nach dem
betrieblichen Prozess bearbeitet werden? Behauptet die Kundenansicht weiterhin eine erfolgreiche
Übernahme, obwohl es dafür keinen Nachweis gibt?

**Bestanden, wenn:** Fehlende Benachrichtigung und tatsächliche menschliche Übernahme nicht
verwechselt werden. Der Betrieb kennt seinen Rückfallweg und kann offene Vorgänge prüfen. Welche
Kanäle technisch verfügbar sind, muss vorab geklärt sein; SMS, Kalender oder andere Integrationen
sind nicht automatisch Bestandteil eines Website-Assistenten.

**Nicht bestanden:** Der Vorgang geht verloren oder ein fehlgeschlagener Versand wird unsichtbar
als erledigte Übergabe behandelt.

## Ein kleines Protokoll reicht – wenn es überprüfbar ist

Notieren Sie je Testfall:

- Testzeitpunkt und deutlich fiktive Eingabe;
- erwarteten nächsten Schritt und beobachteten Kundentext;
- internen Status, zuständige Rolle und tatsächlichen Benachrichtigungsnachweis;
- menschliche Antwort, falls der Test eine Übernahme vorsieht;
- Ergebnis: bestanden, nachzubessern oder mangels Nachweis noch offen.

Prüfen Sie die Kundenansicht zusätzlich auf einem echten Smartphone. Eine Desktop-Demo beweist
nicht, dass Eingabe, Tastatur, längere Nachrichten und Rückkehr zum Gespräch dort funktionieren.
Verwenden Sie keine echten Kundendaten. Führen Sie schreibende Tests nur in einer freigegebenen
Testumgebung durch und bereinigen Sie die Testvorgänge anschließend nach deren Regeln.

## Was Sie in der ZunftEcho-Demo prüfen können

Die öffentliche Demo zeigt den Ablauf mit Beispieldaten: Kundenanfrage, fehlende Angaben,
Team-Alarm und weitere Bearbeitung. Sie benötigt keine Anmeldung und schreibt keine
Produktionsdaten. Das hilft, die Übergabepunkte zu besprechen; es ist kein Nachweis einer zugestellten
Benachrichtigung oder eines tatsächlich erreichbaren Mitarbeiters in Ihrem Betrieb.

[Übergabepunkte in der Demo ansehen](/demo?source=seo-shk-uebergabe)

Für die Vollständigkeit Ihrer Website-Anfragen gibt es außerdem die
[Checkliste mit acht Prüfpunkten](/website-anfragen-handwerk-checkliste?source=seo-shk-uebergabe).
Eine Verbindung zu Ihrer bestehenden Handwerkersoftware darf nur zugesagt werden, wenn sie
tatsächlich vorhanden und geprüft ist.

## Häufige Fragen

### Ist eine E-Mail-Benachrichtigung bereits eine menschliche Übernahme?

Nein. Versand, Eingang im vorgesehenen Kanal und Übernahme durch eine Person sind unterschiedliche
Nachweise. Legen Sie fest, wer offene Vorgänge prüft und wie die Übernahme sichtbar wird.

### Muss ein Website-Assistent außerhalb der Öffnungszeiten sofort einen Mitarbeiter verbinden?

Nicht für gewöhnliche Anfragen. Die Kundeninformation muss zur realen Verfügbarkeit und zum
Antwortprozess des Betriebs passen. Akute Gefahren gehören nicht in eine gewöhnliche Warteschlange.

### Muss der Assistent nach einer menschlichen Antwort vollständig aufhören?

Sein Verhalten muss zum vereinbarten Übernahmemodell passen. Entscheidend ist, dass Mensch und
System nicht widersprüchlich handeln und eine spätere automatische Bearbeitung klar geregelt ist.

### Reicht die öffentliche Demo für die Abnahme meines Betriebs?

Nein. Eine Demo mit Beispieldaten zeigt das Konzept. Die Abnahme muss zusätzlich den tatsächlichen
Kundenweg, Zuständigkeiten, Benachrichtigungen und Geräte Ihres Betriebs prüfen.
