# ZunftEcho - kostenloser und datensparsamer Messplan

Stand: 29. August 2026

## Entscheidung

Für die erste Briefwelle wird kein zusätzlicher Besucher-Tracker eingebaut. Die
zehn QR-Codes tragen eindeutige `source`-Werte, die durch Demo und Pilotformular
bis in `pilot_requests.source` erhalten bleiben. Gemessen wird damit nur eine
freiwillig abgesendete Pilotanfrage, nicht das bloße Öffnen einer Seite.

Das ist für die erste Zehnerwelle ausreichend, kostet nichts, benötigt keinen
Marketing-Cookie und vermeidet eine unnötige Sammlung von IP-, Geräte- oder
Verhaltensdaten.

## Quellen der ersten Welle

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

| Quelle | versendet am | Antwort | Demo/Pilot | Widerspruch | nächster Schritt |
| --- | --- | --- | --- | --- | --- |
| brief-ro-do |  |  |  |  |  |
| brief-bolowski |  |  |  |  |  |
| brief-grelak |  |  |  |  |  |
| brief-koblitz |  |  |  |  |  |
| brief-wilcks |  |  |  |  |  |
| brief-tim-gaertner |  |  |  |  |  |
| brief-roesch |  |  |  |  |  |
| brief-tschichholz |  |  |  |  |  |
| brief-protoss |  |  |  |  |  |
| brief-a-m |  |  |  |  |  |

## Auswertung nach 14 Tagen

- Primär: freiwillige Antworten und qualifizierte Gespräche, nicht Seitenaufrufe.
- Sekundär: abgesendete Pilotanfragen pro eindeutiger Briefquelle.
- Jeder Widerspruch wird sofort dokumentiert und beendet jede weitere Ansprache.
- Bei null Reaktionen zuerst Angebot, Zielgruppe und Brieftext prüfen; nicht
  automatisch mehr Kontakte oder häufigere Nachfassaktionen auslösen.
- Erst bei einer größeren Welle lohnt eine zusätzliche, datenschutzrechtlich
  geprüfte Reichweitenmessung.
