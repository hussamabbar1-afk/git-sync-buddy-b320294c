# ZunftEcho – Prozess für neue Pilotanfragen

Stand: 29. August 2026

## Reaktionsziel

Jede freiwillig eingegangene Pilotanfrage erhält spätestens innerhalb eines
Werktags eine persönliche Antwort. Während üblicher Geschäftszeiten ist das
interne Ziel vier Stunden. Automatische Erinnerungen ersetzen diese erste
persönliche Prüfung nicht.

## Eingang prüfen

1. Benachrichtigungs-E-Mail und Datensatz in `pilot_requests` abgleichen.
2. Firma, Ansprechpartner, Website, Quelle, Teamgröße, Anfragevolumen,
   Hauptproblem, Startfenster, Audit-Wunsch und Freitext prüfen.
3. Erkennbaren Spam schließen; einen Werbewiderspruch sofort als
   `do_not_contact_at` dokumentieren.
4. Prüfen, ob der Betrieb zum ersten Fokus passt: SHK, eigene Website,
   wiederkehrende Anfragen und ein erreichbarer Entscheider.
5. Anfrage nach dem ersten tatsächlichen Kontakt von `new` auf `contacted`
   setzen.

## Erste Antwort

Betreff: `Ihre ZunftEcho-Pilotanfrage – die nächsten Schritte per E-Mail`

> Guten Tag {{Ansprechpartner}},
>
> vielen Dank für Ihre Anfrage zum ZunftEcho-Pilot für {{Firma}}. Sie müssen keinen Telefon- oder
> Videotermin buchen. Wir prüfen Ihre Angaben persönlich und klären per E-Mail, welche
> Website-Anfragen heute am meisten Zeit kosten und ob der 30-Tage-Pilot dazu passt.
>
> Bitte antworten Sie kurz: Welche Angabe fehlt am häufigsten, wer bearbeitet die Anfragen heute
> und welcher Fall soll in der Demo gezeigt werden?
>
> Freundliche Grüße  
> ZunftEcho Team

Keine Zahlung, kein Auftrag und kein Pilotstart werden allein durch die Anfrage
ausgelöst.

## Schriftlichen Austausch dokumentieren

Für jede Anfrage werden nach der schriftlichen Klärung folgende Punkte notiert:

- heutiger Eingangskanal und ungefähres Anfragevolumen;
- größter manueller Zeitaufwand;
- gewünschte Leistungen, Gebiete und Erreichbarkeit;
- Dringlichkeits- und Übergaberegeln;
- Einwände zu Preis, Datenschutz oder Einbau;
- Entscheidung: ungeeignet, später, interessiert oder bestätigt;
- nächster Schritt mit verantwortlicher Person und Datum.

Bei echtem Pilotinteresse wird der Status auf `qualified` gesetzt. `won` wird
erst nach ausdrücklicher Beauftragung verwendet; `lost` bei einer klaren Absage
oder dauerhafter Ungeeignetheit.

## Nachfassen

- Die vorhandene Automation darf nur freiwillig eingegangene Anfragen betreffen.
- Erste Erinnerung frühestens nach zwei Tagen, zweite frühestens nach sieben
  Tagen.
- Nach `STOPP`, Widerspruch oder Bitte um keine weitere Kontaktaufnahme sofort
  `do_not_contact_at` setzen; keine weitere Nachricht senden.
- Keine zusätzliche Werbeserie und keine Weitergabe von Kontaktdaten.

## Abschlusskontrolle pro Anfrage

- Quelle ist gespeichert und plausibel.
- Qualifizierungsfelder sind vollständig oder als Altkontakt nachvollziehbar leer.
- Ein manueller Website-Check erfolgt nur, wenn `audit_requested = true` ist.
- Erste Reaktion erfolgte innerhalb eines Werktags.
- Status und Kontaktnotiz stimmen überein.
- Nächster Schritt hat ein Datum oder die Anfrage ist sauber abgeschlossen.
- Persönlicher Name wird nur eingesetzt, wenn Vertrag, Rechnung oder rechtliche
  Identifizierung ihn erfordern; die normale Außenkommunikation bleibt
  ZunftEcho-gebrandet.
