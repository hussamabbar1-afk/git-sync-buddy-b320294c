import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Bot, CheckCircle2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { germanAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/passwort-zuruecksetzen")({
  head: () => ({
    meta: [
      { title: "Neues Passwort festlegen – ZunftEcho" },
      {
        name: "description",
        content: "Legen Sie ein neues Passwort für Ihr ZunftEcho-Konto fest.",
      },
      { property: "og:title", content: "Neues Passwort festlegen – ZunftEcho" },
      {
        property: "og:description",
        content: "Sicher ein neues Passwort für Ihr ZunftEcho-Konto vergeben.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

type SessionState = "loading" | "ready" | "invalid";

function ResetPasswordPage() {
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setSessionState("ready");
      }
    });

    // Supabase verarbeitet den Recovery-Link beim Laden der Seite.
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: sessionData }) => {
        if (!active) return;
        setSessionState((prev) =>
          prev === "ready" ? prev : sessionData.session ? "ready" : "invalid",
        );
      });
    }, 800);

    return () => {
      active = false;
      clearTimeout(timer);
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(germanAuthError(updateError.message));
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold">ZunftEcho</span>
        </div>

        {done ? (
          <div className="surface-panel space-y-4 p-6">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </span>
            <h1 className="text-2xl font-semibold">Passwort geändert</h1>
            <p className="text-sm text-muted-foreground">
              Ihr Passwort wurde erfolgreich aktualisiert. Bitte melden Sie sich mit Ihrem neuen
              Passwort an.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Zur Anmeldung</Link>
            </Button>
          </div>
        ) : sessionState === "loading" ? (
          <p className="text-sm text-muted-foreground">Link wird geprüft …</p>
        ) : sessionState === "invalid" ? (
          <div className="surface-panel space-y-4 p-6">
            <span className="flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </span>
            <h1 className="text-2xl font-semibold">Link ungültig oder abgelaufen</h1>
            <p className="text-sm text-muted-foreground">
              Dieser Link zum Zurücksetzen des Passworts ist nicht mehr gültig. Bitte fordern Sie
              einen neuen Link an.
            </p>
            <Button asChild className="w-full">
              <Link to="/passwort-vergessen">Neuen Link anfordern</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Neues Passwort festlegen</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Wählen Sie ein neues Passwort mit mindestens 6 Zeichen.
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
                <Label htmlFor="password">Neues Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Passwort bestätigen</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="Passwort wiederholen"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Passwort wird gespeichert …" : "Passwort speichern"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
