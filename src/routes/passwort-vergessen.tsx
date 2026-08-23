import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, Bot, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { germanAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/passwort-vergessen")({
  head: () => ({
    meta: [
      { title: "Passwort vergessen – HandwerkAI" },
      {
        name: "description",
        content:
          "Setzen Sie Ihr HandwerkAI-Passwort zurück: Wir senden Ihnen einen sicheren Link per E-Mail.",
      },
      { property: "og:title", content: "Passwort vergessen – HandwerkAI" },
      {
        property: "og:description",
        content: "Link zum Zurücksetzen des Passworts für Ihr HandwerkAI-Konto anfordern.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);

    if (!email.trim()) {
      setError("Bitte geben Sie Ihre E-Mail-Adresse ein.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/passwort-zuruecksetzen`,
    });
    setLoading(false);

    if (resetError) {
      setError(germanAuthError(resetError.message));
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold">HandwerkAI</span>
        </div>

        {sent ? (
          <div className="surface-panel space-y-4 p-6">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <MailCheck className="size-5" />
            </span>
            <h1 className="text-2xl font-semibold">E-Mail versendet</h1>
            <p className="text-sm text-muted-foreground">
              Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum
              Zurücksetzen des Passworts gesendet.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Zur Anmeldung</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Passwort zurücksetzen</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen.
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Link wird gesendet …" : "Link senden"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  );
}
