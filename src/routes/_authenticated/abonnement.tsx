import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { asRecord, str } from "@/lib/crm";

const checkoutSearchSchema = z.object({
  checkout: z.enum(["success", "cancelled"]).optional(),
});

export const Route = createFileRoute("/_authenticated/abonnement")({
  validateSearch: checkoutSearchSchema,
  head: () => ({
    meta: [
      { title: "Abo und Zahlungen – ZunftEcho" },
      {
        name: "description",
        content: "ZunftEcho-Tarif, Test-Checkout und bisherige Abonnementrechnungen verwalten.",
      },
    ],
  }),
  component: SubscriptionPage,
});

type Subscription = Tables<"company_subscriptions">;
type SubscriptionInvoice = Tables<"subscription_invoices">;

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  cancelled: "Gekündigt",
  expired: "Abgelaufen",
  incomplete: "Unvollständig",
  past_due: "Zahlung überfällig",
  paused: "Pausiert",
  trialing: "Testphase",
  unpaid: "Unbezahlt",
};

function formatMoney(cents: number, currency = "eur") {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(value))
    : "–";
}

function SubscriptionPage() {
  const { checkout } = Route.useSearch();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState<"pilot" | "monthly" | null>(null);
  const [portalPending, setPortalPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBilling() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id, role")
      .eq("id", userId)
      .maybeSingle();
    if (profileError || !profile?.company_id) {
      setError("Das Unternehmenskonto konnte nicht geladen werden.");
      setLoading(false);
      return;
    }

    setRole(profile.role);
    const [subscriptionResult, invoiceResult] = await Promise.all([
      supabase
        .from("company_subscriptions")
        .select("*")
        .eq("company_id", profile.company_id)
        .maybeSingle(),
      supabase
        .from("subscription_invoices")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (subscriptionResult.error || invoiceResult.error) {
      setError("Abo- und Rechnungsdaten konnten nicht vollständig geladen werden.");
    } else {
      setError(null);
      setSubscription(subscriptionResult.data);
      setInvoices(invoiceResult.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadBilling();
  }, []);

  async function startCheckout(plan: "pilot" | "monthly") {
    if (checkoutPlan) return;
    setCheckoutPlan(plan);
    setError(null);
    const { data, error: functionError } = await supabase.functions.invoke("stripe-checkout", {
      body: { plan },
    });
    setCheckoutPlan(null);

    const payload = asRecord(data);
    const url = str(payload["url"]);
    if (functionError || !url) {
      setError(
        str(payload["message"]) ||
          "Stripe ist noch nicht mit Testschlüsseln verbunden. Es wurde keine Zahlung ausgelöst.",
      );
      return;
    }
    window.location.assign(url);
  }

  async function openBillingPortal() {
    if (portalPending) return;
    setPortalPending(true);
    setError(null);
    const { data, error: functionError } = await supabase.functions.invoke("stripe-portal");
    setPortalPending(false);
    const payload = asRecord(data);
    const url = str(payload["url"]);
    if (functionError || !url) {
      setError(
        str(payload["message"]) ||
          "Das Stripe-Kundenportal steht erst nach einem erfolgreichen Test-Checkout zur Verfügung.",
      );
      return;
    }
    window.location.assign(url);
  }

  const canPurchase = role === "owner" || role === "admin";

  return (
    <AppShell>
      <PageHeader
        title="Abo und Zahlungen"
        description="Tarif, Test-Checkout und Stripe-Abonnementrechnungen an einem Ort."
      />

      <div className="mb-5 flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Sicherer Testmodus</p>
          <p className="mt-1 text-xs leading-5">
            Der Checkout akzeptiert technisch ausschließlich Stripe-Testschlüssel. Bis zur
            Gewerbeanmeldung werden keine echten Zahlungen eingezogen und keine Live-Abos gestartet.
          </p>
        </div>
      </div>

      {checkout === "success" ? (
        <p className="mb-5 flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="size-4" /> Test-Checkout abgeschlossen. Der Status wird über den
          Stripe-Webhook aktualisiert.
        </p>
      ) : null}
      {checkout === "cancelled" ? (
        <p className="mb-5 flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
          <AlertTriangle className="size-4" /> Checkout abgebrochen – es wurde nichts belastet.
        </p>
      ) : null}
      {error ? (
        <p className="mb-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" /> Aktueller Tarif
            </CardTitle>
            <CardDescription>Vom Stripe-Webhook synchronisierter Status.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Daten werden geladen …
              </p>
            ) : subscription ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {subscription.plan === "pilot" ? "30-Tage-Pilot" : "Regelbetrieb"}
                  </p>
                  <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                    {statusLabels[subscription.status] ?? subscription.status}
                  </Badge>
                </div>
                <p className="text-2xl font-semibold">
                  {formatMoney(subscription.amount_cents, subscription.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {subscription.plan === "monthly" ? " / Monat" : " einmalig"}
                  </span>
                </p>
                <dl className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <dt>Zeitraum bis</dt>
                    <dd>{formatDate(subscription.current_period_end)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Modus</dt>
                    <dd>{subscription.test_mode ? "Test" : "Live"}</dd>
                  </div>
                </dl>
                {canPurchase ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => void openBillingPortal()}
                    disabled={portalPending}
                  >
                    {portalPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ExternalLink className="size-4" />
                    )}
                    Stripe-Kundenportal öffnen
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Noch kein Testtarif verknüpft.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              plan: "pilot" as const,
              title: "30-Tage-Pilot",
              price: "99 €",
              suffix: "einmalig",
              description: "Persönliche Einrichtung, Widget und Auswertung für einen Betrieb.",
            },
            {
              plan: "monthly" as const,
              title: "Regelbetrieb",
              price: "149 €",
              suffix: "pro Monat",
              description: "Monatlich kündbarer Betrieb nach erfolgreicher Pilotphase.",
            },
          ].map((offer) => (
            <Card key={offer.plan}>
              <CardHeader>
                <CardTitle>{offer.title}</CardTitle>
                <CardDescription>{offer.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-semibold">
                  {offer.price}{" "}
                  <span className="text-sm font-normal text-muted-foreground">{offer.suffix}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Netto, zuzüglich gesetzlicher Umsatzsteuer, soweit anwendbar.
                </p>
                <Button
                  className="w-full"
                  variant={offer.plan === "pilot" ? "default" : "outline"}
                  disabled={!canPurchase || checkoutPlan !== null}
                  onClick={() => void startCheckout(offer.plan)}
                >
                  {checkoutPlan === offer.plan ? <Loader2 className="size-4 animate-spin" /> : null}
                  Test-Checkout starten
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {!canPurchase && !loading ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Nur Eigentümer und Administratoren können einen Checkout starten.
        </p>
      ) : null}

      <Card className="mt-5">
        <CardHeader>
          <CardTitle className="text-base">Zahlungsarten im Test</CardTitle>
          <CardDescription>
            Stripe zeigt nur Methoden an, die im Konto freigeschaltet und für den Checkout geeignet
            sind.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {["Kredit- und Debitkarte", "SEPA-Lastschrift", "PayPal"].map((method) => (
            <div key={method} className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" /> {method}
            </div>
          ))}
          <p className="sm:col-span-3 text-xs text-muted-foreground">
            Klarna ist für dieses B2B-Angebot bewusst nicht eingeplant, da Stripe Klarna nicht für
            B2B-Zahlungen unterstützt.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" /> Abo-Rechnungshistorie
            </CardTitle>
            <CardDescription>Von Stripe gemeldete Belege und Zahlungsstatus.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/preise">Tarife öffentlich ansehen</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Wird geladen …</p>
          ) : invoices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Noch keine Abo-Rechnungen vorhanden.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nummer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead className="text-right">Beleg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number || invoice.stripe_invoice_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(invoice.paid_at || invoice.created_at)}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(invoice.amount_due_cents, invoice.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.invoice_pdf || invoice.hosted_invoice_url ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={invoice.invoice_pdf || invoice.hosted_invoice_url || "#"}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Öffnen <ExternalLink className="size-3" />
                            </a>
                          </Button>
                        ) : (
                          "–"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
