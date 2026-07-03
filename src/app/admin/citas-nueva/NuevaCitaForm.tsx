"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createManualAppointment, type ManualApptState } from "@/app/actions/admin";

const INITIAL: ManualApptState = { success: false, error: null };

export default function NuevaCitaForm({
  serviceOptions,
}: {
  serviceOptions: { id: string; nombre: string; duracion_minutos: number }[];
}) {
  const router = useRouter();
  const [state, action, isPending] = useActionState(createManualAppointment, INITIAL);

  const [selectedSvc, setSelectedSvc] = useState(serviceOptions[0]?.id ?? "");
  const [fecha, setFecha] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (state.success) {
      router.push("/admin/citas");
      router.refresh();
    }
  }, [state.success, router]);

  useEffect(() => {
    if (!selectedSvc || !fecha) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetch(`/api/slots?serviceId=${selectedSvc}&fecha=${fecha}&skipAdvance=1`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedSvc, fecha]);

  const today = new Date().toLocaleDateString("en-CA");

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Service */}
      <Field label="Servicio" error={state.fieldErrors?.servicioId}>
        <select
          name="servicioId"
          value={selectedSvc}
          onChange={(e) => setSelectedSvc(e.target.value)}
          className={inputCls(!!state.fieldErrors?.servicioId)}
        >
          {serviceOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </Field>

      {/* Date */}
      <Field label="Fecha" error={state.fieldErrors?.fecha}>
        <input
          type="date"
          name="fecha"
          min={today}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={inputCls(!!state.fieldErrors?.fecha)}
        />
      </Field>

      {/* Time slot */}
      <Field label="Hora" error={state.fieldErrors?.hora_inicio}>
        {fecha && !loadingSlots && slots.length === 0 ? (
          <p className="text-sm text-red-500 py-2">Sin horarios disponibles para ese día.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {loadingSlots && (
              <p className="text-xs text-ink/40 py-2">Cargando horarios…</p>
            )}
            {!loadingSlots &&
              slots.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="hora_inicio"
                    value={s}
                    required
                    className="accent-purple-1"
                  />
                  <span className="text-sm text-ink">{s}</span>
                </label>
              ))}
            {!fecha && (
              <p className="text-xs text-ink/35 py-2">Selecciona una fecha primero.</p>
            )}
          </div>
        )}
      </Field>

      <hr className="border-ink/8" />

      {/* Client data */}
      <Field label="Nombre del cliente" error={state.fieldErrors?.nombre_cliente}>
        <input
          type="text"
          name="nombre_cliente"
          placeholder="Nombre completo"
          className={inputCls(!!state.fieldErrors?.nombre_cliente)}
        />
      </Field>
      <Field label="Email" error={state.fieldErrors?.email_cliente}>
        <input
          type="email"
          name="email_cliente"
          placeholder="correo@ejemplo.com"
          className={inputCls(!!state.fieldErrors?.email_cliente)}
        />
      </Field>
      <Field label="Teléfono" error={state.fieldErrors?.telefono_cliente}>
        <input
          type="tel"
          name="telefono_cliente"
          placeholder="+52 999 000 0000"
          className={inputCls(!!state.fieldErrors?.telefono_cliente)}
        />
      </Field>
      <Field label="Motivo de consulta" error={state.fieldErrors?.motivo_consulta}>
        <textarea
          name="motivo_consulta"
          rows={3}
          placeholder="Breve descripción del motivo (opcional)"
          className={inputCls(false) + " resize-none"}
        />
      </Field>

      {/* Estado inicial */}
      <Field label="Estado inicial" error={undefined}>
        <select name="estado" defaultValue="confirmed" className={inputCls(false)}>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmada</option>
        </select>
      </Field>

      {state.error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-purple-1 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-2 transition-colors disabled:opacity-60"
        >
          {isPending ? "Guardando…" : "Crear cita"}
        </button>
        <a
          href="/admin/citas"
          className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-medium text-ink/60 hover:border-purple-3 hover:text-ink transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}

function inputCls(error: boolean) {
  return `w-full rounded-xl border px-4 py-2.5 text-sm text-ink bg-white focus:outline-none transition-colors ${
    error
      ? "border-red-300 focus:border-red-400"
      : "border-ink/12 focus:border-purple-3"
  }`;
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
