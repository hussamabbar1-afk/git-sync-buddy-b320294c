# ZunftEcho – Visual Identity Lock

Stand: 9. September 2026  
Status: verbindliche Produktionsreferenz für Website, organische Kampagne und neue Bewegtbild-Assets

## 1. Markenbestandteile

- Öffentlicher Markenname: `ZunftEcho`.
- Autoritative Bildmarke: `public/zunftecho-mark.png`. Die Geometrie wird nicht neu gezeichnet,
  vereinfacht oder von einem Bildmodell angenähert.
- Die Bildmarke verbindet eine abstrahierte Haus-/Werkstattkontur mit einem Echo-Signal. Dieses
  Motiv darf als Bewegungsprinzip aufgegriffen werden; die eigentliche Marke bleibt unverändert.
- Der Zusatz `FÜR SHK-BETRIEBE` darf nur gesetzt werden, wenn er bei der Zielgröße lesbar bleibt.

## 2. Farben

Die Website-Tokens in `src/styles.css` bleiben die technische Quelle für die Produktoberfläche.
Für gerenderte Kampagnenmedien gelten die bereits verwendeten, reproduzierbaren Hex-Werte:

| Rolle | Wert | Anwendung |
| --- | --- | --- |
| Tiefes Navy | `#06233B` | dunkle Flächen, Schlusskarten, kontrastreiche UI-Zonen |
| Text-Navy | `#08213B` | Überschriften, starke Konturen, dunkle Typografie |
| Primärblau | `#087EAA` | CTA, Statuslinien, zentrale Markensignale |
| Helles Cyan | `#38BDF8` | Verbindungspulse, Highlights, sparsame Lichtakzente |
| Warmes Orange | `#F2A34C` | Dringlichkeit und einzelne Aufmerksamkeitsakzente |
| Helles Blauweiß | `#F7FBFF` | primärer heller Hintergrund |
| Warmes Weiß | `#FFF5E8` | sehr dezenter Hintergrundverlauf, keine dominante Beige-Fläche |
| Liniengrau | `#D8E2EA` | feine Ränder und Trenner |
| Sekundärtext | `#607286` | erklärende Texte und Metadaten |
| Erfolg | `#22C55E` | bestätigte oder vollständige Zustände |

Orange und Grün sind Statusfarben, keine gleichberechtigten Primärfarben. Neon, Violett,
Schwarzflächen ohne Navy-Anteil und beliebige Regenbogenverläufe gehören nicht zur Marke.

## 3. Typografie

- Display/Überschriften: `Space Grotesk`, vorzugsweise 600–700.
- Fließtext und UI: `DM Sans`, vorzugsweise 400–600.
- Überschriften verwenden eine enge Laufweite von ungefähr `-0.02em`.
- In Videos werden Texte nachträglich deterministisch gesetzt. Generative Modelle dürfen keine
  Wörter, Buchstaben, Zahlen oder Pseudo-Schrift erzeugen.
- Ersatzschrift ist nur für technische Zwischenprodukte zulässig; veröffentlichte Assets werden
  mit den Markenfonts oder einer dokumentierten metrischen Ersatzschrift gerendert.

## 4. Form- und Materialsystem

- Grundradius der Oberfläche: 12 px; große Karten 16–24 px; runde Status-Chips dürfen pillenförmig
  sein.
- Karten: weiß bis leicht transparent, dünner blau-grauer Rand, weicher mehrstufiger Schatten.
- Glassmorphism bleibt auf Navigations-, Live-Demo- oder Fokusflächen begrenzt: leichte Transparenz,
  kleiner Blur und klare Kontur. Keine vollflächige Milchglasästhetik.
- Linien und Icons sind geometrisch, ruhig und aufrecht. Sie verwenden runde Enden und bleiben auch
  in kleinen Größen verständlich.
- Hintergründe dürfen ein sehr feines Raster, weiche Cyan-/Orange-Lichthöfe und das Echo-Kreis-Motiv
  verwenden. Die Lesbarkeit und Weißfläche bleiben dominant.

## 5. Komposition

- Klare linke Textachse und eine fokussierte Produktansicht oder ein Ablaufdiagramm bilden die
  bevorzugte Desktop-Komposition.
- Mobile Formate verwenden eine einzige vertikale Hierarchie mit großen sicheren Rändern; wichtige
  Elemente liegen innerhalb der mittleren 80 Prozent der Breite.
- Pro Szene gibt es einen Hauptfokus. Karten werden nicht dekorativ gestapelt, wenn sie keinen
  Ablauf erklären.
- Das visuelle Versprechen lautet: aus einer unstrukturierten Anfrage entsteht ein vollständiger,
  prüfbarer Arbeitsstand. Jede Animation muss diesen Übergang verständlich machen.

## 6. Bewegungsregeln

- Bewegungen sind präzise und ruhig: Fade/Slide, kurzer Verbindungspuls, schrittweiser Aufbau und
  ein eindeutiger Abschlusszustand.
- Kamerafahrten bleiben nahezu statisch; maximal ein sanfter Push-in. Kein Wackeln, kein hektischer
  Zoom und keine schnellen, unmotivierten Schnitte.
- Dauerhafte Mikroanimationen laufen langsam und mit geringer Amplitude. `prefers-reduced-motion`
  bleibt bei Webanwendungen maßgeblich.
- Das Echo-Signal darf als auslaufender Kreis oder kurzer Linienpuls erscheinen. Starke Neon-Glows,
  Sci-Fi-HUDs und Fahrzeug-/Maschinen-Cockpits sind ausgeschlossen.

## 7. Inhaltliche Grenzen für Kampagnenmedien

- Keine erfundenen Kundenstimmen, Kennzahlen, Partnerlogos oder Resultate.
- Keine Ferndiagnose oder fachliche Zusage durch die KI darstellen.
- Keine echten Kunden-, Adress-, Telefon-, Termin- oder Projektdaten in generativen Diensten.
- Generierte Produktbewegung bleibt text- und logofrei. Markenname, CTA und exakte Bildmarke werden
  erst im kontrollierten Compositing ergänzt.
- Aussagen bleiben mit der Live-Demo und dem kostenlosen Anfrage-Check belegbar.

## 8. Produktions-QA

Vor Veröffentlichung jedes Assets werden mindestens geprüft:

1. exakte Schreibweise `ZunftEcho` und nur die autoritative Bildmarke;
2. 9:16 bei Shorts/Reels, 16:9 bei Website-/LinkedIn-Langformaten;
3. keine Pseudo-Schrift, deformierten Icons, fremden Logos oder Daten;
4. Palette, Kontrast, sichere Ränder und ruhige Bewegung;
5. vollständige Dekodierung, H.264-Kompatibilität und visuelle Stichproben über die gesamte Laufzeit;
6. eindeutige Kampagnenquelle im finalen CTA, sofern das Asset veröffentlicht wird.
