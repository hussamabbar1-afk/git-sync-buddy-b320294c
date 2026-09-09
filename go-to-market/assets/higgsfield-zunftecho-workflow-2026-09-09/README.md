# ZunftEcho Higgsfield workflow asset

Stand: 9. September 2026

## Zweck

Dieses Paket erprobt Higgsfield als Quelle für hochwertiges, wiederverwendbares B-Roll innerhalb
der bestehenden ZunftEcho-Identität. Es ersetzt weder die autoritative Bildmarke noch echte
Produktansichten. Logo, Markenname und lesbarer deutscher Text werden ausschließlich im
deterministischen Compositing ergänzt.

## Brand Lock

- Primär: `#087EAA`, Highlight: `#38BDF8`.
- Navy: `#06233B` und `#08213B`.
- Dringlichkeitsakzent: `#F2A34C`; Erfolg: `#22C55E`.
- Hintergrund: `#F7FBFF` bis `#FFF5E8`.
- Display: Space Grotesk; UI/Fließtext: DM Sans.
- Formen: 12–24 px Radius, dünne blau-graue Konturen, weiche Schatten, begrenztes Glassmorphism.
- Bewegung: ruhig, präzise, schrittweise; kein Fahrzeug-Cockpit, kein Sci-Fi-HUD, kein Neon.

Die vollständige projektweite Referenz steht in `go-to-market/zunftecho-visual-identity-lock.md`.

## Dateien

- `reference-frame.svg` / `reference-frame.png`: kontrollierte, textfreie 9:16-Referenz für
  generative Bewegungsmodelle.
- `brand-board.svg` / `brand-board.png`: kompakte Produktionsübersicht der verwendeten Farben,
  Typografie und Formensprache. Im PNG wurde die autoritative Bildmarke unverändert eingebettet.
- `zunftecho-workflow-broll-veo31lite-8s-vertical.mp4`: erster Veo-3.1-Lite-Rohentwurf.
- `contact-sheet.png`: acht Stichproben des ersten Rohentwurfs.
- `zunftecho-controlled-workflow-motion-8s-vertical.mp4`: deterministisch erzeugte, vollständig
  markenkonforme 9:16-Bewegungsfläche mit zwei ruhigen Verbindungspulsen.
- `zunftecho-anfrage-workflow-16s-vertical.mp4`: veröffentlichungsfähiger 16-Sekunden-Short aus
  kontrolliertem Intro, Bewegungsfläche und CTA-Schlusskarte.
- `final-video-preview.png`: acht gleichmäßig verteilte Stichproben des finalen Shorts.

## Generations- und QA-Protokoll

### Veo 3.1 Lite

- Job: `fda19d7d-860b-4f95-93bd-756311b9ccd5`.
- Kosten: 8 Higgsfield-Credits.
- Datei: H.264, 720 × 1280, 24 fps, 8 Sekunden, ohne Audio.
- Ergebnis: **nicht zur Veröffentlichung freigegeben**. Die erste Hälfte besitzt passende
  Kartenbewegung, erzeugt aber unerlaubte Pseudo-Schrift. Die zweite Hälfte interpretiert das
  Dashboard fälschlich als Fahrzeug-Cockpit. Das Video bleibt nur als internes Rohmaterial und
  Bewegungsreferenz erhalten.

### Genjutsu Motion Control

- Job: `cef39d7b-6776-45df-becf-9a23a934406d`.
- Kosten: kostenlose Genjutsu-Generation; keine zusätzlichen Credits.
- Eingaben: kontrollierter `reference-frame.png` plus der Veo-Rohentwurf als reine
  Bewegungsreferenz.
- Freigabe: erst nach vollständiger Dekodierung und visueller Kontrolle auf Pseudo-Schrift,
  Geometrie, Markenfarben, Fahrzeugassoziation und Schleifenfähigkeit.

## Kontrollierte Produktionsfassung

Weil der erste KI-Rohentwurf den QA-Lock verletzte und Genjutsu extern in der Warteschlange steht,
wurde zusätzlich eine deterministische Produktionsfassung erstellt. Sie verwendet ausschließlich
die autoritative Bildmarke, die dokumentierte Palette und kontrollierte deutsche Typografie. Es
werden keine generierten Wörter oder Kundendaten verwendet.

- Final: `zunftecho-anfrage-workflow-16s-vertical.mp4`.
- Format: H.264, `yuv420p`, 1080 × 1920, 30 fps, 16 Sekunden, ohne Audio.
- Vollständige Dekodierung: fehlerfrei.
- Visuelle Prüfung: Intro, beide bewegten Verbindungslinien, Logo, CTA und Schlusskarte geprüft.
- Kampagnenquelle bei Veröffentlichung: `youtube-higgsfield-video-04`.
- Ziel: `https://zunftecho.de/anfrage-check?source=youtube-higgsfield-video-04`.

**Titel**

> Aus Website-Nachrichten werden klare SHK-Anfragen

**Beschreibung**

> Anliegen, Einsatzort, Dringlichkeit, Foto und Terminwunsch: Ein klarer Ablauf macht aus einer
> kurzen Website-Nachricht eine bessere Arbeitsgrundlage für das Team. Der kostenlose
> ZunftEcho-Anfrage-Check zeigt in acht Fragen drei konkrete nächste Schritte – ohne Anmeldung und
> ohne Speicherung der Antworten.
>
> Jetzt kostenlos prüfen:
> https://zunftecho.de/anfrage-check?source=youtube-higgsfield-video-04
>
> Die Auswertung ersetzt keine Rechts- oder Sicherheitsberatung. ZunftEcho stellt keine
> Ferndiagnosen und gibt keine Notdienstversprechen.
>
> #SHK #Handwerk #Digitalisierung
