import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Bot, LockKeyhole } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { germanAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Anmelden – ZunftEcho" },
      {
        name: "description",
        content:
          "Melden Sie sich bei ZunftEcho an und verwalten Sie Ihren KI-Mitarbeiter für Ihren SHK-Betrieb.",
      },
      { property: "og:title", content: "Anmelden – ZunftEcho" },
      {
        property: "og:description",
        content: "Zugang zur KI-Mitarbeiter-Plattform für Heizung, Sanitär und Klima.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigateAfterLogin = useCallback(() => {
    const pendingInvite = window.localStorage.getItem("zunftecho_pending_invite");
    if (pendingInvite && /^[a-f0-9]{64}$/i.test(pendingInvite)) {
      navigate({ to: "/einladung", search: { token: pendingInvite }, replace: true });
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }, [navigate]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigateAfterLogin();
    });
    return () => {
      active = false;
    };
  }, [navigateAfterLogin]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Bitte geben Sie E-Mail-Adresse und Passwort ein.");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(germanAuthError(signInError.message));
      return;
    }
    if (!data.session) {
      setError("Anmeldung nicht möglich. Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.");
      return;
    }

    navigateAfterLogin();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bot className="size-5" />
            </span>
            <span className="font-display text-xl font-semibold">ZunftEcho</span>
          </div>

          <h1 className="text-2xl font-semibold">Willkommen zurück</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Melden Sie sich an, um Ihren KI-Mitarbeiter zu verwalten.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@betrieb.de"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <Checkbox id="remember" defaultChecked /> Angemeldet bleiben
              </label>
              <Link to="/passwort-vergessen" className="font-medium text-primary">
                Passwort vergessen?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Anmeldung läuft …" : "Anmelden"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Interesse an ZunftEcho?{" "}
            <Link to="/registrieren" className="font-medium text-primary">
              Pilot anfragen
            </Link>
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            <Link to="/impressum" className="hover:text-foreground">
              Impressum
            </Link>
            <span className="mx-2">·</span>
            <Link to="/datenschutz" className="hover:text-foreground">
              Datenschutz
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <p className="text-sm text-sidebar-foreground/70">Für Heizung · Sanitär · Klima</p>
        <div>
          <h2 className="font-display text-3xl leading-tight font-semibold">
            Ihr KI-Mitarbeiter nimmt jede Anfrage an – auch nach Feierabend.
          </h2>
          <p className="mt-4 max-w-md text-sm text-sidebar-foreground/75">
            Anfragen qualifizieren, Termine vorbereiten und Leads sauber dokumentieren. Damit Ihr
            Team sich auf die Baustelle konzentrieren kann.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
          <LockKeyhole className="size-4" /> Geschützter Arbeitsbereich · nur für eingerichtete
          Betriebe
        </div>
      </div>
    </div>
  );
}
