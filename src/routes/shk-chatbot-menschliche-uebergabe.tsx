import { createFileRoute } from "@tanstack/react-router";
import {
  KnowledgeArticle,
  type KnowledgeFaq,
  type KnowledgeSection,
} from "@/components/knowledge-article";

const title = "SHK-Chatbot: menschliche Übergabe in sechs Fällen prüfen";
const description =
  "Sechs Abnahmetests für SHK-Website-Assistenten: Kundenwunsch, Sonderfall, Teamübernahme, Feierabend, Gefahr und fehlende Benachrichtigung.";
const url = "https://zunftecho.de/shk-chatbot-menschliche-uebergabe";
const sections: KnowledgeSection[] = [
  {
    title: "Erst drei Zustände voneinander trennen",
    paragraphs: [
      "Eine Übergabe hat nicht nur den Zustand „erledigt“. Unterscheiden Sie mindestens:",
      "Eine versendete E-Mail beweist weder, dass sie jemand gelesen hat, noch dass ein Mitarbeiter bereits antwortet. Auch außerhalb der Öffnungszeiten kann eine Anfrage aufgenommen sein, ohne dass gerade jemand verfügbar ist. Kundentext und interner Status müssen diese Unterschiede verständlich machen.",
    ],
    bullets: [
      "Weiterleitung angefordert: Der Kunde oder eine Betriebsregel hat eine Übernahme ausgelöst.",
      "Team informiert: Die Nachricht ist im vorgesehenen internen Kanal angekommen.",
      "Mensch hat übernommen: Eine zuständige Person hat den Vorgang tatsächlich aufgenommen.",
    ],
  },
  {
    title: "Test 1: Der Kunde möchte ausdrücklich einen Menschen",
    paragraphs: [
      "Beispiel: „Ich möchte dazu mit einem Mitarbeiter schreiben.“",
      "Prüfen: Ist der Wunsch im Vorgang sichtbar? Gibt es einen nachvollziehbaren Übernahmeweg? Vermeidet der Assistent weitere unnötige Routinefragen?",
      "Bestanden, wenn: Der Kunde erfährt, dass eine menschliche Bearbeitung angefragt wurde, über welchen Weg sie erfolgt und ob eine sofortige Antwort überhaupt zu erwarten ist. Es wird kein bereits anwesender Mitarbeiter behauptet, solange niemand übernommen hat.",
      "Nicht bestanden: Der Kunde muss seine Geschichte wiederholen, landet in einer Endlosschleife oder erhält ohne reale Grundlage die Zusage „Ein Mitarbeiter ist jetzt bei Ihnen“.",
    ],
  },
  {
    title: "Test 2: Der Kunde verlangt eine Diagnose oder verbindlichen Preis",
    paragraphs: [
      "Beispiel: „Die Heizung fällt immer wieder aus. Sagen Sie mir verbindlich, welches Teil kaputt ist und was die Reparatur kostet.“",
      "Prüfen: Bleibt die technische und kaufmännische Entscheidung beim Fachbetrieb? Werden das Anliegen und bereits freiwillig angegebene Informationen für dessen Prüfung zusammengefasst?",
      "Bestanden, wenn: Der Assistent seine Grenze erklärt und eine menschliche Klärung vorbereitet, statt Ursache, Endpreis oder Reparaturfreigabe zu erfinden. Eine vorhandene Information des Betriebs muss klar von einer ungeprüften Einzelfallzusage unterscheidbar sein.",
      "Nicht bestanden: Eine Vermutung wird als Diagnose ausgegeben oder eine Kostenfrage als Auftrag behandelt. Eine Übergabe ist keine automatisch angenommene Bestellung.",
    ],
  },
  {
    title: "Test 3: Ein Mitarbeiter antwortet im bestehenden Vorgang",
    paragraphs: [
      "Beispiel: Ein Teammitglied übernimmt die Testanfrage und schreibt eine individuelle Antwort. Danach ergänzt der Kunde eine Information.",
      "Prüfen: Bleiben Nachricht und Antwort im richtigen Vorgang? Ist die Übernahme intern erkennbar? Wie verhält sich der Assistent nach dem menschlichen Einstieg?",
      "Bestanden, wenn: Die neue Kundeninformation erreicht die zuständige Person. Das System verhält sich nach den festgelegten Übernahmeregeln und erzeugt keine widersprüchlichen parallelen Zusagen. Eine Rückkehr zur automatischen Bearbeitung muss bewusst geregelt sein.",
      "Nicht bestanden: Der Kunde sieht nur eine technische Statusmeldung, Antworten verschwinden in einem anderen Gespräch oder der Assistent bestätigt eigenmächtig einen anderen Termin.",
    ],
  },
  {
    title: "Test 4: Die Anfrage kommt nach Feierabend",
    paragraphs: [
      "Beispiel: Eine gewöhnliche Wartungsanfrage trifft außerhalb der angegebenen Bürozeiten ein.",
      "Prüfen: Stimmen Öffnungszeiten, Kundenhinweis und tatsächlicher Antwortweg überein? Ist die Vertretung geregelt, falls die gewöhnlich zuständige Person fehlt?",
      "Bestanden, wenn: Der Kunde versteht, dass die Anfrage aufgenommen wurde und wann der Betrieb sie nach seinem eigenen Prozess bearbeiten kann. Es wird weder eine Rund-um-die-Uhr-Besetzung noch ein Notdienst behauptet, den der Betrieb nicht anbietet.",
      "Nicht bestanden: „Sofortige Rückmeldung“ steht im Chat, während der interne Weg erst am nächsten Arbeitstag geprüft wird. Eine Antwortfrist muss zum Betrieb passen; dieser Leitfaden setzt keine feste Frist.",
    ],
  },
  {
    title: "Test 5: Die Nachricht enthält einen möglichen Gefahrenhinweis",
    paragraphs: [
      "Beispiel: Eine ausdrücklich als Test markierte Nachricht erwähnt Gasgeruch.",
      "Prüfen: Wird die gewöhnliche Anfragequalifizierung unterbrochen? Vermeidet das System Ferndiagnosen, Terminangebote und die Aufforderung, zunächst Bilder aufzunehmen oder weitere Fragen zu beantworten? Sind die vorgesehenen Sicherheitshinweise und die interne Priorität sichtbar?",
      "Bestanden, wenn: Der Ablauf macht klar, dass man bei einer akuten Gefahr nicht auf eine Chatantwort oder betriebliche Übernahme warten darf. Die zuständige Notfallstelle wird nicht durch den Website-Assistenten ersetzt. Der Betrieb legt seinen Sicherheitspfad vor dem Einsatz fachlich fest.",
      "Bei echtem Gasgeruch im Gebäude darf ein Telefon dort nicht benutzt werden; der DVGW beschreibt die Maßnahmen und den Anruf von außerhalb in seinen Verhaltensregeln bei Gasgeruch. Testen Sie ausschließlich mit einer fiktiven Nachricht, niemals durch das Erzeugen einer Gefahr.",
      "Nicht bestanden: Das System behandelt den Fall wie eine normale Wartung, fordert ein Foto an oder vermittelt, eine interne Weiterleitung sei bereits Hilfe vor Ort.",
    ],
    links: [
      {
        href: "https://www.dvgw.de/themen/gas/verbraucherinformationen/was-tun-bei-gasgeruch",
        label: "Verhaltensregeln bei Gasgeruch",
      },
    ],
  },
  {
    title: "Test 6: Eine Benachrichtigung erreicht das Team nicht",
    paragraphs: [
      "Beispiel: In einer isolierten Testumgebung wird der vorgesehene Benachrichtigungsweg kontrolliert unterbrochen. Ändern Sie dafür nicht die Erreichbarkeit Ihres laufenden Betriebs.",
      "Prüfen: Bleibt die Anfrage im internen Vorgang sichtbar? Kann ein Fehler erkannt und nach dem betrieblichen Prozess bearbeitet werden? Behauptet die Kundenansicht weiterhin eine erfolgreiche Übernahme, obwohl es dafür keinen Nachweis gibt?",
      "Bestanden, wenn: Fehlende Benachrichtigung und tatsächliche menschliche Übernahme nicht verwechselt werden. Der Betrieb kennt seinen Rückfallweg und kann offene Vorgänge prüfen. Welche Kanäle technisch verfügbar sind, muss vorab geklärt sein; SMS, Kalender oder andere Integrationen sind nicht automatisch Bestandteil eines Website-Assistenten.",
      "Nicht bestanden: Der Vorgang geht verloren oder ein fehlgeschlagener Versand wird unsichtbar als erledigte Übergabe behandelt.",
    ],
  },
  {
    title: "Ein kleines Protokoll reicht – wenn es überprüfbar ist",
    paragraphs: [
      "Notieren Sie je Testfall:",
      "Prüfen Sie die Kundenansicht zusätzlich auf einem echten Smartphone. Eine Desktop-Demo beweist nicht, dass Eingabe, Tastatur, längere Nachrichten und Rückkehr zum Gespräch dort funktionieren. Verwenden Sie keine echten Kundendaten. Führen Sie schreibende Tests nur in einer freigegebenen Testumgebung durch und bereinigen Sie die Testvorgänge anschließend nach deren Regeln.",
    ],
    bullets: [
      "Testzeitpunkt und deutlich fiktive Eingabe;",
      "erwarteten nächsten Schritt und beobachteten Kundentext;",
      "internen Status, zuständige Rolle und tatsächlichen Benachrichtigungsnachweis;",
      "menschliche Antwort, falls der Test eine Übernahme vorsieht;",
      "Ergebnis: bestanden, nachzubessern oder mangels Nachweis noch offen.",
    ],
  },
  {
    title: "Was Sie in der ZunftEcho-Demo prüfen können",
    paragraphs: [
      "Die öffentliche Demo zeigt den Ablauf mit Beispieldaten: Kundenanfrage, fehlende Angaben, Team-Alarm und weitere Bearbeitung. Sie benötigt keine Anmeldung und schreibt keine Produktionsdaten. Das hilft, die Übergabepunkte zu besprechen; es ist kein Nachweis einer zugestellten Benachrichtigung oder eines tatsächlich erreichbaren Mitarbeiters in Ihrem Betrieb.",
      "Übergabepunkte in der Demo ansehen",
      "Für die Vollständigkeit Ihrer Website-Anfragen gibt es außerdem die Checkliste mit acht Prüfpunkten. Eine Verbindung zu Ihrer bestehenden Handwerkersoftware darf nur zugesagt werden, wenn sie tatsächlich vorhanden und geprüft ist.",
    ],
    links: [
      {
        href: "/demo?source=seo-shk-uebergabe",
        label: "Übergabepunkte in der Demo ansehen",
      },
      {
        href: "/website-anfragen-handwerk-checkliste?source=seo-shk-uebergabe",
        label: "Checkliste mit acht Prüfpunkten",
      },
    ],
  },
];
const faq: KnowledgeFaq[] = [
  {
    question: "Ist eine E-Mail-Benachrichtigung bereits eine menschliche Übernahme?",
    answer:
      "Nein. Versand, Eingang im vorgesehenen Kanal und Übernahme durch eine Person sind unterschiedliche Nachweise. Legen Sie fest, wer offene Vorgänge prüft und wie die Übernahme sichtbar wird.",
  },
  {
    question:
      "Muss ein Website-Assistent außerhalb der Öffnungszeiten sofort einen Mitarbeiter verbinden?",
    answer:
      "Nicht für gewöhnliche Anfragen. Die Kundeninformation muss zur realen Verfügbarkeit und zum Antwortprozess des Betriebs passen. Akute Gefahren gehören nicht in eine gewöhnliche Warteschlange.",
  },
  {
    question: "Muss der Assistent nach einer menschlichen Antwort vollständig aufhören?",
    answer:
      "Sein Verhalten muss zum vereinbarten Übernahmemodell passen. Entscheidend ist, dass Mensch und System nicht widersprüchlich handeln und eine spätere automatische Bearbeitung klar geregelt ist.",
  },
  {
    question: "Reicht die öffentliche Demo für die Abnahme meines Betriebs?",
    answer:
      "Nein. Eine Demo mit Beispieldaten zeigt das Konzept. Die Abnahme muss zusätzlich den tatsächlichen Kundenweg, Zuständigkeiten, Benachrichtigungen und Geräte Ihres Betriebs prüfen.",
  },
];

export const Route = createFileRoute("/shk-chatbot-menschliche-uebergabe")({
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
              // Add actual publication dates only after the visual release gate passes.
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
      kicker="Abnahmetest für SHK-Betriebe"
      title={title}
      intro="Ein Hinweis „Wir leiten Ihre Anfrage weiter“ ist noch keine funktionierende Übergabe. Prüfen Sie mit sechs Testfällen den Kundenhinweis, die interne Zuständigkeit und die tatsächliche Übernahme – ohne echte Kundendaten."
      readingTime="9 Minuten"
      source="seo-shk-uebergabe"
      sections={sections}
      faq={faq}
      cta={{
        eyebrow: "Konzept mit Beispieldaten",
        title: "Übergabepunkte in der Demo ansehen",
        text: "Ohne Anmeldung und ohne Produktionsdaten. Die Demo ersetzt keine betriebliche Abnahme.",
        href: "/demo",
        label: "Demo ansehen",
      }}
    />
  );
}
