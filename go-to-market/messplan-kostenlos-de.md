# ZunftEcho - kostenloser und datensparsamer Messplan

Stand: 13. September 2026

Der Inhaber hat am 13. September den tatsächlichen Versand am **7. September 2026** bestätigt.
Die freigegebene Welle umfasst neun Schreiben; `brief-tschichholz` bleibt wegen des dokumentierten
Werbewiderspruchs dauerhaft ausgeschlossen. Das Versanddatum ist nun bestätigt, nicht aber die
Zustellung beim Empfänger. Die 14-Tage-Auswertung ist am **21. September 2026** fällig.

## Entscheidung

Für die erste Briefwelle wird kein zusätzlicher Besucher-Tracker eingebaut. Die
zehn QR-Codes tragen eindeutige `source`-Werte, die durch Demo und Pilotformular
bis in `pilot_requests.source` erhalten bleiben. Gemessen wird damit nur eine
freiwillig abgesendete Pilotanfrage, nicht das bloße Öffnen einer Seite.

Das ist für die erste Zehnerwelle ausreichend, kostet nichts, benötigt keinen
Marketing-Cookie und vermeidet eine unnötige Sammlung von IP-, Geräte- oder
Verhaltensdaten.

## Quellen der ersten Welle

Neun Quellen sind aktiv. `brief-tschichholz` bleibt ausschließlich als
gesperrter historischer Messwert dokumentiert und darf nicht eingesetzt werden.

```text
brief-ro-do
brief-bolowski
brief-grelak
brief-koblitz
brief-wilcks
brief-tim-gaertner
brief-roesch
brief-tschichholz
brief-protoss
brief-a-m
```

## Zusätzliche Quellen des Founding-Pilot-Sprints

```text
linkedin-founding-pilot
referral-founding-pilot
event-it-sicherheitstag
partner-webagentur
direct-demo
```

Diese Quellen werden nur bei einer tatsächlich genutzten, freiwilligen Kontaktstrecke eingesetzt.
Ein Seitenaufruf wird weiterhin nicht gespeichert.

## Aktive eigene Digitalkanäle — 9. September 2026

```text
youtube-video-01
youtube-comment-01
youtube-check-video-01
youtube-community-01
youtube-channel
linkedin-check-01
linkedin-first-pilot-01
website-video-01
```

Der Short mit `youtube-check-video-01` und der Community-Beitrag mit `youtube-community-01` sind
live. Der vorhandene YouTube-Kommentar mit `youtube-comment-01` und der Kanal-Profillink mit
`youtube-channel` führen jetzt zum Anfrage-Check. Die Aktivität des ZunftEcho-Kontos selbst wird
nie als Interessent oder Conversion gezählt.

## Reservierte, noch inaktive Videoquellen — 9. September 2026

```text
youtube-check-video-02
youtube-check-video-03
youtube-higgsfield-video-04
youtube-product-core-01
```

Die ersten drei Quellen gehören zu bereits geplanten YouTube-Shorts und werden erst zum jeweiligen
öffentlichen Veröffentlichungstermin aktiviert. `youtube-product-core-01` gehört zum
QA- und Copyright-geprüften 64-Sekunden-Kernvideo und wurde am 12. September 2026 um 18:30 Uhr
öffentlich veröffentlicht (`https://youtu.be/6wfiYojrUZU`). Die URL wurde nach Fälligkeit erneut
geöffnet; `youtube-product-core-01` ist aktiv. Die übrigen vorbereiteten Quellen werden erst nach ihrer
tatsächlichen Veröffentlichung als aktive Reichweite oder Conversionbasis gewertet.

Der öffentliche Anfrage-Check wurde am 9. September 2026 mit
`source=youtube-product-core-01` vollständig durchlaufen. Seine Ergebnislinks übernahmen die Quelle
erwartungsgemäß mit Score-Suffix (`youtube-product-core-01-s0`) in Demo und Pilotformular. Damit ist
die Zuordnung der freiwilligen Folgeschritte technisch bestätigt; der Test selbst ist kein Lead.

## Reservierte, noch inaktive Partnerquelle — 12. September 2026

```text
partner-onepager-01
```

