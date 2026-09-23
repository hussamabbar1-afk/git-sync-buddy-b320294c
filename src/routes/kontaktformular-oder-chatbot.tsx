import { createFileRoute } from "@tanstack/react-router";

import {
  KnowledgeArticle,
  type KnowledgeFaq,
  type KnowledgeSection,
} from "@/components/knowledge-article";

const sections: KnowledgeSection[] = [
  {
    title: "Digitale Anfrageaufnahme für SHK-Betriebe: Was wird eigentlich verglichen?",
    paragraphs: [
      "Digitale Anfrageaufnahme bedeutet, Kundenanliegen auf der Website zu erfassen und so an den Betrieb zu übergeben, dass das Büro den nächsten Schritt entscheiden kann. Ein Eingang ist noch kein Auftrag, ein Terminwunsch noch keine Buchung und eine automatische Antwort noch keine fachliche Diagnose.",
      "ZunftEcho ist ein Website-Anfrageassistent für SHK-Betriebe. Er unterstützt die strukturierte Aufnahme und menschliche Übergabe. Er ist kein Telefonassistent und ersetzt weder eine Handwerkersoftware für Angebote und Rechnungen noch die fachliche Prüfung durch den Betrieb.",
      "Dieser Vergleich stammt vom Anbieter ZunftEcho. Er ist keine unabhängige Rangliste und enthält keine bezahlten Empfehlungen. Stand: 16. September 2026.",
    ],
  },
  {
    title: "Die kurze Antwort: Beides löst unterschiedliche Aufgaben",
    paragraphs: [
      "Ein Kontaktformular ist schnell verstanden und für einfache Anliegen weiterhin sinnvoll. Ein geführter Anfrageassistent wird dann wertvoll, wenn häufig Angaben fehlen, Dringlichkeit eingeordnet werden muss oder der Betrieb unterschiedliche Leistungen und Einsatzgebiete anbietet.",
      "Die bessere Frage lautet deshalb nicht, welches Element moderner aussieht, sondern welcher Ablauf dem Team vor dem Rückruf verlässlich die notwendigen Informationen liefert.",
    ],
  },
  {
    title: "Wann ein Kontaktformular ausreicht",
    paragraphs: [
      "Für einen Betrieb mit wenigen, sehr ähnlichen Anfragen kann ein gut gestaltetes Formular vollkommen genügen. Voraussetzung ist, dass es auf dem Smartphone funktioniert und nur Felder verlangt, die tatsächlich benötigt werden.",
    ],
    bullets: [
      "Leistung und Zielgruppe sind eng begrenzt.",
      "Name, Telefon, Einsatzort und Anliegen werden getrennt erfasst.",
      "Nach dem Absenden folgt eine verständliche Bestätigung.",
      "Das Team prüft den Eingang während der zugesagten Reaktionszeit zuverlässig.",
    ],
  },
  {
    title: "Wann ein geführter Chat Vorteile hat",
    paragraphs: [
      "Ein Chat kann seine nächste Frage von der vorherigen Antwort abhängig machen. Bei einer Heizungsstörung sind andere Angaben wichtig als bei einer Badsanierung. Der Kunde sieht dadurch nicht gleichzeitig ein langes Formular, während der Betrieb trotzdem strukturierte Daten erhält.",
    ],
    bullets: [
      "Anfragen unterscheiden sich stark nach Leistung und Dringlichkeit.",
      "Kunden senden häufig nur einen kurzen, unvollständigen Satz.",
      "Gefahrenhinweise sollen sofort erkannt und richtig eingeordnet werden.",
      "Terminwünsche, Servicegebiet oder optionale Fotos sollen Teil desselben Ablaufs sein.",
    ],
  },
  {
    title: "Der wichtigste Unterschied liegt nach dem Absenden",
    paragraphs: [
      "Weder Formular noch Chat schaffen allein einen guten Kundenprozess. Entscheidend ist, ob die Anfrage im richtigen Arbeitsbereich landet, priorisiert wird und bei kritischen Fällen eine externe Benachrichtigung auslöst. Ohne Zuständigkeit und Reaktionsfrist bleibt auch der beste Dialog nur ein weiterer Posteingang.",
      "Ebenso wichtig ist die Rückmeldung an den Endkunden: Welche Angaben wurden übernommen? Ist ein Termin bestätigt oder nur angefragt? Wann folgt ein menschlicher Rückruf? Eine klare Zusammenfassung verhindert falsche Erwartungen.",
    ],
  },
  {
    title: "Die praktische Kombination für SHK-Betriebe",
    paragraphs: [
      "In vielen Fällen ist keine harte Entweder-oder-Entscheidung nötig. Der geführte Assistent kann den primären Weg für neue Serviceanfragen bilden, während E-Mail, Telefon und ein barrierearmer Kontaktweg sichtbar bleiben. Kunden dürfen nicht in einem Dialog festgehalten werden, wenn sie lieber direkt mit einem Menschen sprechen möchten.",
      "Ein sinnvoller Test beginnt mit drei echten Fällen: einer normalen Wartungsanfrage, einer unvollständigen Störungsmeldung und einem dringenden Sicherheitshinweis. Erst wenn alle drei korrekt erfasst und übergeben werden, ist der Ablauf produktionsreif.",
    ],
  },
  {
    title: "Formular, Anfrageassistent, Telefon-KI oder Handwerkersoftware?",
    paragraphs: [
      "Entscheiden Sie zuerst, wo Anfragen entstehen und welches System bereits vorhanden ist. Eine zusätzliche Lösung lohnt sich nur, wenn sie eine konkrete Lücke schließt.",
    ],
    bullets: [
      "Website-Formular: sinnvoll bei überschaubaren, ähnlichen Anliegen. Auch ein Formular kann Pflichtfelder, Benachrichtigungen und CRM-Übergaben unterstützen. Jotform dokumentiert beispielsweise die Übertragung von Formulardaten an CRM-Systeme. Ein Formular ist also nicht grundsätzlich unstrukturiert oder nur während der Bürozeiten erreichbar.",
      "Website-Anfrageassistent: sinnvoll, wenn unterschiedliche Anliegen unterschiedliche Rückfragen brauchen. ZunftEcho konzentriert sich auf diese Aufnahme und die Übergabe an den Betrieb. Prüfen Sie den konkreten Fragenbaum und den Vorgang im Büro, nicht nur die sprachliche Qualität der Antwort.",
      "Telefonassistent: bearbeitet eingehende Anrufe statt Website-Dialoge. Das ist ein anderer Eingangskanal. Wer vor allem Website-Anfragen verbessern möchte, benötigt dafür nicht automatisch eine neue Telefonlösung.",
      "Handwerkersoftware oder CRM: organisiert die weitere Bearbeitung. Wenn bereits ein geeignetes System vorhanden ist, prüfen Sie zuerst dessen Formular- und Anfragefunktionen. Eine Schnittstelle zu ZunftEcho oder einem anderen Assistenten darf erst als vorhanden gelten, wenn sie für die eingesetzten Systeme konkret bestätigt und getestet wurde.",
    ],
    links: [
      {
        href: "https://www.jotform.com/de/features/crm-forms/",
        label: "Herstellerquelle: Jotform zu Formularen und CRM-Übergaben",
      },
      {
        href: "/shk-wartungsanfrage-mit-fotos",
        label: "SHK-Wartungsanfragen mit freiwilligen Fotos erfassen",
      },
      { href: "/vertrauen", label: "ZunftEcho: Datenschutz und Betriebsgrenzen" },
    ],
  },
  {
    title: "Kann digitale Anfrageaufnahme ohne ERP-Anbindung starten?",
    paragraphs: [
      "Ja. Ein Website-only-Start kann sinnvoll sein, wenn der Betrieb zunächst prüfen möchte, ob strukturierte Rückfragen vollständigere Anfragen liefern. Dafür braucht es einen klaren Eingang im Büro, eine verantwortliche Person und eine überprüfbare Reaktionszeit. Eine nicht vorhandene ERP- oder CRM-Anbindung darf dabei nicht behauptet oder durch manuelles Kopieren verschleiert werden.",
      "Auch das Serviceportal SHK des Zentralverbands beschreibt websitebasierte Abfragestrecken als eigenständigen Einstieg. Eine direkte Übergabe an Handwerkersoftware ist eine zusätzliche Ausbaustufe. Für ZunftEcho gilt deshalb: zuerst den Website-Ablauf und die menschliche Übergabe im konkreten Betrieb testen; eine Systemintegration erst dann zusagen, wenn sie für das eingesetzte System technisch bestätigt und praktisch geprüft wurde.",
    ],
    links: [
      {
        href: "https://www.zvshk.de/themen/serviceportal-shk",
        label: "Branchenquelle: ZVSHK zum Serviceportal SHK",
      },
      { href: "/vertrauen", label: "ZunftEcho: Grenzen, Datenschutz und menschliche Übergabe" },
    ],
  },
  {
    title: "Sieben Punkte für die Auswahl",
    paragraphs: [
      "Bewerten Sie den bestehenden Prozess anhand des Ergebnisses für Betrieb und Kunde – nicht anhand der Zahl eingebauter Funktionen.",
    ],
    bullets: [
      "Funktioniert der gesamte Ablauf auf einem kleinen Smartphone?",
      "Sind Name, Telefon, Einsatzort und Anliegen vollständig?",
      "Werden gefährliche Situationen gesondert behandelt?",
      "Bleiben Foto und Standort freiwillig und verständlich erklärt?",
      "Ist zwischen Terminwunsch und bestätigtem Termin klar unterschieden?",
      "Erhält das zuständige Team eine aktive Benachrichtigung?",
      "Kann ein Kunde jederzeit einen menschlichen Kontaktweg wählen?",
    ],
  },
];

