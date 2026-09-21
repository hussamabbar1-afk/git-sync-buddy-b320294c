import { createFileRoute } from "@tanstack/react-router";
import {
  KnowledgeArticle,
  type KnowledgeFaq,
  type KnowledgeSection,
} from "@/components/knowledge-article";

const title = "SHK-Wartungsanfrage mit Fotos richtig erfassen";
const description =
  "Praxisleitfaden für SHK-Betriebe: Wartungsanfragen mit Gerätedaten und freiwilligen Fotos vollständig aufnehmen, ohne Diagnose oder Termin zu versprechen.";
const url = "https://zunftecho.de/shk-wartungsanfrage-mit-fotos";

const sections: KnowledgeSection[] = [
  {
    title: "Das Ziel ist Vorbereitung – nicht Ferndiagnose",
    paragraphs: [
      "Eine brauchbare Wartungsanfrage hilft dem Büro, das Anliegen zuzuordnen und Rückfragen vorzubereiten. Ein Foto kann Typenschild, Einbausituation oder sichtbare Meldungen dokumentieren. Es ersetzt weder die fachliche Prüfung noch eine Diagnose vor Ort.",
      "Trennen Sie deshalb klar zwischen aufgenommenen Kundendaten, einer internen Priorisierung und einer späteren Entscheidung durch den Betrieb. Der Kunde sollte nach dem Absenden wissen, dass seine Anfrage eingegangen ist – nicht, dass bereits ein Auftrag, Preis oder Termin bestätigt wurde.",
    ],
  },
  {
    title: "Diese Angaben gehören vor den Foto-Upload",
    paragraphs: [
      "Fotos sind nur hilfreich, wenn sie dem richtigen Vorgang zugeordnet werden können. Beginnen Sie mit wenigen Angaben, die ein Mitarbeiter tatsächlich für die erste Sichtung benötigt.",
    ],
    bullets: [
      "Anliegen: Wartung, Störung, Reparatur oder Modernisierung;",
      "Einsatzort und Postleitzahl;",
      "Hersteller, Gerätetyp und ungefähres Baujahr, soweit bekannt;",
      "sichtbare Meldung oder Fehlercode ohne eigene Ursachenbehauptung;",
      "Erreichbarkeit und bevorzugter Kontaktweg;",
      "optional: letztes Wartungsdatum oder vorhandener Wartungsvertrag.",
    ],
  },
  {
    title: "Fotos freiwillig, begrenzt und verständlich anbieten",
    paragraphs: [
      "Ein Kunde sollte die Anfrage auch ohne Foto abschließen können. Erklären Sie vor der Auswahl, wofür das Bild gebraucht wird, welche Motive hilfreich sind und welche Inhalte nicht hochgeladen werden sollen.",
      "Begrenzen Sie Anzahl und Größe der Dateien. Zeigen Sie nach dem Upload eindeutig, ob die Übertragung funktioniert hat. Auf dem Smartphone müssen Kameraauswahl, Dateigröße, Fortschritt und Fehlermeldung verständlich bleiben.",
    ],
    bullets: [
      "Hilfreich: Gesamtansicht der Anlage, Typenschild und sichtbarer Fehlercode;",
      "nicht anfordern: Personen, Ausweise, Zahlungsdaten oder unnötige private Bereiche;",
      "bei Gefahr keine Fotoschleife starten, sondern den festgelegten Sicherheitshinweis zeigen;",
      "Datei und Anfrage intern eindeutig miteinander verknüpfen.",
    ],
  },
  {
    title: "Wartung, Reparatur und Modernisierung getrennt führen",
    paragraphs: [
      "Ein einziges Freitextfeld vermischt unterschiedliche Arbeitsabläufe. Eine Wartung braucht häufig Gerätedaten und das letzte Wartungsdatum. Eine Störung braucht zusätzlich die beobachtete Meldung und eine Dringlichkeitsprüfung. Eine Modernisierung beginnt eher mit Gebäudeart, Bestand und gewünschtem Ergebnis.",
      "Die erste Auswahl darf die Folgefragen steuern, ohne dem Kunden eine technische Diagnose vorzugeben. Für das Büro entsteht so eine strukturierte Zusammenfassung statt einer unvollständigen E-Mail.",
    ],
  },
  {
    title: "Terminwunsch und bestätigten Termin nicht verwechseln",
    paragraphs: [
      "Ein gewünschter Zeitraum ist nur dann eine feste Buchung, wenn reale Verfügbarkeit geprüft und der Termin verbindlich bestätigt wird. Andernfalls sollte der Abschluss ausdrücklich von einem Terminwunsch sprechen, den ein Mitarbeiter prüft.",
      "Dasselbe gilt für Preise und Aufträge: Eine digitale Wartungsanfrage ist zunächst eine Anfrage. Ein Angebot, eine Auftragsannahme oder eine fachliche Freigabe entsteht erst im vorgesehenen Prozess des Betriebs.",
    ],
  },
  {
    title: "Mit drei fiktiven Fällen abnehmen",
    paragraphs: [
      "Prüfen Sie den Ablauf vor dem Einsatz auf einem echten Smartphone und ohne echte Kundendaten. Drei kurze Fälle decken die wichtigsten Grenzen ab:",
    ],
    bullets: [
      "normale Wartung mit bekanntem Gerät und einem freiwilligen Typenschildfoto;",
      "Störungsmeldung ohne bekannte Typbezeichnung, aber mit verständlicher Rückfrage;",
      "möglicher Gefahrenhinweis, bei dem der Upload übersprungen und der Sicherheitspfad gezeigt wird.",
    ],
    links: [
      {
        href: "/shk-chatbot-menschliche-uebergabe?source=seo-shk-wartungsfoto",
        label: "Sechs Fälle für die menschliche Übergabe prüfen",
      },
      {
        href: "/website-anfragen-handwerk-checkliste?source=seo-shk-wartungsfoto",
        label: "Vollständige Website-Anfragen mit acht Punkten prüfen",
      },
    ],
  },
  {
    title: "Was der Markt bereits zeigt",
    paragraphs: [
      "Öffentlich sichtbare Wartungsformulare von SHK-Betrieben fragen heute bereits Gerätedaten ab und erlauben Fotos von Anlage oder Typenschild. Das Serviceportal SHK beschreibt darüber hinaus strukturierte Anfragestrecken und eine manuelle Weiterbearbeitung durch den Fachbetrieb. Der praktische Unterschied entsteht deshalb nicht durch einen Upload allein, sondern durch verständliche Fragen, klare Grenzen und eine verlässliche menschliche Bearbeitung.",
    ],
    links: [
      {
        href: "https://www.rehder-heizungsbau.de/shk/anwendungen/wartungsanfrage",
        label: "Beispiel einer öffentlichen SHK-Wartungsanfrage",
      },
      {
        href: "https://www.zvshk.de/themen/serviceportal-shk",
        label: "ZVSHK: Serviceportal SHK und Leadverwaltung",
      },
    ],
  },
];

