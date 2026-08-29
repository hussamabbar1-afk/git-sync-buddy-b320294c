import { createFileRoute } from "@tanstack/react-router";

import {
  KnowledgeArticle,
  type KnowledgeFaq,
  type KnowledgeSection,
} from "@/components/knowledge-article";

const title = "SHK-Anfragen automatisieren, ohne die persönliche Kontrolle zu verlieren";
const description =
  "So strukturieren SHK-Betriebe Website-Anfragen, erkennen dringende Fälle und übergeben vollständige Informationen an Büro und Monteure.";

const sections: KnowledgeSection[] = [
  {
    title: "Das eigentliche Problem ist selten zu wenig Nachfrage",
    paragraphs: [
      "Viele SHK-Websites haben bereits Kontaktformulare, Telefonnummern und Rückrufoptionen. Trotzdem beginnt die Arbeit im Büro oft erst nach dem Absenden: Welche Anlage ist betroffen? Wo liegt der Einsatzort? Ist Wasser ausgetreten? Wann ist der Kunde erreichbar?",
      "Automatisierung ist dann sinnvoll, wenn sie diese Rückfragen vorzieht. Sie sollte nicht blind antworten, sondern aus einer unvollständigen Nachricht einen verwertbaren Vorgang machen.",
    ],
  },
  {
    title: "Diese Angaben gehören in jede qualifizierte Anfrage",
    paragraphs: [
      "Der genaue Fragenbaum hängt von den Leistungen des Betriebs ab. Ein stabiler Grundablauf bleibt jedoch gleich und kann für Wartung, Störung, Reparatur oder Modernisierung angepasst werden.",
    ],
    bullets: [
      "Name und verlässliche Rückrufmöglichkeit des Kunden",
      "Einsatzadresse und Prüfung des Servicegebiets",
      "Betroffene Leistung oder Anlage und verständliche Problembeschreibung",
      "Dringlichkeit, sichtbare Gefahren und bereits getroffene Sicherheitsmaßnahmen",
      "Terminwunsch auf Basis tatsächlich verfügbarer Zeiten",
      "Optionale Fotos – freiwillig, begrenzt und dem Vorgang eindeutig zugeordnet",
    ],
  },
  {
    title: "Notfälle dürfen nie wie normale Leads behandelt werden",
    paragraphs: [
      "Hinweise auf Gasgeruch, Feuer, starken Wasseraustritt oder gesundheitliche Gefahr brauchen einen eigenen Pfad. Der Kunde erhält sofort klare Sicherheitshinweise. Parallel wird der Vorgang markiert und an einen Menschen übergeben.",
      "Ein Dashboard-Hinweis allein reicht nicht aus, weil Inhaber und Monteure unterwegs sind. Kritische Übergaben sollten zusätzlich über einen externen Kanal gemeldet und gegen eine Reaktionsfrist überwacht werden.",
    ],
  },
  {
    title: "Automatisierung endet an einer klaren Übergabestelle",
    paragraphs: [
      "Ein guter Assistent kennt seine Grenzen. Sonderfälle, verärgerte Kunden, unklare Diagnosen und Preiszusagen gehören zu einem Mitarbeiter. Die Aufgabe des Systems ist nicht, einen Handwerker zu ersetzen, sondern die Übernahme vorzubereiten.",
      "Damit das Team Vertrauen entwickelt, muss sichtbar bleiben, was der Kunde geschrieben hat, welche Daten er bestätigt hat und warum eine Übergabe ausgelöst wurde.",
    ],
    bullets: [
      "Übergabegrund und Dringlichkeit sind sofort sichtbar.",
      "Der Mitarbeiter kann direkt aus demselben Vorgang antworten.",
      "Überfällige Übergaben werden farblich und extern signalisiert.",
      "Änderungen an Regeln und Assistenten-Einstellungen bleiben nachvollziehbar.",
    ],
  },
  {
    title: "Klein starten und den Nutzen messen",
    paragraphs: [
      "Für einen ersten Pilot reicht eine klar abgegrenzte Website, ein Betrieb und eine kleine Zahl typischer Leistungen. Entscheidend ist, ob mehr vollständige Anfragen ankommen und ob sich Rückfragen oder Reaktionszeit verringern.",
      "Nach 30 Tagen sollten nicht nur Chat-Zahlen betrachtet werden. Relevant sind qualifizierte Leads, gewonnene Termine, Übergabezeiten, häufige Anliegen und die Fälle, in denen Mitarbeiter eingreifen mussten.",
    ],
  },
];

const faq: KnowledgeFaq[] = [
  {
    question: "Muss der Betrieb rund um die Uhr erreichbar sein?",
    answer:
      "Nein. Der Assistent kann Anfragen außerhalb der Öffnungszeiten aufnehmen. Echte Gefahrenhinweise müssen jedoch klar auf Notruf, Absperren oder einen definierten Bereitschaftsweg verweisen.",
  },
  {
    question: "Kann ein Termin automatisch bestätigt werden?",
    answer:
      "Ja, wenn der Betrieb echte freie Slots pflegt und die Buchung atomar gegen Doppelbelegung gesichert ist. Alternativ bleibt es bei einem unverbindlichen Terminwunsch.",
  },
  {
    question: "Verliert der Betrieb den persönlichen Kontakt?",
    answer:
      "Nicht bei einem sauberen Übergabemodell. Routineangaben werden vorab gesammelt; Beratung, Diagnose, Preis und besondere Situationen bleiben beim Team.",
  },
];

export const Route = createFileRoute("/shk-anfragen-automatisieren")({
  head: () => ({
    meta: [
      { title: `${title} – ZunftEcho` },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://zunftecho.de/shk-anfragen-automatisieren" },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/shk-anfragen-automatisieren" }],
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
          mainEntityOfPage: "https://zunftecho.de/shk-anfragen-automatisieren",
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
      kicker="Kundenanfragen im SHK-Alltag"
      title={title}
      intro={description}
      readingTime="7 Minuten"
      source="seo-shk-anfragen"
      sections={sections}
      faq={faq}
    />
  );
}