const faq: KnowledgeFaq[] = [
  {
    question: "Was bedeutet digitale Anfrageaufnahme im SHK-Handwerk?",
    answer:
      "Sie erfasst ein Kundenanliegen auf der Website so strukturiert, dass der Betrieb Einsatzort, Leistung, Dringlichkeit, Erreichbarkeit und den gewünschten nächsten Schritt prüfen kann. Sie ist weder automatisch ein Auftrag noch eine fachliche Diagnose oder Terminbestätigung.",
  },
  {
    question: "Kann ein SHK-Betrieb ohne ERP-Anbindung mit digitaler Anfrageaufnahme starten?",
    answer:
      "Ja. Ein klar begrenzter Website-only-Pilot kann zuerst die Vollständigkeit der Anfragen und die menschliche Übergabe prüfen. Eine ERP- oder CRM-Anbindung sollte erst als verfügbar gelten, wenn sie für das konkrete System bestätigt und getestet wurde.",
  },
  {
    question: "Braucht ein SHK-Betrieb mit 1–10 Mitarbeitenden überhaupt einen KI-Chatbot?",
    answer:
      "Nicht automatisch. Bei wenigen vollständigen Website-Anfragen kann ein gutes Formular genügen. Ein geführter Assistent wird erst dann interessant, wenn regelmäßig wichtige Angaben fehlen oder verschiedene Anliegen unterschiedliche Rückfragen benötigen. Prüfen Sie diese Lücke vor einer zusätzlichen Softwareentscheidung.",
  },
  {
    question: "Nimmt ZunftEcho Telefonanrufe entgegen oder ersetzt es mein ERP?",
    answer:
      "Nein. ZunftEcho ist auf digitale Anfrageaufnahme über die Website und die menschliche Übergabe ausgerichtet. Telefonie, Angebotserstellung und Buchhaltung sind davon getrennte Aufgaben. Eine ERP-Anbindung muss für den konkreten Einsatz gesondert geklärt werden.",
  },
  {
    question: "Ersetzt ein Chatbot das Kontaktformular vollständig?",
    answer:
      "Nicht zwingend. Ein geführter Dialog kann der Hauptweg sein, während ein einfaches Formular oder andere Kontaktwege als zugängliche Alternative bestehen bleiben.",
  },
  {
    question: "Ist ein Chat für ältere Kunden zu kompliziert?",
    answer:
      "Nicht, wenn Schaltflächen, kurze Fragen, gut lesbare Schrift und ein sichtbarer menschlicher Kontaktweg verwendet werden. Der Ablauf muss auf echten Mobilgeräten getestet werden.",
  },
  {
    question: "Kann ein Formular ebenfalls dringende Fälle erkennen?",
    answer:
      "Ein Auswahlfeld kann Dringlichkeit abfragen. Ein geführter Dialog kann zusätzlich auf konkrete Hinweise reagieren. In beiden Fällen braucht es definierte Sicherheitshinweise und eine menschliche Eskalation.",
  },
  {
    question: "Wie lässt sich die Entscheidung ohne Verkaufsgespräch prüfen?",
    answer:
      "Der kostenlose ZunftEcho-Anfrage-Check bewertet acht Kernbereiche anonym. Anschließend kann der beispielhafte Ablauf in der öffentlichen Demo getestet werden.",
  },
];

