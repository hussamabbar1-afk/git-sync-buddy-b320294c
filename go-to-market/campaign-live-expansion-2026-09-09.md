# ZunftEcho – laufende Kampagnenerweiterung

Stand: 9. September 2026

## Öffentlich ausgeführt

- Der 30,5-sekündige Anfrage-Check-Short wurde auf dem ZunftEcho-Kanal veröffentlicht:
  `https://www.youtube.com/shorts/YhXYXCV0rSI`.
- Titel: `8 Fragen: Wie gut nimmt Ihre SHK-Website Anfragen auf?`
- Die Beschreibung verweist mit `youtube-check-video-01` auf den kostenlosen Anfrage-Check.
- YouTube meldete vor der Veröffentlichung keine urheberrechtlichen Probleme.
- Unter dem Short wurde ein eigener CTA-Kommentar mit derselben Quelle veröffentlicht.
- Der vorhandene Kommentar unter Video `IG5tb2o-ASY` wurde von der Demo auf
  `/anfrage-check?source=youtube-comment-01` umgestellt. Er behält seine bisherige Quelle.
- Zusätzlich wurde ein öffentlicher Community-Beitrag mit dem Short als Videoanlage veröffentlicht:
  `https://www.youtube.com/post/Ugkx7-FUDLplfH2JgDOPX41SN9J7bRcOqYxX`.
  Der eigene Check-Link darin trägt `youtube-community-01`.
- Der bisherige Profil-Hauptlink des YouTube-Kanals wurde von der Live-Demo auf den
  niedrigschwelligeren Anfrage-Check umgestellt:
  `https://zunftecho.de/anfrage-check?source=youtube-channel`. Bestehende Video- und
  Kommentarlinks zur Demo bleiben erhalten; es wurde keine Strecke entfernt.

## Indexierung

- Google Search Console: `/anfrage-check` war zunächst unbekannt. Nach dem am 9. September
  angenommenen Antrag meldet die URL-Prüfung nun „URL ist auf Google“ und „Seite ist indexiert“.
  Das ist ein echter Statuswechsel, aber noch kein Klick oder Interessent.
- Bing Webmaster Tools: URL seit 6. September bekannt, aber noch nicht gecrawlt. Der manuelle
  Indexierungsantrag wurde erfolgreich angenommen.
- Mehrfaches erneutes Einreichen erhöht laut den Oberflächen die Priorität nicht; daher keine
  täglichen Wiederholungen. Die bestehende Überwachung prüft nur Statusänderungen.

## Bekannte Kanalgrenzen

- YouTube verlangt eine einmalige Identitäts-/Telefonbestätigung, bevor externe Links in
  Beschreibungen und Community-Beiträgen anklickbar werden und bevor eigene Vorschaubilder,
  angeheftete Kommentare oder Short-Verknüpfungen verfügbar sind. Keine Identitäts- oder
  Sicherheitseinstellung wurde stellvertretend geändert. URLs bleiben sichtbar und kopierbar.
- LinkedIn blockiert einen neuen Share-Entwurf weiterhin hinter der EU-Entscheidung zur Verknüpfung
  von LinkedIn-Diensten. Diese Datenschutzentscheidung wurde nicht stellvertretend getroffen;
  deshalb entstand dort in diesem Lauf kein neuer Beitrag.

## Messung und Grenzen

- Neue Live-Quellen: `youtube-check-video-01` und `youtube-community-01`; `youtube-channel` bleibt
  als bestehende Kanalquelle erhalten und führt jetzt zum Anfrage-Check.
- Der ältere `youtube-comment-01` bleibt separat, wurde aber auf den Anfrage-Check umgeleitet.
- Eigene Videoaufrufe, Upload-Prüfungen, eigene Kommentare und eigene Community-Beiträge sind keine
  Interessenten oder Conversions.
- Die tägliche Überwachung bis 16. September wurde um beide neuen Quellen, den Short und den
  Community-Beitrag ergänzt.
- Kein bezahltes Placement, keine kalte E-Mail, keine Massen-DM, keine neue Briefwelle, kein
  Abonnement und keine Rechnungs-/Stripe-Aktivierung wurden ausgelöst.

## Unmittelbare Eingangskontrolle

Das tatsächliche Cloudflare-Routing-Ziel, Gmail-Konto des Inhabers mit Suffix `4`, wurde nach der
Veröffentlichung mit einer engen Suche nach Craftboxx, HERO, Plancraft, Badheld, KIMEO, HeWo und
Bauleo geprüft. Gefunden wurden nur die automatische Eingangsbestätigung von Craftboxx und die
bereits bekannte HeWo-Antwort. Es lag kein neuer menschlicher Interessent vor und es wurde keine
Nachricht erneut versandt.

## Nächste Inhalte sind produktionsbereit

Noch am 9. September wurden die zwei Folgestücke vollständig produziert, statt die Kampagne während
der ersten Messphase untätig zu lassen:

- Video B: `assets/anfrage-check-video-b-2026-09-09/` — 26 Sekunden zum Unterschied zwischen
  Standardformular und vollständigem Anfrageablauf; vorgesehene Quelle `youtube-check-video-02`.
- Video C: `assets/anfrage-check-video-c-2026-09-09/` — 24 Sekunden zum gemeinsamen Auswerten mit
  Team oder Webagentur; vorgesehene Quelle `youtube-check-video-03`.

Beide Shorts sind vollständig dekodiert und visuell geprüft, enthalten keine Kunden- oder
Kontaktdaten und bleiben vorerst unveröffentlicht. Das ist kein Leerlauf: Video A erhält eine eigene
organische Lernphase, während die nächste Veröffentlichung ohne Produktionsverzug bereitsteht.
Nicht veröffentlichte Quellen werden nicht in die Conversionauswertung aufgenommen.

## Organische Suchstrecke erweitert

Als nächste eigene Akquisitionsfläche wurde der Leitfaden
`/website-anfragen-handwerk-checkliste` vorbereitet. Er beantwortet die acht praktischen Bereiche
Anliegen, Einsatzort, Dringlichkeit, Erreichbarkeit, Termin, Fotos, Datenminimierung und Übergabe und
führt mit der Quelle `seo-anfrage-check-checkliste` zum kostenlosen Anfrage-Check. Die Seite enthält
Article- und FAQPage-Strukturdaten, ist intern aus `/wissen` verlinkt und steht in der Sitemap.

Die Seite wurde bei 390 und 1.440 Pixel Breite visuell geprüft. Produktionsbuild, 57 Regressionstests,
ESLint, `npm audit` ohne Findings und Wrangler-Dry-Run sind erfolgreich. Der defekte bisherige
`vite preview`-Pfad wurde durch eine lokale Wrangler-Vorschau des tatsächlichen `.output`-Workers
ersetzt; Wrangler ist nur Entwicklungsabhängigkeit und wird nicht an Besucher ausgeliefert.
