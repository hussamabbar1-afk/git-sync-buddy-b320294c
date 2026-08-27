import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, CalendarDays, CircleCheck, Clock3, Loader2, Mail, Phone, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { asArray, asRecord, str } from "@/lib/crm";

export const Route = createFileRoute("/kundenportal")({
  validateSearch: (search: Record<string, unknown>) => ({
    token:
      typeof search.token === "string" && /^[a-f0-9]{64}$/i.test(search.token) ? search.token : "",
  }),
  head: () => ({
    meta: [{ title: "Kundenportal – ZunftEcho" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: CustomerPortalPage,
});

type PortalRequest = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type PortalAppointment = {
  id: string;
  service: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string;
  address: string | null;
  postalCode: string | null;
};

type PortalData = {
  companyName: string;
  companyPhone: string | null;
  companyEmail: string | null;
  customerName: string;
  customerNumber: string | null;
  expiresAt: string | null;
  requests: PortalRequest[];
  appointments: PortalAppointment[];
};

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const statusLabels: Record<string, string> = {
  new: "Neu",
  open: "In Bearbeitung",
  contacted: "Kontakt aufgenommen",
  qualified: "Geprüft",
  won: "Abgeschlossen",
  lost: "Beendet",
  pending: "Angefragt",
  confirmed: "Bestätigt",
  cancelled: "Abgesagt",
  completed: "Erledigt",
};

function formatDate(value: string | null) {
  if (!value) return "Datum offen";
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? "Datum offen" : dateFormatter.format(date);
}

function parsePortal(payload: unknown): PortalData | null {
  const root = asRecord(payload);
  if (root["ok"] !== true) return null;
  const company = asRecord(root["company"]);
  const customer = asRecord(root["customer"]);

  return {
    companyName: str(company["name"]) || "Ihr Handwerksbetrieb",
    companyPhone: str(company["phone"]),
    companyEmail: str(company["email"]),
    customerName: str(customer["display_name"]) || "Guten Tag",
    customerNumber: str(customer["customer_number"]),
    expiresAt: str(root["expires_at"]),
    requests: asArray(root["requests"]).map((value) => {
      const item = asRecord(value);
      return {
        id: str(item["id"]) || crypto.randomUUID(),
        title: str(item["title"]) || "Anfrage",
        description: str(item["description"]),
        status: str(item["status"]) || "open",
        createdAt: str(item["created_at"]),
        updatedAt: str(item["updated_at"]),
      };
    }),
    appointments: asArray(root["appointments"]).map((value) => {
      const item = asRecord(value);
      return {
        id: str(item["id"]) || crypto.randomUUID(),
        service: str(item["service"]),
        date: str(item["date"]),
        startTime: str(item["start_time"]),
        endTime: str(item["end_time"]),
        status: str(item["status"]) || "pending",
        address: str(item["address"]),
        postalCode: str(item["postal_code"]),
      };
    }),
  };
}

function CustomerPortalPage() {
  const { token } = Route.useSearch();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!token) {
        setError("Dieser Portal-Link ist unvollständig.");
        setLoading(false);
        return;
      }

      const { data: payload, error: portalError } = await supabase.rpc("resolve_customer_portal", {
        p_token: token,
      });
      if (!active) return;

      const parsed = portalError ? null : parsePortal(payload);
      if (!parsed) {
        setError("Dieser Portal-Link ist ungültig, abgelaufen oder wurde ersetzt.");
      } else {
        setData(parsed);
      }
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#f8fbff_0%,#ffffff_55%,#fff8ed_100%)] px-5 py-10 text-slate-950 sm:px-8">
      <main className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">ZunftEcho Kundenportal</span>
        </Link>

        {loading ? (
          <div className="mt-24 flex items-center justify-center gap-2 text-sm text-slate-600">
            <Loader2 className="size-4 animate-spin" /> Status wird geladen …
          </div>
        ) : error ? (
          <Card className="mt-12 border-red-200">
            <CardContent className="py-10 text-center text-sm text-red-800">{error}</CardContent>
          </Card>
        ) : data ? (
          <>
            <section className="mt-10 rounded-3xl bg-slate-950 p-7 text-white sm:p-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-sky-300">
                    Statusübersicht von {data.companyName}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold">Hallo {data.customerName}</h1>
                  <p className="mt-3 text-sm text-slate-300">
                    Hier sehen Sie Ihre aktuellen Anfragen und Termine ohne zusätzliche Anmeldung.
                  </p>
                </div>
                {data.customerNumber ? (
                  <Badge className="w-fit bg-white/10 text-white">
                    Kundennr. {data.customerNumber}
                  </Badge>
                ) : null}
              </div>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="size-5" /> Ihre Anfragen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.requests.length ? (
                    data.requests.map((request) => (
                      <div key={request.id} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">{request.title}</p>
                          <Badge variant="secondary">
                            {statusLabels[request.status] ?? request.status}
                          </Badge>
                        </div>
                        {request.description ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {request.description}
                          </p>
                        ) : null}
                        <p className="mt-3 text-xs text-slate-500">
                          Aktualisiert: {request.updatedAt ? formatDate(request.updatedAt) : "—"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      Aktuell sind keine Anfragen hinterlegt.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="size-5" /> Ihre Termine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.appointments.length ? (
                    data.appointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{appointment.service || "Termin"}</p>
                            <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                              <Clock3 className="size-4" /> {formatDate(appointment.date)}
                              {appointment.startTime
                                ? ` · ${appointment.startTime.slice(0, 5)} Uhr`
                                : ""}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {statusLabels[appointment.status] ?? appointment.status}
                          </Badge>
                        </div>
                        {appointment.address || appointment.postalCode ? (
                          <p className="mt-3 text-xs text-slate-500">
                            {[appointment.postalCode, appointment.address]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Aktuell sind keine Termine hinterlegt.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="flex items-center gap-2 font-medium">
                <CircleCheck className="size-5 text-emerald-600" /> Rückfrage zu einem Vorgang?
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                {data.companyPhone ? (
                  <a
                    className="inline-flex items-center gap-2 hover:text-slate-950"
                    href={`tel:${data.companyPhone}`}
                  >
                    <Phone className="size-4" /> {data.companyPhone}
                  </a>
                ) : null}
                {data.companyEmail ? (
                  <a
                    className="inline-flex items-center gap-2 hover:text-slate-950"
                    href={`mailto:${data.companyEmail}`}
                  >
                    <Mail className="size-4" /> {data.companyEmail}
                  </a>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