Die Quelle gehört zum QA-geprüften Partner-One-Pager für Webagenturen. Sie bleibt inaktiv, solange
das Dokument nicht in einem erlaubten Antwort-, Einladungs- oder Referral-Kontext tatsächlich
geteilt wurde. Produktion und eigener QR-Test zählen weder als Reichweite noch als Partnerinteresse.

## Qualifizierungsübersicht

```sql
select
  source,
  team_size_range,
  monthly_inquiry_range,
  primary_challenge,
  preferred_start_window,
  audit_requested,
  status,
  created_at
from public.pilot_requests
where do_not_contact_at is null
order by created_at desc;
```

Die Abfrage ist ausschließlich für die manuelle interne Prüfung. Ergebnisse werden nicht als
öffentliche Kennzahl oder Erfolgsbeleg verwendet.

## Bericht im Supabase SQL Editor

Diese Abfrage liest nur aggregierte Zahlen. Sie erzeugt weder eine Tabelle noch
eine Funktion und ändert keine Daten.

```sql
select
  source,
  count(*) as anfragen,
  count(*) filter (where status = 'qualified') as qualifiziert,
  count(*) filter (where status = 'won') as gewonnen,
  min(created_at) as erste_anfrage,
  max(created_at) as letzte_anfrage
from public.pilot_requests
where source = any (array[
  'brief-ro-do',
  'brief-bolowski',
  'brief-grelak',
  'brief-koblitz',
  'brief-wilcks',
  'brief-tim-gaertner',
  'brief-roesch',
  'brief-tschichholz',
  'brief-protoss',
  'brief-a-m'
]::text[])
group by source
order by source;
```

## Manuelles Versandprotokoll

| Quelle             | versendet am | Antwort | Demo/Pilot | Widerspruch        | nächster Schritt         |
| ------------------ | ------------ | ------- | ---------- | ------------------ | ------------------------ |
| brief-ro-do        | 07.09.2026   | 0       | 0          |                    | IMPROVE, keine Folgewelle |
| brief-bolowski     | 07.09.2026   | 0       | 0          |                    | IMPROVE, keine Folgewelle |
| brief-grelak       | 07.09.2026   | 0       | 0          |                    | IMPROVE, keine Folgewelle |
| brief-koblitz      | 07.09.2026   | 0       | 0          |                    | IMPROVE, keine Folgewelle |
| brief-wilcks       | 07.09.2026   | 0       | 0          |                    | IMPROVE, keine Folgewelle |
| brief-tim-gaertner | 07.09.2026   | 0       | 0          |                    | IMPROVE, keine Folgewelle |
| brief-roesch       | 07.09.2026   | 0       | 0          |                    | IMPROVE, keine Folgewelle |
| brief-tschichholz  |              |         |            | Website 06.09.2026 | dauerhaft ausgeschlossen |
| brief-protoss      | 07.09.2026   | 0       | 0          |                    | IMPROVE, keine Folgewelle |
| brief-a-m          | 07.09.2026   | 0       | 0          |                    | IMPROVE, keine Folgewelle |

## Verifizierte 14-Tage-Auswertung — 21. September 2026

- Neun aktive Briefquellen: **0 menschliche Antworten, 0 Demo-/Pilot-Anfragen, 0 Widersprüche**.
- Beide Projektpostfächer wurden nach den neun Unternehmensdomains seit dem Versand geprüft: keine Treffer.
- Das Produktionsprojekt in Supabase zeigt für `public.pilot_requests` **0 Datensätze insgesamt**; damit ist jede
  der neun aktiven `brief-*`-Quellen ausdrücklich mit 0 belegt, nicht nur durch eine leere Gruppenabfrage.
- Auf der internen Lead-Oberfläche ist kein neuer Eintrag nach dem 13. September sichtbar.
- Einschränkung: Die tatsächliche physische Zustellung der Briefe ist weiterhin unbekannt.
- Entscheidung: **IMPROVE**. Keine automatische zweite Welle, keine Empfängerliste, keine Druckproduktion und kein
  Versand. Vor einem neuen Test werden Segment, Angebot und Text geprüft; ein begründeter Folgetest bleibt auf
  höchstens fünf A-Prioritäten mit frischem 48-Stunden-Check und genau einer Botschaftsänderung begrenzt.

