import { createFileRoute } from "@tanstack/react-router";

import {
  KnowledgeArticle,
  type KnowledgeFaq,
  type KnowledgeSection,
} from "@/components/knowledge-article";

const title = "Chatbot für Handwerksbetriebe: Was er können muss – und was nicht";
const description =
  "Entscheidungshilfe für Handwerksbetriebe: Funktionen, Grenzen, Datenschutz und Qualitätskriterien eines Website-Chatbots.";

const sections: KnowledgeSection[] = [
  {
    title: "Ein Chatfenster allein löst noch kein Betriebsproblem",
    paragraphs: [
      "Viele Chatbots beantworten allgemeine Fragen, erzeugen aber trotzdem eine unvollständige E-Mail. Für einen Handwerksbetrieb entsteht Wert erst dann, wenn aus dem Gespräch ein klarer Vorgang mit Ansprechpartner, Einsatzort, Anliegen und nächstem Schritt wird.",
      "Die wichtigste Kaufentscheidung lautet deshalb nicht: Wie menschlich klingt der Bot? Sondern: Welche Arbeit nimmt er dem Büro wirklich ab, und wann holt er einen Menschen dazu?",
    ],
  },
  {
    title: "Sieben Prüfpunkte vor dem Einsatz",
    paragraphs: [
      "Eine kurze Demo sollte den gesamten Ablauf zeigen. Reine Bildschirmbilder oder vorgefertigte Antworten reichen für eine belastbare Entscheidung nicht aus.",
    ],
    bullets: [
      "Der Assistent verwendet Firmenname, Leistungen, Gebiete und Öffnungszeiten des Betriebs.",
      "Pflichtangaben werden schrittweise erfasst und vom Kunden bestätigt.",
      "Gefahrenhinweise und verärgerte Kunden lösen eine menschliche Übergabe aus.",
      "Termine stammen aus echten Verfügbarkeiten oder bleiben ausdrücklich unverbindliche Wünsche.",
      "Fotos und Standortdaten sind optional und werden erst nach Zustimmung verarbeitet.",
      "Das Team kann Gespräch, Lead und Status zentral einsehen und direkt antworten.",
      "Datenschutz, Löschung, Rollen und Änderungen sind nachvollziehbar geregelt.",
    ],
  },
  {
    title: "Was der Assistent nicht versprechen sollte",
    paragraphs: [
      "Ohne Prüfung durch einen Fachbetrieb sollte ein Chatbot keine verbindliche Diagnose, keinen Endpreis und keine technische Freigabe geben. Auch ein scheinbar einfacher Fehler kann vor Ort anders aussehen.",
      "Gute Systeme formulieren Unsicherheit offen, sammeln die relevanten Fakten und leiten weiter. Das schützt Kunden, Betrieb und die Glaubwürdigkeit der Marke.",
    ],
  },
  {
    title: "Datenschutz beginnt beim Umfang der Daten",
    paragraphs: [
      "Es sollten nur Angaben erhoben werden, die für Anfrage und Termin wirklich nötig sind. Standortfreigabe und Bilder brauchen einen klaren Zweck und eine freiwillige Entscheidung. Der Kunde muss erkennen, dass er mit einem digitalen Assistenten spricht.",
      "Ebenso wichtig sind interne Regeln: Wer sieht Gespräche? Wie lange bleiben Anhänge gespeichert? Wie wird ein Auskunfts- oder Löschwunsch bearbeitet? Diese Fragen gehören vor den Produktivstart, nicht erst nach der ersten Beschwerde.",
    ],
  },
  {
    title: "Ein sinnvoller Pilot ist klein, echt und messbar",
    paragraphs: [
      "Ein 30-Tage-Pilot sollte den Assistenten auf einer echten Website mit den tatsächlichen Leistungen des Betriebs prüfen. Dabei werden keine Fantasie-Kennzahlen versprochen. Der Vergleich erfolgt mit dem bisherigen Ablauf.",
      "Am Ende muss klar sein, ob Anfragen vollständiger sind, das Team schneller reagieren kann und welche Regeln noch angepasst werden müssen. Erst dann ist eine monatliche Fortsetzung sinnvoll.",
    ],
  },
];

const faq: KnowledgeFaq[] = [
  {
    question: "Ist ein Chatbot nur für große Handwerksbetriebe sinnvoll?",
    answer:
      "Nein. Gerade kleine Teams profitieren, wenn niemand dauerhaft am Telefon oder im E-Mail-Postfach sitzen kann. Der Umfang muss aber zum tatsächlichen Anfragevolumen passen.",
  },
  {
    question: "Muss jede Antwort durch KI erzeugt werden?",
    answer:
      "Nein. Sicherheitsregeln, Öffnungszeiten, Leistungen und Buchungslogik sollten deterministisch abgesichert sein. Freie Sprache hilft beim Verstehen, ersetzt aber keine festen Betriebsregeln.",
  },
  {
    question: "Wie wird der Chatbot auf der Website eingebaut?",
    answer:
      "Üblicherweise genügt ein kleines Script vor dem schließenden Body-Tag. Für WordPress, Wix, Webflow und ähnliche Systeme lässt sich derselbe Einbau über deren Code- oder Embed-Bereich vornehmen.",
  },
];

export const Route = createFileRoute("/chatbot-fuer-handwerksbetriebe")({
  head: () => ({
    meta: [
      { title: `${title} – ZunftEcho` },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://zunftecho.de/chatbot-fuer-handwerksbetriebe" },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/chatbot-fuer-handwerksbetriebe" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          datePublished: "2026-08-29",
          dateModified: "2026-08-29",
          inLanguage: "de-DE",
          author: { "@type": "Organization", name: "ZunftEcho" },
          publisher: { "@type": "Organization", name: "ZunftEcho" },
          mainEntityOfPage: "https://zunftecho.de/chatbot-fuer-handwerksbetriebe",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }),
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <KnowledgeArticle
      kicker="Entscheidungshilfe für Betriebe"
      title={title}
      intro={description}
      readingTime="8 Minuten"
      source="seo-chatbot-handwerk"
      sections={sections}
      faq={faq}
    />
  );
}
