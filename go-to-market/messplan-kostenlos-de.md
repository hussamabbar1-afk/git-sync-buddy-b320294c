# ZunftEcho - kostenloser und datensparsamer Messplan

Stand: 9. September 2026

Die zehn Schreiben sind gedruckt und kuvertiert. Die Übergabe zum Versand ist
noch nicht durch den Inhaber als tatsächlich erfolgt bestätigt; das Feld `versendet am` bleibt bis
zu dieser Bestätigung bewusst leer und die 14-Tage-Auswertung beginnt nicht am früher nur
vorgesehenen 7. September. Das Schreiben an Andrea Tschichholz wurde
nach dem erneuten Werbewiderspruchs-Check gesperrt und wird aus dem Stapel
entfernt; die aktive Versandwelle umfasst neun Schreiben.

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
QA-bestandenen 64-Sekunden-Kernvideo; Upload und Terminierung stehen noch aus. Keine dieser Quellen
wird vor ihrer tatsächlichen Veröffentlichung als aktive Reichweite oder Conversionbasis gewertet.

Der öffentliche Anfrage-Check wurde am 9. September 2026 mit
`source=youtube-product-core-01` vollständig durchlaufen. Seine Ergebnislinks übernahmen die Quelle
erwartungsgemäß mit Score-Suffix (`youtube-product-core-01-s0`) in Demo und Pilotformular. Damit ist
die Zuordnung der freiwilligen Folgeschritte technisch bestätigt; der Test selbst ist kein Lead.

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
| brief-ro-do        |              |         |            |                    |                          |
| brief-bolowski     |              |         |            |                    |                          |
| brief-grelak       |              |         |            |                    |                          |
| brief-koblitz      |              |         |            |                    |                          |
| brief-wilcks       |              |         |            |                    |                          |
| brief-tim-gaertner |              |         |            |                    |                          |
| brief-roesch       |              |         |            |                    |                          |
| brief-tschichholz  |              |         |            | Website 06.09.2026 | dauerhaft ausgeschlossen |
| brief-protoss      |              |         |            |                    |                          |
| brief-a-m          |              |         |            |                    |                          |

## Auswertung nach 14 Tagen

- Primär: freiwillige Antworten und qualifizierte Gespräche, nicht Seitenaufrufe.
- Sekundär: abgesendete Pilotanfragen pro eindeutiger Briefquelle.
- Jeder Widerspruch wird sofort dokumentiert und beendet jede weitere Ansprache.
- Bei null Reaktionen zuerst Angebot, Zielgruppe und Brieftext prüfen; nicht
  automatisch mehr Kontakte oder häufigere Nachfassaktionen auslösen.
- Erst bei einer größeren Welle lohnt eine zusätzliche, datenschutzrechtlich
  geprüfte Reichweitenmessung.

## Messbasis vor Versand

Am 6. September 2026 lag der aggregierte Ausgangsstand für jede der zehn
`brief-*`-Quellen bei null Konversationen, null Leads und null Pilotanfragen.
Die tägliche, rein lesende Kampagnenüberwachung berücksichtigt ab jetzt neben
den drei digitalen Quellen auch die neun freigegebenen Briefquellen. Die
gesperrte Quelle `brief-tschichholz` bleibt bei null und wird nicht als aktive
Quelle gewertet. Die Überwachung löst keine automatische Nachfassaktion aus.