## Auswertung nach 14 Tagen

Fällig am 21. September 2026, gerechnet ab dem durch den Inhaber bestätigten Versand vom 7. September.
Versand allein zählt nicht als Antwort, Interessent oder Conversion. Bis dahin werden echte Inbounds
laufend bearbeitet; es gibt keine automatische Nachfassaktion oder zweite Briefwelle.

- Primär: freiwillige Antworten und qualifizierte Gespräche, nicht Seitenaufrufe.
- Sekundär: abgesendete Pilotanfragen pro eindeutiger Briefquelle.
- Jeder Widerspruch wird sofort dokumentiert und beendet jede weitere Ansprache.
- Bei null Reaktionen zuerst Angebot, Zielgruppe und Brieftext prüfen; nicht
  automatisch mehr Kontakte oder häufigere Nachfassaktionen auslösen.
- Erst bei einer größeren Welle lohnt eine zusätzliche, datenschutzrechtlich
  geprüfte Reichweitenmessung.

### Entscheidungsbereite Prüfung für den 21. September

Vorbereitung abgeschlossen am 13. September; keine vorgezogene Auswertung oder Versandfreigabe.
Am Entscheidungstag die neun aktiven Quellen einzeln mit dem Versandprotokoll abgleichen,
Pilotanfragen und den korrekten Projektposteingang prüfen. Eine leere SQL-Ergebnisliste ist kein
Nachweis von neun erfolgreichen Einzelprüfungen: fehlende Quellen ausdrücklich als 0 dokumentieren,
erst nachdem die Abfrage erfolgreich war. Unbekannte Zustellung bleibt unbekannt; eigene Tests,
automatische Empfangsbestätigungen und Anbieterannahme sind keine menschlichen Antworten.

- **STOP:** Widerspruch oder unpassender Kandidat beendet dessen Kontakt. Ein durch echte Antworten
  widerlegter Bedarf führt zur Neubewertung, nicht zum Versand derselben Botschaft an mehr Betriebe.
- **CONTINUE:** Ein qualifizierter menschlicher Austausch wird zuerst individuell und schriftlich
  bearbeitet. Keine automatische Skalierung oder Aktivierung eines Piloten; Gewerbe-/Rechts-Gates bleiben.
- **IMPROVE:** Bei null menschlichen Reaktionen nach der bestätigten 14-Tage-Frist werden Segment,
  Angebot und Text anhand der vorhandenen Evidenz geprüft. Nur wenn ein begründeter nächster Test
  sinnvoll ist, höchstens fünf A-Prioritäten nach frischer Kanal-/Widerspruch-/Adressprüfung innerhalb
  von 48 Stunden erwägen; genau eine Botschaft ändern. Noch keine Empfängerliste oder Druckproduktion.
- **HOLD wegen Messlücke:** Fehlende Inbox-Abdeckung, fehlgeschlagene Abfrage oder ungeklärte
  Datenzuordnung sind kein Nullergebnis. Zuerst die Lücke schließen; keine Mini-Welle darauf gründen.

Die Entscheidung kurz mit tatsächlichen Zahlen, wörtlichen anonymisierten Einwänden, Einschränkungen,
einer getesteten Änderung (falls vorhanden), Kosten und nächstem Trigger in PROJECT_STATE festhalten.
Das ergänzt die bestehende STOP/CONTINUE/IMPROVE-Regel; es ersetzt keine Strategie oder Kontaktfreigabe.

## Messbasis vor Versand

Am 6. September 2026 lag der aggregierte Ausgangsstand für jede der zehn
`brief-*`-Quellen bei null Konversationen, null Leads und null Pilotanfragen.
Die tägliche, rein lesende Kampagnenüberwachung berücksichtigt ab jetzt neben
den drei digitalen Quellen auch die neun freigegebenen Briefquellen. Die
gesperrte Quelle `brief-tschichholz` bleibt bei null und wird nicht als aktive
Quelle gewertet. Die Überwachung löst keine automatische Nachfassaktion aus.
