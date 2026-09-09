import { createFileRoute } from "@tanstack/react-router";

import {
  KnowledgeArticle,
  type KnowledgeFaq,
  type KnowledgeSection,
} from "@/components/knowledge-article";

const sections: KnowledgeSection[] = [
  {
    title: "Eine gute Website-Anfrage ist vor dem Rückruf verständlich",
    paragraphs: [
      "Eine neue Nachricht muss nicht bereits die komplette Auftragsklärung ersetzen. Sie sollte dem Betrieb aber genug Kontext geben, um den Fall einzuordnen, die richtige Person zuzuweisen und den nächsten Schritt vorzubereiten.",
      "Die folgenden acht Prüfpunkte gelten unabhängig davon, ob die Website ein Formular oder einen geführten Anfrageassistenten nutzt. Entscheidend ist das Ergebnis für Kunde und Team, nicht die Zahl der sichtbaren Felder.",
    ],
  },
  {
    title: "1. Anliegen und gewünschte Leistung trennen",
    paragraphs: [
      "Ein Freitext wie „Heizung geht nicht“ lässt viele Möglichkeiten offen. Eine verständliche Leistungsauswahl und eine kurze Beschreibung helfen, Wartung, Störung, Sanierung oder ein anderes Anliegen früh zu unterscheiden.",
    ],
  },
  {
    title: "2. Einsatzort vollständig erfassen",
    paragraphs: [
      "Der Wohnort des Kunden und der tatsächliche Einsatzort sind nicht immer identisch. Straße, Hausnummer, Postleitzahl und Ort sollten deshalb als Einsatzadresse bestätigt werden. Eine automatische Standorterkennung darf nur freiwillig sein und braucht eine sichtbare Korrekturmöglichkeit.",
    ],
  },
  {
    title: "3. Dringlichkeit plausibel einordnen",
    paragraphs: [
      "Dringlichkeit sollte nicht nur aus einem einzelnen Etikett wie „dringend“ bestehen. Konkrete Hinweise auf Wasser, Gasgeruch, Strom oder andere Gefahren brauchen einen gesonderten Sicherheitspfad und eine klare Aufforderung, im akuten Fall die zuständige Notfallstelle zu kontaktieren.",
      "Ein digitaler Ablauf ersetzt keine Ferndiagnose. Er muss riskante Fälle aus der normalen Warteschlange heraushalten und an einen Menschen übergeben.",
    ],
  },
  {
    title: "4. Rückruf und Erreichbarkeit vorbereiten",
    paragraphs: [
      "Eine Telefonnummer allein sagt noch nicht, wann jemand erreichbar ist. Ein bevorzugter Kontaktweg und ein realistisches Zeitfenster vermeiden wiederholte erfolglose Rückrufversuche. Gleichzeitig sollte immer erkennbar bleiben, dass die endgültige Reaktion vom Betrieb kommt.",
    ],
  },
  {
    title: "5. Terminwunsch und Bestätigung unterscheiden",
    paragraphs: [
      "Ein ausgewähltes Zeitfenster ist zunächst ein Wunsch. Erst eine ausdrückliche Bestätigung des Betriebs macht daraus einen bestätigten Termin. Diese Unterscheidung muss in der Zusammenfassung, in Benachrichtigungen und in allen internen Ansichten dieselbe sein.",
    ],
  },
  {
    title: "6. Fotos nur freiwillig und mit klarem Zweck anbieten",
    paragraphs: [
      "Ein Foto kann die Vorbereitung erleichtern, sollte aber nicht für jedes Anliegen verpflichtend sein. Die Oberfläche sollte verbreitete Smartphone-Formate verarbeiten, Größe oder Komprimierung verständlich erklären und nach der Auswahl klar zeigen, ob die Datei wirklich übertragen wurde.",
    ],
  },
  {
    title: "7. Nur notwendige Angaben verlangen",
    paragraphs: [
      "Mehr Felder erzeugen nicht automatisch bessere Anfragen. Jeder Schritt braucht einen erkennbaren Zweck. Datenschutzinformation, freiwillige Angaben und der Zeitpunkt einer tatsächlichen Übermittlung sollten in einfacher Sprache sichtbar sein.",
    ],
  },
  {
    title: "8. Zuständigkeit und nächsten Schritt festlegen",
    paragraphs: [
      "Nach dem Absenden braucht die Anfrage einen Besitzer: Wer wird informiert, welche Fälle werden hervorgehoben und wann erhält der Kunde eine Antwort? Ohne diese Übergabe bleibt auch eine vollständig ausgefüllte Anfrage nur ein weiterer Posteingang.",
    ],
    bullets: [
      "Der Kunde erhält eine verständliche Zusammenfassung seiner Angaben.",
      "Das Team erkennt Priorität, Einsatzort und bevorzugte Erreichbarkeit auf einen Blick.",
      "Terminwunsch, bestätigter Termin und menschliche Übergabe sind klar getrennt.",
      "Kritische Fälle verschwinden nicht in derselben Warteschlange wie normale Anfragen.",
    ],
  },
  {
    title: "So testen Sie den bestehenden Ablauf",
    paragraphs: [
      "Prüfen Sie die Website auf einem echten Smartphone mit drei Beispielen: einer normalen Wartung, einer unvollständigen Störungsmeldung und einem möglichen Gefahrenhinweis. Kontrollieren Sie anschließend nicht nur die Bestätigung im Browser, sondern auch die interne Übergabe an das Team.",
      "Der kostenlose ZunftEcho-Anfrage-Check führt dieselben Kernbereiche in acht Fragen zusammen und gibt danach drei konkrete Prioritäten aus. Die Antworten bleiben lokal im Browser; erst eine bewusst abgesendete Pilotanfrage übermittelt Kontaktdaten.",
    ],
  },
];

