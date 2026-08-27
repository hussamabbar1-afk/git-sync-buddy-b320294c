import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CircleHelp, ExternalLink, LifeBuoy, Mail } from "lucide-react";

import { AppShell, PageHeader } from "@/components/app-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/hilfe")({
  head: () => ({
    meta: [
      { title: "Hilfe und Support – ZunftEcho" },
      {
        name: "description",
        content: "Schnelle Antworten und Support für ZunftEcho-Nutzer.",
      },
    ],
  }),
  component: HelpPage,
});

const faqGroups = [
  {
    title: "Erste Schritte",
    items: [
      [
        "Wie wird der KI-Mitarbeiter startklar?",
        "Vervollständigen Sie Unternehmensprofil, Leistungen, Servicegebiete und Öffnungszeiten. Prüfen Sie anschließend Begrüßung, Fallback und Übergabe-SLA unter KI-Mitarbeiter.",
      ],
      [
        "Wie installiere ich das Widget?",
        "Unter Widget installieren finden Sie geführte Anleitungen für WordPress, Wix, Shopify, Webflow, Squarespace, Jimdo und eigene HTML-Seiten inklusive Einbauprüfung.",
      ],
      [
        "Kann ich den Namen des KI-Mitarbeiters ändern?",
        "Ja. Name, Tonalität, Sprachen und Begrüßung lassen sich jederzeit unter KI-Mitarbeiter anpassen.",
      ],
    ],
  },
  {
    title: "Leads und Übergaben",
    items: [
      [
        "Wann wird ein Gespräch an einen Menschen übergeben?",
        "Bei akuter Gefahr, ausdrücklichem Wunsch nach einem Mitarbeiter oder klar erkennbarer starker Verärgerung. Die Übergabe erscheint sofort im Dashboard und kann per E-Mail gemeldet werden.",
      ],
      [
        "Was bedeutet SLA?",
        "Das SLA ist Ihre gewünschte maximale Reaktionszeit auf eine menschliche Übergabe. Nach Überschreitung wird der Vorgang deutlich hervorgehoben und erneut gemeldet.",
      ],
      [
        "Wie verbessere ich falsche KI-Antworten?",
        "Öffnen Sie die Konversation und markieren Sie sie als Prüfung nötig. Die zugrunde liegende Frage wird für die Wissenslücken-Auswertung vorgemerkt.",
      ],
    ],
  },
  {
    title: "Datenschutz und Betrieb",
    items: [
      [
        "Wo ändere ich Aufbewahrungs- und Datenschutzeinstellungen?",
        "Unter Einstellungen verwalten Sie Datenaufbewahrung und weitere Kontoeinstellungen; die öffentlich verlinkten Datenschutzhinweise finden Sie im Seitenfuß.",
      ],
      [
        "Wie lade ich Mitarbeiter ein?",
        "Unter Team und Benutzer geben Eigentümer oder Administratoren die E-Mail-Adresse und Rolle an. ZunftEcho versendet anschließend einen sieben Tage gültigen Einladungslink.",
      ],
      [
        "Wo finde ich frühere Rechnungen?",
        "Betriebliche Angebote, Rechnungen und Zahlungen finden Sie unter Rechnungen. Abonnementbelege werden nach Aktivierung der Zahlungsabwicklung separat im Konto bereitgestellt.",
      ],
    ],
  },
] as const;

function HelpPage() {
  return (
    <AppShell>
      <PageHeader
        title="Hilfe und Support"
        description="Antworten auf häufige Fragen – direkt dort, wo Sie arbeiten."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {faqGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CircleHelp className="size-4" /> {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {group.items.map(([question, answer], index) => (
                    <AccordionItem key={question} value={`${group.title}-${index}`}>
                      <AccordionTrigger className="text-left">{question}</AccordionTrigger>
                      <AccordionContent className="leading-6 text-muted-foreground">
                        {answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4" /> Schnelle Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to="/installation">
                  Widget-Anleitungen <ExternalLink className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to="/ki-mitarbeiter">
                  KI konfigurieren <ExternalLink className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link to="/team">
                  Team verwalten <ExternalLink className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="size-4" /> Persönlicher Support
              </CardTitle>
              <CardDescription>
                Wenn eine Antwort fehlt, senden Sie uns eine möglichst genaue Beschreibung.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <a href="mailto:hussamabbar4@gmail.com?subject=ZunftEcho%20Support">
                  <Mail className="size-4" /> Support per E-Mail
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