const faq: KnowledgeFaq[] = [
  {
    question: "Muss ein Foto für eine SHK-Wartungsanfrage verpflichtend sein?",
    answer:
      "Nein. Ein Foto kann die Vorbereitung erleichtern, sollte aber freiwillig bleiben. Die Anfrage muss auch dann bearbeitbar sein, wenn der Kunde kein geeignetes Bild hat oder keinen Upload verwenden möchte.",
  },
  {
    question: "Darf der Website-Assistent anhand eines Fotos eine Diagnose stellen?",
    answer:
      "Nicht als ungeprüfte Zusage. Das Foto gehört als Zusatzinformation in den Vorgang. Diagnose, Preis, Reparaturfreigabe und Sicherheitsentscheidung bleiben beim zuständigen Fachbetrieb.",
  },
  {
    question: "Welche Fotos sind für eine Wartungsanfrage sinnvoll?",
    answer:
      "Häufig helfen eine Gesamtansicht der Anlage, das Typenschild und eine sichtbare Fehlermeldung. Der konkrete Betrieb sollte vorgeben, was er benötigt, und unnötige personenbezogene oder private Inhalte vermeiden.",
  },
  {
    question: "Ist ein Terminwunsch nach dem Absenden bereits bestätigt?",
    answer:
      "Nur wenn der Betrieb die reale Verfügbarkeit geprüft und den Termin verbindlich bestätigt hat. Sonst bleibt es ein Wunsch, den ein Mitarbeiter anschließend bearbeitet.",
  },
];

export const Route = createFileRoute("/shk-wartungsanfrage-mit-fotos")({
  head: () => ({
    meta: [
      { title: `${title} – ZunftEcho` },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: title,
              description,
              inLanguage: "de-DE",
              mainEntityOfPage: url,
              datePublished: "2026-09-21",
              dateModified: "2026-09-21",
              author: { "@type": "Organization", name: "ZunftEcho" },
              publisher: {
                "@type": "Organization",
                name: "ZunftEcho",
                logo: { "@type": "ImageObject", url: "https://zunftecho.de/zunftecho-mark.png" },
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
  component: Page,
});

function Page() {
  return (
    <KnowledgeArticle
      kicker="Praxisleitfaden für SHK-Betriebe"
      title={title}
      intro="Eine gute Wartungsanfrage verbindet Gerätedaten und freiwillige Fotos mit klaren Erwartungen. So kann das Büro den nächsten Schritt prüfen, ohne dass die Website Diagnose, Preis oder Termin verspricht."
      readingTime="7 Minuten"
      source="seo-shk-wartungsfoto"
      sections={sections}
      faq={faq}
      cta={{
        eyebrow: "Mit Beispieldaten testen",
        title: "Strukturierte Übergabe in der Demo ansehen",
        text: "Die Demo zeigt Anfrage, Ergänzung und Team-Übergabe ohne Anmeldung oder echte Kundendaten.",
        href: "/demo",
        label: "Demo ansehen",
      }}
    />
  );
}
