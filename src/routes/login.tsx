import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, LockKeyhole } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
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

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

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

    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="ze-auth-surface grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
      <div className="relative flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="absolute top-8 left-8 hidden size-2 rounded-full bg-orange-400 shadow-[0_0_0_8px_rgba(251,146,60,0.1)] sm:block" />
        <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/78 p-6 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur sm:p-9">
          <div className="mb-8 flex items-center gap-2">
            <span className="ze-mark-shell flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white">
              <BrandMark className="size-10" />
            </span>
            <span className="font-display text-xl font-semibold">ZunftEcho</span>
          </div>

          <p className="ze-kicker">Geschützter Zugang</p>
          <h1 className="mt-4 text-3xl font-semibold">Willkommen zurück</h1>
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

      <div className="ze-auth-grid relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex xl:p-16">
        <div className="absolute -top-32 -right-24 size-96 rounded-full border border-sky-300/10 shadow-[0_0_0_50px_rgba(14,165,233,0.035),0_0_0_100px_rgba(14,165,233,0.02)]" />
        <p className="relative text-sm font-semibold tracking-wide text-sky-300 uppercase">
          Für Heizung · Sanitär · Klima
        </p>
        <div className="relative max-w-xl">
          <p className="mb-5 font-mono text-xs text-sky-300/70">ANFRAGE → QUALIFIZIERUNG → TEAM</p>
          <h2 className="font-display text-4xl leading-[1.08] font-semibold tracking-tight xl:text-5xl">
            Jede Anfrage landet vorbereitet beim richtigen Menschen.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-sidebar-foreground/70">
            Anfragen qualifizieren, Termine vorbereiten und Leads sauber dokumentieren. Damit Ihr
            Team sich auf die Baustelle konzentrieren kann.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            {["Anliegen klar", "Priorität sichtbar", "Nächster Schritt"].map((item, index) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <span className="font-mono text-sky-300">0{index + 1}</span>
                <p className="mt-2 text-sidebar-foreground/75">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-sidebar-foreground/60">
          <LockKeyhole className="size-4" /> Geschützter Arbeitsbereich · nur für eingerichtete
          Betriebe
        </div>
      </div>
    </div>
  );
}
