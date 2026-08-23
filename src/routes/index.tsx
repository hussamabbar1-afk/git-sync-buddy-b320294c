import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  ssr: false,
  component: IndexRedirect,
});

function isRecoveryHash(hash: string): boolean {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return false;
  const params = new URLSearchParams(raw);
  const type = params.get("type");
  const hasTokenMarker =
    Boolean(params.get("access_token")) || Boolean(params.get("refresh_token"));
  return type === "recovery" && hasTokenMarker;
}

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (isRecoveryHash(hash)) {
      window.location.replace(`/passwort-zuruecksetzen${hash}`);
      return;
    }
    void navigate({ to: "/login", replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">Wird geladen …</p>
    </div>
  );
}