const faq: KnowledgeFaq[] = [
  {
    question: "Welche Felder braucht ein Kontaktformular für einen Handwerksbetrieb?",
    answer:
      "In der Praxis sind Anliegen, Name, verlässlicher Kontaktweg und Einsatzort häufig die Grundlage. Welche weiteren Angaben sinnvoll sind, hängt von Leistung und Ablauf des Betriebs ab. Verlangen Sie nur Daten, die für Einordnung oder Rückmeldung tatsächlich benötigt werden.",
  },
  {
    question: "Sind möglichst viele Pflichtfelder besser?",
    answer:
      "Nein. Zu viele Pflichtfelder erhöhen die Hürde auf dem Smartphone. Ein schrittweiser Ablauf kann notwendige Angaben passend zum Anliegen abfragen und freiwillige Informationen klar kennzeichnen.",
  },
  {
    question: "Darf ein Termin direkt online bestätigt werden?",
    answer:
      "Nur wenn Verfügbarkeit und betrieblicher Prozess das zuverlässig erlauben. Andernfalls sollte die Website ausdrücklich von einem Terminwunsch sprechen, den der Betrieb später bestätigt.",
  },
  {
    question: "Speichert der ZunftEcho-Anfrage-Check meine Antworten?",
    answer:
      "Nein. Die acht Auswahlen und die Auswertung bleiben im Browser. Kontaktdaten werden erst übertragen, wenn eine separate Pilotanfrage bewusst abgesendet wird.",
  },
];

export const Route = createFileRoute("/website-anfragen-handwerk-checkliste")({
  head: () => ({
    meta: [
      { title: "Website-Anfragen im Handwerk: Checkliste mit 8 Punkten – ZunftEcho" },
      {
        name: "description",
        content:
          "Acht Prüfpunkte für bessere Website-Anfragen im Handwerk: Anliegen, Einsatzort, Dringlichkeit, Erreichbarkeit, Termin, Fotos, Daten und Übergabe.",
      },
      {
        property: "og:title",
        content: "Website-Anfragen im Handwerk: 8 Punkte für einen klaren Ablauf",
      },
      {
        property: "og:description",
        content:
          "Praktische Checkliste für vollständige, priorisierte und mobil verständliche Handwerksanfragen.",
      },
      { property: "og:type", content: "article" },
      {
        property: "og:url",
        content: "https://zunftecho.de/website-anfragen-handwerk-checkliste",
      },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://zunftecho.de/website-anfragen-handwerk-checkliste",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: "Website-Anfragen im Handwerk: Checkliste mit 8 Prüfpunkten",
              description:
                "Praxischeckliste für vollständige und klar übergebene Website-Anfragen im Handwerk.",
              inLanguage: "de-DE",
              datePublished: "2026-09-09",
              dateModified: "2026-09-09",
              mainEntityOfPage: "https://zunftecho.de/website-anfragen-handwerk-checkliste",
              author: { "@type": "Organization", name: "ZunftEcho" },
              publisher: {
                "@type": "Organization",
                name: "ZunftEcho",
                logo: {
                  "@type": "ImageObject",
                  url: "https://zunftecho.de/zunftecho-mark.png",
                },
              },
            },
            {
              "@type": "FAQPage",
              mainEntity: faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ],
        }),
      },
    ],
  }),
  component: WebsiteAnfragenHandwerkCheckliste,
});

function WebsiteAnfragenHandwerkCheckliste() {
  return (
    <KnowledgeArticle
      kicker="Checkliste für die Praxis"
      title="Website-Anfragen im Handwerk: acht Punkte für einen klaren Ablauf"
      intro="Eine gute Anfrage enthält nicht möglichst viele Felder. Sie gibt Kunde und Betrieb genau die Informationen, die für Einordnung, Rückmeldung und Übergabe nötig sind."
      readingTime="8 Minuten"
      source="seo-anfrage-check-checkliste"
      sections={sections}
      faq={faq}
      cta={{
        eyebrow: "Kostenlos und anonym",
        title: "Wie vollständig ist Ihr Anfrageweg?",
        text: "Acht Fragen zeigen sofort drei konkrete Verbesserungen. Die Antworten bleiben im Browser.",
        href: "/anfrage-check",
        label: "Anfrage-Check starten",
      }}
    />
  );
}
