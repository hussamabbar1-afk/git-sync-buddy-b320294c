import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Loader2, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { germanAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/einladung")({
  validateSearch: (search: Record<string, unknown>) => ({
    token:
      typeof search["token"] === "string" && /^[a-f0-9]{64}$/i.test(search["token"])
        ? search["token"]
        : "",
  }),
  head: () => ({
    meta: [{ title: "Teameinladung – ZunftEcho" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: InvitationPage,
});

type Mode = "login" | "register";

function InvitationPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function acceptInvite() {
    const { error: acceptError } = await supabase.rpc("accept_company_invite", {
      p_token: token,
    });
    if (acceptError) {
      setError(`Einladung konnte nicht angenommen werden: ${acceptError.message}`);
      return false;
    }
    await navigate({ to: "/dashboard", replace: true });
    return true;
  }

  useEffect(() => {
    let active = true;

    async function checkSession() {
      if (!token) {
        setError("Der Einladungslink ist unvollständig oder ungültig.");
        setChecking(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        await acceptInvite();
      }
      if (active) setChecking(false);
    }

    void checkSession();
    return () => {
      active = false;
    };
    // The token is immutable for a mounted invitation route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || submitting) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);

    if (mode === "login") {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError || !data.session) {
        setSubmitting(false);
        setError(germanAuthError(signInError?.message ?? "Anmeldung nicht möglich"));
        return;
      }
      await acceptInvite();
      setSubmitting(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/einladung?token=${encodeURIComponent(token)}`,
      },
    });
    if (signUpError) {
      setSubmitting(false);
      setError(germanAuthError(signUpError.message));
      return;
    }

    if (data.session) {
      await acceptInvite();
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setNotice(
      "Bitte bestätigen Sie jetzt Ihre E-Mail-Adresse. Der Bestätigungslink führt Sie sicher zu genau dieser Einladung zurück.",
    );
    setMode("login");
  }

  return (
    <div className="ze-auth-surface flex min-h-screen items-center justify-center px-5 py-12">
      <main className="w-full max-w-md rounded-3xl border border-white/80 bg-white/88 p-7 shadow-[0_28px_80px_-44px_rgba(15,23,42,0.5)] backdrop-blur-sm sm:p-9">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <span className="ze-mark-shell flex size-10 items-center justify-center bg-white">
            <BrandMark className="size-10" />
          </span>
          <div>
            <span className="block font-display text-lg font-semibold">ZunftEcho</span>
            <span className="block text-[10px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              Teamzugang
            </span>
          </div>
        </Link>

        <p className="ze-kicker">Gemeinsam arbeiten</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">Teameinladung annehmen</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Melden Sie sich an oder erstellen Sie ein Konto mit genau der E-Mail-Adresse, an die die
          Einladung gesendet wurde.
        </p>

        {checking ? (
          <p className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-600">
            <Loader2 className="size-4 animate-spin" /> Einladung wird geprüft …
          </p>
        ) : (
          <>
            {error ? (
              <div className="mt-6 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
              </div>
            ) : null}
            {notice ? (
              <div className="mt-6 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {notice}
              </div>
            ) : null}

            {token ? (
              <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                {mode === "register" ? (
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Vollständiger Name</Label>
                    <Input
                      id="invite-name"
                      autoComplete="name"
                      required
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="invite-email">E-Mail-Adresse</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-password">Passwort</Label>
                  <Input
                    id="invite-password"
                    type="password"
                    minLength={8}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : mode === "register" ? (
                    <UserPlus className="size-4" />
                  ) : (
                    <LogIn className="size-4" />
                  )}
                  {mode === "register" ? "Konto erstellen und beitreten" : "Anmelden und beitreten"}
                </Button>
              </form>
            ) : null}

            <button
              type="button"
              className="mt-5 w-full text-center text-sm font-medium text-primary hover:underline"
              onClick={() => {
                setMode((current) => (current === "register" ? "login" : "register"));
                setError(null);
                setNotice(null);
              }}
            >
              {mode === "register" ? "Ich habe bereits ein Konto" : "Neues Konto erstellen"}
            </button>
            <Link
              to="/login"
              className="mt-3 block w-full text-center text-sm text-slate-500 hover:text-slate-950 hover:underline"
            >
              Ohne Einladung normal anmelden
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