export const Route = createFileRoute("/kontaktformular-oder-chatbot")({
  head: () => ({
    meta: [
      { title: "Kontaktformular oder Chatbot für Handwerksbetriebe? – ZunftEcho" },
      {
        name: "description",
        content:
          "Kontaktformular und Chatbot im Vergleich: Wann welcher Weg für SHK-Anfragen sinnvoll ist und worauf es bei Übergabe, Dringlichkeit und Mobilansicht ankommt.",
      },
      { property: "og:title", content: "Kontaktformular oder Chatbot im SHK-Handwerk?" },
      {
        property: "og:description",
        content:
          "Eine praktische Entscheidungshilfe für vollständige Website-Anfragen ohne unnötige Technik.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://zunftecho.de/kontaktformular-oder-chatbot" },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [{ rel: "canonical", href: "https://zunftecho.de/kontaktformular-oder-chatbot" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Kontaktformular oder Chatbot für Handwerksbetriebe?",
          description:
            "Praktische Entscheidungshilfe für die digitale Anfrageaufnahme in SHK-Betrieben.",
          inLanguage: "de-DE",
          datePublished: "2026-08-29",
          dateModified: "2026-09-23",
          mainEntityOfPage: "https://zunftecho.de/kontaktformular-oder-chatbot",
          author: { "@type": "Organization", name: "ZunftEcho" },
          publisher: {
            "@type": "Organization",
            name: "ZunftEcho",
            logo: {
              "@type": "ImageObject",
              url: "https://zunftecho.de/zunftecho-mark.png",
            },
          },
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
  component: KontaktformularOderChatbot,
});

function KontaktformularOderChatbot() {
  return (
    <KnowledgeArticle
      kicker="Vergleich und Entscheidungshilfe"
      title="Kontaktformular oder Chatbot: Was passt zu einem SHK-Betrieb?"
      intro="Beide Wege können funktionieren. Entscheidend ist, ob nach dem Absenden eine vollständige, priorisierte und verständlich bestätigte Anfrage entsteht."
      readingTime="7 Minuten"
      source="seo-formular-vergleich"
      sections={sections}
      faq={faq}
    />
  );
}
