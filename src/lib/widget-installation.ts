export type WidgetPlatformId =
  "wordpress" | "wix" | "shopify" | "webflow" | "squarespace" | "jimdo" | "custom";

export type WidgetPlatformGuide = {
  id: WidgetPlatformId;
  name: string;
  shortName: string;
  description: string;
  navigation: string;
  codeLocation: string;
  steps: string[];
  note?: string;
  officialGuide: string;
};

export const widgetPlatformGuides: WidgetPlatformGuide[] = [
  {
    id: "wordpress",
    name: "WordPress",
    shortName: "WP",
    description: "Für WordPress-Websites mit Plugin- oder Code-Zugriff.",
    navigation: "Code Snippets → Header & Footer",
    codeLocation: "Footer / vor </body>",
    steps: [
      "Installieren Sie bei Bedarf das kostenlose Plugin WPCode und öffnen Sie Header & Footer.",
      "Fügen Sie den ZunftEcho-Code einmal in das Footer-Feld ein.",
      "Speichern Sie die Änderung, leeren Sie gegebenenfalls den Website-Cache und öffnen Sie die Startseite.",
    ],
    note: "Bei WordPress.com muss der Tarif JavaScript beziehungsweise Plugins erlauben.",
    officialGuide: "https://wordpress.com/support/adding-code-to-headers/",
  },
  {
    id: "wix",
    name: "Wix",
    shortName: "Wix",
    description: "Einmal als benutzerdefinierten Code für alle Seiten hinzufügen.",
    navigation: "Einstellungen → Entwicklung & Integrationen → Benutzerdefinierter Code",
    codeLocation: "Alle Seiten · Body – Ende",
    steps: [
      "Öffnen Sie in der Website-Verwaltung Einstellungen und anschließend Benutzerdefinierter Code.",
      "Wählen Sie Code hinzufügen, vergeben Sie den Namen „ZunftEcho“ und fügen Sie den Code ein.",
      "Wählen Sie Alle Seiten sowie Body – Ende, klicken Sie auf Anwenden und veröffentlichen Sie die Website.",
    ],
    note: "Die Wix-Seite muss veröffentlicht sein und eine verbundene Domain besitzen.",
    officialGuide:
      "https://support.wix.com/en/article/wix-editor-embedding-custom-code-on-your-site",
  },
  {
    id: "shopify",
    name: "Shopify",
    shortName: "Shop",
    description: "Direkt im aktiven Theme, ohne zusätzliche Chat-App.",
    navigation: "Onlineshop → Themes → … → Code bearbeiten",
    codeLocation: "layout/theme.liquid · vor </body>",
    steps: [
      "Duplizieren Sie zuerst Ihr aktives Theme als Sicherungskopie.",
      "Öffnen Sie Code bearbeiten und anschließend die Datei layout/theme.liquid.",
      "Fügen Sie den Code direkt vor </body> ein, speichern Sie und prüfen Sie die Shop-Vorschau.",
    ],
    note: "Nach einem Theme-Wechsel muss der Code im neuen aktiven Theme erneut geprüft werden.",
    officialGuide: "https://help.shopify.com/en/manual/online-store/themes/theme-code",
  },
  {
    id: "webflow",
    name: "Webflow",
    shortName: "Web",
    description: "Global über den Footer-Code der Website einbinden.",
    navigation: "Site settings → Custom code",
    codeLocation: "Footer code · vor </body>",
    steps: [
      "Öffnen Sie die Site settings und wechseln Sie zu Custom code.",
      "Fügen Sie den ZunftEcho-Code in das Feld Footer code ein.",
      "Speichern Sie und veröffentlichen Sie die Website erneut auf Ihrer eigenen Domain.",
    ],
    note: "Custom Code setzt bei Webflow einen passenden Workspace- oder Site-Tarif voraus.",
    officialGuide:
      "https://help.webflow.com/hc/en-us/articles/33961357265299-Custom-code-in-head-and-body-tags",
  },
  {
    id: "squarespace",
    name: "Squarespace",
    shortName: "SQ",
    description: "Websiteweit über die Footer-Code-Injection laden.",
    navigation: "Pages → Custom Code → Code Injection",
    codeLocation: "Footer",
    steps: [
      "Öffnen Sie im Pages-Bereich Custom Code und danach Code Injection.",
      "Fügen Sie den ZunftEcho-Code in das Feld Footer ein.",
      "Speichern Sie und prüfen Sie die öffentliche Website in einem neuen Browserfenster.",
    ],
    note: "Code Injection ist nicht in jedem Squarespace-Tarif enthalten.",
    officialGuide:
      "https://support.squarespace.com/hc/en-us/articles/205815908-Using-code-injection",
  },
  {
    id: "jimdo",
    name: "Jimdo Creator",
    shortName: "Jimdo",
    description: "Als Widget/HTML-Element oder im eigenen Template einfügen.",
    navigation: "Inhalt hinzufügen → Widget/HTML",
    codeLocation: "Globales Template oder Footer-Bereich",
    steps: [
      "Fügen Sie ein Widget/HTML-Element in einen global sichtbaren Footer-Bereich ein.",
      "Kopieren Sie den ZunftEcho-Code in das Element und bestätigen Sie die Änderung.",
      "Veröffentlichen Sie die Website und öffnen Sie eine öffentliche Seite zum Test.",
    ],
    note: "Bei Jimdo Dolphin ohne HTML-Zugriff ist eine manuelle Einbindung eventuell nicht möglich.",
    officialGuide: "https://help.jimdo.com/hc/en-us/articles/115005947286-How-do-I-add-widgets",
  },
  {
    id: "custom",
    name: "Eigene Website / HTML",
    shortName: "</>",
    description: "Für Agenturen, Baukästen und individuell entwickelte Websites.",
    navigation: "Globales Layout oder Tag-Manager",
    codeLocation: "Einmal direkt vor </body>",
    steps: [
      "Öffnen Sie das globale Layout oder den Bereich für websiteweiten benutzerdefinierten Code.",
      "Fügen Sie den ZunftEcho-Code einmal direkt vor dem schließenden </body>-Tag ein.",
      "Veröffentlichen Sie die Änderung und rufen Sie die Website ohne eingeloggte Admin-Sitzung auf.",
    ],
    note: "Der Code darf nicht mehrfach auf derselben Seite eingebunden werden.",
    officialGuide: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script",
  },
];

export function parseWebsiteOrigin(
  value: string,
): { ok: true; origin: string; hostname: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: "Bitte geben Sie zuerst die Adresse Ihrer Website ein." };
  }

  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
      throw new Error("unsupported protocol");
    }
    return {
      ok: true,
      origin: parsed.origin.toLowerCase(),
      hostname: parsed.hostname.toLowerCase(),
    };
  } catch {
    return {
      ok: false,
      error: "Die Website-Adresse ist ungültig. Beispiel: https://www.mein-betrieb.de",
    };
  }
}
