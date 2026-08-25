import { Bot, CalendarCheck, CheckCircle2, RotateCcw, UserCheck } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Progress } from "@/components/ui/progress";

type DemoStage = 0 | 1 | 2 | 3;

const serviceOptions = ["Heizung ausgefallen", "Wasserleck", "Wartung anfragen"];
const locationOptions = ["12043 Berlin-Neukölln", "12347 Berlin-Britz", "Anderer Einsatzort"];
const appointmentOptions = ["Morgen · 08:00–10:00", "Morgen · 10:00–12:00", "Rückruf statt Termin"];

export function InteractiveChatDemo() {
  const [stage, setStage] = useState<DemoStage>(0);
  const [service, setService] = useState(serviceOptions[0]!);
  const [location, setLocation] = useState(locationOptions[0]!);
  const [appointment, setAppointment] = useState(appointmentOptions[0]!);

  const chooseService = (value: string) => {
    setService(value);
    setStage(1);
  };
  const chooseLocation = (value: string) => {
    setLocation(value);
    setStage(2);
  };
  const chooseAppointment = (value: string) => {
    setAppointment(value);
    setStage(3);
  };

  const reset = () => {
    setService(serviceOptions[0]!);
    setLocation(locationOptions[0]!);
    setAppointment(appointmentOptions[0]!);
    setStage(0);
  };

  const progress = stage === 0 ? 10 : stage === 1 ? 40 : stage === 2 ? 70 : 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_32px_80px_-30px_rgba(15,23,42,0.35)]">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-white">
            <Bot className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Lena · Beispielname</p>
            <p className="text-xs text-emerald-600">● Online · Name frei wählbar</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Live-Demo
        </span>
      </div>

      <div className="border-b border-slate-200 bg-white px-5 py-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>Anfrage wird vervollständigt</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="min-h-[310px] space-y-3 bg-slate-50/70 p-5 sm:p-6" aria-live="polite">
        <DemoMessage>Guten Tag! Wobei können wir Ihnen helfen?</DemoMessage>

        {stage === 0 ? (
          <DemoChoices options={serviceOptions} onChoose={chooseService} />
        ) : (
          <>
            <DemoMessage user>{service}</DemoMessage>
            <DemoMessage>Verstanden. Wo befindet sich der Einsatzort?</DemoMessage>
          </>
        )}

        {stage === 1 ? <DemoChoices options={locationOptions} onChoose={chooseLocation} /> : null}

        {stage >= 2 ? (
          <>
            <DemoMessage user>{location}</DemoMessage>
            <DemoMessage>
              Danke. Welche Option passt am besten? Die Verfügbarkeit wird vor der Buchung geprüft.
            </DemoMessage>
          </>
        ) : null}

        {stage === 2 ? (
          <DemoChoices options={appointmentOptions} onChoose={chooseAppointment} />
        ) : null}

        {stage === 3 ? (
          <>
            <DemoMessage user>{appointment}</DemoMessage>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4" /> Anfrage vollständig
              </p>
              <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-emerald-800/70">Anliegen</dt>
                  <dd className="font-medium">{service}</dd>
                </div>
                <div>
                  <dt className="text-emerald-800/70">Einsatzort</dt>
                  <dd className="font-medium">{location}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-emerald-800/70">Terminwunsch</dt>
                  <dd className="font-medium">{appointment}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-emerald-800/80">
                Im echten Chat folgen Kontaktdaten, Verfügbarkeitsprüfung und Übergabe an den
                Betrieb.
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <RotateCcw className="size-3.5" /> Demo neu starten
            </button>
          </>
        ) : null}
      </div>

      <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
            <UserCheck className="size-4" /> Anfrage qualifizieren
          </div>
          <p className="mt-1 text-xs text-emerald-800/75">Anliegen, Ort und Kontaktdaten</p>
        </div>
        <div className="rounded-xl bg-sky-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-900">
            <CalendarCheck className="size-4" /> Termin vorbereiten
          </div>
          <p className="mt-1 text-xs text-sky-800/75">Als Auswahl statt Freitext</p>
        </div>
      </div>
      <p className="border-t border-slate-100 px-4 py-2 text-center text-[10px] text-slate-400">
        Interaktive Beispielansicht · es werden keine Daten gesendet
      </p>
    </div>
  );
}

function DemoMessage({ children, user = false }: { children: ReactNode; user?: boolean }) {
  return (
    <div
      className={`max-w-[88%] rounded-2xl p-3 text-sm leading-6 shadow-sm ${
        user
          ? "ml-auto rounded-tr-md bg-primary text-white"
          : "rounded-tl-md border border-slate-200 bg-white text-slate-700"
      }`}
    >
      {children}
    </div>
  );
}

function DemoChoices({
  options,
  onChoose,
}: {
  options: string[];
  onChoose: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChoose(option)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-primary/40 hover:bg-sky-50 hover:text-primary"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
