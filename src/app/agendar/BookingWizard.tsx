"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { createAppointment, type AppointmentState } from "@/app/actions/schedule";

const appointmentInitial: AppointmentState = { success: false, error: null };
import type { ServiceRow, ScheduleConfig } from "./page";

// ─── Types ──────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface ContactData {
  nombre: string;
  email: string;
  telefono: string;
  motivo: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

const STEP_LABELS: Record<Step, string> = {
  1: "Servicio",
  2: "Fecha",
  3: "Horario",
  4: "Datos",
  5: "Confirmar",
};

// ─── Main component ─────────────────────────────────────────────────────────

export default function BookingWizard({
  services,
  scheduleConfig,
}: {
  services: ServiceRow[];
  scheduleConfig: ScheduleConfig;
}) {
  const [step, setStep] = useState<Step>(1);
  const [selectedService, setSelectedService] = useState<ServiceRow | null>(null);
  const [selectedFecha, setSelectedFecha] = useState<string | null>(null);
  const [selectedHora, setSelectedHora] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactData | null>(null);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [formState, formAction, isSubmitting] = useActionState(
    createAppointment,
    appointmentInitial,
  );

  async function loadSlots(serviceId: string, fecha: string) {
    setSlotsLoading(true);
    setSlotsError(null);
    setSlots([]);
    try {
      const res = await fetch(
        `/api/slots?serviceId=${encodeURIComponent(serviceId)}&fecha=${encodeURIComponent(fecha)}`,
      );
      const json = await res.json() as { slots?: string[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error");
      setSlots(json.slots ?? []);
    } catch {
      setSlotsError("No pudimos cargar los horarios. Intenta de nuevo.");
    } finally {
      setSlotsLoading(false);
    }
  }

  function selectDate(fecha: string) {
    setSelectedFecha(fecha);
    setSelectedHora(null);
    setStep(3);
    loadSlots(selectedService!.id, fecha);
  }

  // Show success view
  if (formState.success && formState.appointmentData) {
    const d = formState.appointmentData;
    return (
      <div className="flex flex-col items-center gap-8 rounded-2xl border border-ink/8 bg-white px-8 py-14 text-center shadow-sm">
        <Logo className="h-16 w-16" variant="purple" />
        <div className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-ink sm:text-3xl">
            ¡Tu cita ha sido reservada!
          </h2>
          <div className="mx-auto max-w-sm rounded-xl bg-lavender px-6 py-5 text-left text-sm">
            <p className="mb-3 text-xs uppercase tracking-widest text-purple-3">Resumen</p>
            <div className="flex flex-col gap-2 text-ink/80">
              <p><span className="font-medium text-ink">Servicio:</span> {d.serviceName}</p>
              <p className="capitalize"><span className="font-medium text-ink">Fecha:</span> {d.fecha}</p>
              <p><span className="font-medium text-ink">Hora:</span> {d.hora} h</p>
            </div>
          </div>
          <p className="max-w-md font-serif text-base leading-relaxed text-ink/60">
            Enviamos una confirmación a <strong>{d.email}</strong>.
            Revisa tu bandeja de entrada (y spam, por si acaso).
          </p>
          <p className="font-serif italic text-purple-2">El camino hacia ti comienza con una conversación.</p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-purple-1 px-8 py-3.5 text-sm text-purple-1
            transition-colors hover:bg-purple-1 hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Card */}
      <div className="rounded-2xl border border-ink/8 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        {step === 1 && (
          <StepService
            services={services}
            selected={selectedService}
            onSelect={setSelectedService}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepFecha
            scheduleConfig={scheduleConfig}
            selected={selectedFecha}
            onSelect={selectDate}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepHorario
            fecha={selectedFecha!}
            slots={slots}
            loading={slotsLoading}
            error={slotsError}
            selected={selectedHora}
            onSelect={setSelectedHora}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
            onRetry={() => loadSlots(selectedService!.id, selectedFecha!)}
          />
        )}
        {step === 4 && (
          <StepContacto
            initial={contact}
            onNext={(data) => { setContact(data); setStep(5); }}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <StepConfirmar
            service={selectedService!}
            fecha={selectedFecha!}
            hora={selectedHora!}
            contact={contact!}
            formState={formState}
            formAction={formAction}
            isSubmitting={isSubmitting}
            onBack={() => setStep(4)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                s < current
                  ? "bg-purple-1 text-white"
                  : s === current
                    ? "border-2 border-purple-1 text-purple-1"
                    : "border border-ink/20 text-ink/30"
              }`}
            >
              {s < current ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                s
              )}
            </div>
            <span
              className={`hidden text-[10px] sm:block ${
                s === current ? "font-medium text-purple-1" : "text-ink/30"
              }`}
            >
              {STEP_LABELS[s]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-1 h-px flex-1 w-8 sm:w-12 ${s < current ? "bg-purple-1" : "bg-ink/15"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Service ─────────────────────────────────────────────────────────

function StepService({
  services,
  selected,
  onSelect,
  onNext,
}: {
  services: ServiceRow[];
  selected: ServiceRow | null;
  onSelect: (s: ServiceRow) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl text-ink">¿Qué servicio te interesa?</h2>
        <p className="mt-1 text-sm text-ink/50">Selecciona el servicio para continuar.</p>
      </div>

      <div className="flex flex-col gap-3">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`group flex items-start gap-4 rounded-xl border px-5 py-4 text-left transition-all ${
              selected?.id === s.id
                ? "border-purple-1 bg-purple-1/5 ring-1 ring-purple-1/20"
                : "border-ink/15 hover:border-purple-3"
            }`}
          >
            {/* Radio */}
            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
              selected?.id === s.id ? "border-purple-1 bg-purple-1" : "border-ink/30 group-hover:border-purple-3"
            }`}>
              {selected?.id === s.id && (
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-medium text-sm ${selected?.id === s.id ? "text-purple-1" : "text-ink"}`}>
                  {s.nombre}
                </span>
                {s.es_premium && (
                  <span className="rounded-full border border-purple-3/40 bg-purple-1/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-purple-2">
                    Destacado
                  </span>
                )}
                <span className="ml-auto text-xs text-ink/40">{s.duracion_minutos} min</span>
              </div>
              {s.descripcion && (
                <p className="text-xs leading-relaxed text-ink/55 line-clamp-2">{s.descripcion}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <NextBtn disabled={!selected} onClick={onNext} />
      </div>
    </div>
  );
}

// ─── Step 2: Date ────────────────────────────────────────────────────────────

function StepFecha({
  scheduleConfig,
  selected,
  onSelect,
  onBack,
}: {
  scheduleConfig: ScheduleConfig;
  selected: string | null;
  onSelect: (fecha: string) => void;
  onBack: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-based

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  // Disable going to past months
  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayJS = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const firstDayISO = firstDayJS === 0 ? 7 : firstDayJS; // 1=Mon
  const paddingCells = firstDayISO - 1;

  function cellDate(day: number) {
    return new Date(viewYear, viewMonth, day);
  }

  function isoDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function isWorkingDay(date: Date) {
    const jsDay = date.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    return (scheduleConfig.dias_laborables as number[]).includes(isoDay);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl text-ink">¿Qué día te interesa?</h2>
        <p className="mt-1 text-sm text-ink/50">Selecciona una fecha disponible.</p>
      </div>

      {/* Calendar */}
      <div className="mx-auto w-full max-w-sm">
        {/* Nav */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            disabled={!canGoPrev}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors
              hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Mes anterior"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="font-serif text-base font-medium text-ink capitalize">
            {MESES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-ink/5"
            aria-label="Mes siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {DIAS_CORTOS.map((d) => (
            <div key={d} className="py-1 text-[11px] font-medium uppercase tracking-wide text-ink/30">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: paddingCells }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const date = cellDate(day);
            const isPast = date < today;
            const isWorking = isWorkingDay(date);
            const dateStr = isoDate(date);
            const isSelected = selected === dateStr;
            const isDisabled = isPast || !isWorking;

            return (
              <div key={day} className="flex items-center justify-center p-0.5">
                <button
                  disabled={isDisabled}
                  onClick={() => onSelect(dateStr)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected
                      ? "bg-purple-1 font-medium text-white"
                      : isDisabled
                        ? "cursor-not-allowed text-ink/20"
                        : "text-ink hover:bg-purple-1/10 hover:text-purple-1"
                  }`}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <BackBtn onClick={onBack} />
        <p className="text-xs text-ink/40">Al seleccionar una fecha, verás los horarios disponibles.</p>
      </div>
    </div>
  );
}

// ─── Step 3: Time slot ───────────────────────────────────────────────────────

function StepHorario({
  fecha,
  slots,
  loading,
  error,
  selected,
  onSelect,
  onNext,
  onBack,
  onRetry,
}: {
  fecha: string;
  slots: string[];
  loading: boolean;
  error: string | null;
  selected: string | null;
  onSelect: (h: string) => void;
  onNext: () => void;
  onBack: () => void;
  onRetry: () => void;
}) {
  const fechaDisplay = (() => {
    const [y, mo, d] = fecha.split("-").map(Number);
    const date = new Date(y, mo - 1, d);
    return new Intl.DateTimeFormat("es-MX", {
      weekday: "long", day: "numeric", month: "long",
    }).format(date);
  })();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl text-ink capitalize">
          Horarios — {fechaDisplay}
        </h2>
        <p className="mt-1 text-sm text-ink/50">Selecciona el horario que prefieres.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-1 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={onRetry} className="mt-3 text-sm font-medium text-red-700 underline">
            Intentar de nuevo
          </button>
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="rounded-xl border border-ink/10 bg-lavender p-6 text-center">
          <p className="font-serif text-base text-ink/60">
            No hay horarios disponibles para esta fecha.
          </p>
          <p className="mt-2 text-sm text-ink/40">Por favor selecciona otra fecha.</p>
        </div>
      )}

      {!loading && !error && slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={() => onSelect(slot)}
              className={`rounded-xl border px-5 py-3 text-sm font-medium transition-colors ${
                selected === slot
                  ? "border-purple-1 bg-purple-1 text-white"
                  : "border-ink/20 text-ink hover:border-purple-3 hover:text-purple-1"
              }`}
            >
              {slot} h
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <BackBtn onClick={onBack} />
        <NextBtn disabled={!selected} onClick={onNext} />
      </div>
    </div>
  );
}

