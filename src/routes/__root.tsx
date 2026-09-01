import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="ze-auth-surface flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-white/80 bg-white/85 p-9 text-center shadow-[0_28px_70px_-42px_rgba(15,23,42,0.55)]">
        <p className="ze-kicker justify-center">Nicht gefunden</p>
        <h1 className="mt-5 font-display text-7xl font-bold tracking-tighter text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Seite nicht gefunden</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="ze-auth-surface flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-white/80 bg-white/85 p-9 text-center shadow-[0_28px_70px_-42px_rgba(15,23,42,0.55)]">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Diese Seite konnte nicht geladen werden
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Es ist ein Fehler aufgetreten. Laden Sie die Seite erneut oder gehen Sie zurück zur
          Startseite.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Erneut versuchen
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ZunftEcho – KI-Mitarbeiter für SHK-Betriebe" },
      {
        name: "description",
        content:
          "ZunftEcho ist die KI-Mitarbeiter-Plattform für Heizung, Sanitär und Klima. Anfragen automatisch annehmen, qualifizieren und in Leads verwandeln.",
      },
      { name: "author", content: "ZunftEcho" },
      { property: "og:title", content: "ZunftEcho – KI-Mitarbeiter für SHK-Betriebe" },
      {
        property: "og:description",
        content: "Die KI-Mitarbeiter-Plattform für Heizung, Sanitär und Klima.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://zunftecho.de/zunftecho-mark.png" },
      { property: "og:image:alt", content: "ZunftEcho Markenzeichen" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://zunftecho.de/zunftecho-mark.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Runs before the client bundle (and therefore before the Supabase client's
// implicit-flow URL detection) so a recovery hash is never lost. No token is
// logged or exposed; the whole fragment is forwarded as-is.
const RECOVERY_REDIRECT_SCRIPT = `(function(){try{var h=location.hash;if(!h||h.charAt(0)!=="#")return;var p=new URLSearchParams(h.slice(1));if(p.get("type")!=="recovery")return;if(!p.get("access_token")&&!p.get("refresh_token"))return;if(location.pathname==="/passwort-zuruecksetzen")return;location.replace("/passwort-zuruecksetzen"+location.search+h);}catch(e){}})();`;

// Apply the saved dashboard theme before CSS paints. Restricting it to the
// authenticated workspace keeps the public marketing and auth pages neutral.
const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var t=localStorage.getItem("zunftecho_theme");var p=location.pathname;var a=/^\\/(dashboard|unternehmen|ki-mitarbeiter|installation|team|hilfe|konversationen|leads|kunden|angebote|auftraege|rechnungen|abonnement|aufgaben|termine|einstellungen|einrichtung)(\\/|$)/.test(p);var d=a&&t==="dark";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: RECOVERY_REDIRECT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
