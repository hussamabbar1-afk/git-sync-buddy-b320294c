# ZunftEcho Produkt-Kernvideo — Produktionspaket

Stand: 9. September 2026

## Zweck

Ein 64-sekündiges, bildschirmgeführtes 16:9-Kernvideo für YouTube, Website und freiwillige
Partnerweitergabe. Es zeigt den belegbaren Weg von einer kurzen Website-Nachricht zu einem
strukturierten Arbeitsstand und macht die menschliche Grenze ausdrücklich sichtbar.

## Story

1. Eine kurze Nachricht ist noch keine planbare Anfrage.
2. Einsatzort, Dringlichkeit, Erreichbarkeit und Terminwunsch fehlen häufig.
3. ZunftEcho beginnt beim tatsächlichen Anliegen.
4. Dringende Hinweise werden erkannt und an Menschen übergeben.
5. Aus Antworten entsteht ein klarer Vorgang für den Betrieb.
6. Ein Terminwunsch wird nicht als Terminbestätigung dargestellt.
7. Der Betrieb behält die Entscheidung; keine Ferndiagnose oder automatische Zusage.
8. CTA zum kostenlosen, anonymen Website-Anfrage-Check.

## Dateien

- `zunftecho-produktkern-64s-landscape.mp4`: finale H.264/AAC-Fassung, 1920×1080, 30 fps,
  ruhiges synthetisches Ambient-Bett ohne Fremdrechte;
- `scene-01.png` bis `scene-08.png`: deterministisch gerenderte Szenen;
- `contact-sheet.png`: Gesamtprüfung aller acht Szenen;
- `demo-desktop-tall.png`: am 9. September 2026 erfasste öffentliche Live-Demo mit Beispieldaten;
- `render-scenes.mjs`: reproduzierbares Rendering der Szenen.

## Brand Lock

- unveränderte Bildmarke aus `public/zunftecho-mark.png`;
- Palette: `#06233B`, `#08213B`, `#087EAA`, `#38BDF8`, `#F2A34C`, `#F7FBFF`,
  `#FFF5E8`, `#D8E2EA`, `#607286`, `#22C55E`;
- Systemschrift `Segoe UI` als dokumentierter metrischer Ersatz, weil Space Grotesk und DM Sans auf
  dem Produktionssystem nicht installiert sind;
- ruhige, nahezu statische Bewegung; keine generierte Schrift, keine fremde Marke und keine
  Kundendaten.

## Kampagnenquelle und Status

- reservierte Quelle: `youtube-product-core-01`;
- CTA: `https://zunftecho.de/anfrage-check?source=youtube-product-core-01`;
- Status: produziert und QA-bestanden, **nicht veröffentlicht**;
- die Quelle bleibt bis zur tatsächlichen Veröffentlichung in der Conversionmessung inaktiv.

## QA-Gates

- vollständige Dekodierung über die gesamte Laufzeit: bestanden;
- H.264, `yuv420p`, 1920×1080, 30 fps und AAC-Stereo mit 48 kHz: bestätigt;
- Laufzeit: 64,000 Sekunden; Dateigröße: 11.869.642 Byte;
- Audio: integrierte Lautheit −24,6 LUFS, LRA 6,0 LU, True Peak −13,1 dBFS;
- Sichtprüfung aller acht Szenen und acht gerenderter Zeitstichproben: bestanden; ein erster
  Kontrastfehler in Szene 7 wurde vor der Endfassung behoben;
- exakte Marke, deutsche Rechtschreibung, sichere Ränder und Lesbarkeit bei verkleinerter
  16:9-Wiedergabe: bestätigt;
- keine erfundenen Kunden, Kennzahlen, Partner, Einsparungen oder Sicherheitsversprechen;
- SHA-256:
  `FD8489C416FEF119C657037B2A72478E88513F39FF0A5310BB51BE68F0BA8559`.