// ─── Step 4: Contact form ────────────────────────────────────────────────────

function StepContacto({
  initial,
  onNext,
  onBack,
}: {
  initial: ContactData | null;
  onNext: (data: ContactData) => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Partial<ContactData>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: ContactData = {
      nombre: (fd.get("nombre") as string).trim(),
      email: (fd.get("email") as string).trim(),
      telefono: (fd.get("telefono") as string).trim(),
      motivo: (fd.get("motivo") as string).trim(),
    };

    const errs: Partial<ContactData> = {};
    if (!data.nombre) errs.nombre = "Tu nombre es requerido.";
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.email = "Introduce un email válido.";
    if (!data.telefono) errs.telefono = "Tu teléfono es requerido.";

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onNext(data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-xl text-ink">Tus datos de contacto</h2>
        <p className="mt-1 text-sm text-ink/50">Para confirmar tu cita necesitamos estos datos.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nombre completo" name="nombre" type="text" autoComplete="name"
          defaultValue={initial?.nombre} error={errors.nombre} required
        />
        <Field
          label="Correo electrónico" name="email" type="email" autoComplete="email"
          defaultValue={initial?.email} error={errors.email} required
        />
      </div>

      <Field
        label="Teléfono" name="telefono" type="tel" autoComplete="tel"
        defaultValue={initial?.telefono} error={errors.telefono} required
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="motivo" className="text-sm font-medium text-ink/80">
          Motivo de consulta <span className="text-ink/35">(opcional)</span>
        </label>
        <textarea
          id="motivo" name="motivo" rows={3}
          defaultValue={initial?.motivo}
          placeholder="Puedes compartir brevemente qué te trae o qué estás buscando, si lo deseas…"
          className="w-full resize-none rounded-lg border border-ink/20 bg-white px-4 py-3 text-sm text-ink
            transition-colors placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-purple-1/30
            hover:border-purple-3"
        />
        <p className="text-xs text-ink/35">No hay respuestas correctas ni incorrectas.</p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <BackBtn onClick={onBack} />
        <button
          type="submit"
          className="rounded-full bg-purple-1 px-6 py-3 text-sm font-medium text-white
            transition-colors hover:bg-purple-2"
        >
          Revisar cita →
        </button>
      </div>
    </form>
  );
}

// ─── Step 5: Confirm + submit ────────────────────────────────────────────────

function StepConfirmar({
  service,
  fecha,
  hora,
  contact,
  formState,
  formAction,
  isSubmitting,
  onBack,
}: {
  service: ServiceRow;
  fecha: string;
  hora: string;
  contact: ContactData;
  formState: AppointmentState;
  formAction: (payload: FormData) => void | Promise<void>;
  isSubmitting: boolean;
  onBack: () => void;
}) {
  const fechaDisplay = (() => {
    const [y, mo, d] = fecha.split("-").map(Number);
    return new Intl.DateTimeFormat("es-MX", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(new Date(y, mo - 1, d));
  })();

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Hidden fields */}
      <input type="hidden" name="serviceId" value={service.id} />
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="hora" value={hora} />
      <input type="hidden" name="nombre" value={contact.nombre} />
      <input type="hidden" name="email" value={contact.email} />
      <input type="hidden" name="telefono" value={contact.telefono} />
      <input type="hidden" name="motivo" value={contact.motivo} />

      <div>
        <h2 className="font-serif text-xl text-ink">Confirma tu cita</h2>
        <p className="mt-1 text-sm text-ink/50">Revisa los datos antes de confirmar.</p>
      </div>

      {formState.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formState.error}
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-col gap-3 rounded-xl bg-lavender px-6 py-5 text-sm">
        <SummaryRow label="Servicio" value={service.nombre} />
        {service.es_premium && (
          <div className="-mt-1 ml-[6.5rem]">
            <span className="rounded-full border border-purple-3/40 bg-purple-1/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-purple-2">
              Destacado
            </span>
          </div>
        )}
        <SummaryRow label="Duración" value={`${service.duracion_minutos} minutos`} />
        <div className="my-1 border-t border-ink/10" />
        <SummaryRow label="Fecha" value={fechaDisplay} />
        <SummaryRow label="Hora" value={`${hora} h`} />
        <div className="my-1 border-t border-ink/10" />
        <SummaryRow label="Nombre" value={contact.nombre} />
        <SummaryRow label="Email" value={contact.email} />
        <SummaryRow label="Teléfono" value={contact.telefono} />
        {contact.motivo && (
          <SummaryRow label="Motivo" value={contact.motivo} />
        )}
      </div>

      <p className="text-xs text-ink/40">
        Recibirás una confirmación por correo. Si necesitas cambiar algo, usa el botón "Volver".
      </p>

      <div className="flex items-center justify-between">
        <BackBtn onClick={onBack} disabled={isSubmitting} />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-purple-1 px-8 py-3.5 text-sm font-medium text-white
            transition-all hover:bg-purple-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Reservando…" : "Confirmar cita"}
        </button>
      </div>
    </form>
  );
}

// ─── Shared primitives ───────────────────────────────────────────────────────

function NextBtn({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full bg-purple-1 px-6 py-3 text-sm font-medium text-white
        transition-all hover:bg-purple-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      Siguiente →
    </button>
  );
}

function BackBtn({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-sm text-ink/50 transition-colors hover:text-ink disabled:opacity-40"
    >
      ← Volver
    </button>
  );
}

function Field({
  label, name, type = "text", autoComplete, defaultValue, error, required,
}: {
  label: string; name: string; type?: string; autoComplete?: string;
  defaultValue?: string; error?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-purple-1">*</span>}
      </label>
      <input
        id={name} name={name} type={type} autoComplete={autoComplete}
        defaultValue={defaultValue} required={required}
        className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-ink transition-colors
          placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-purple-1/30
          ${error ? "border-red-400" : "border-ink/20 hover:border-purple-3"}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 text-ink/50">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
