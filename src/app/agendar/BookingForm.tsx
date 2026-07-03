"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitBooking, type BookingState } from "@/app/actions/booking";
import { services } from "@/content/services";
import Logo from "@/components/ui/Logo";

const initial: BookingState = { success: false, error: null };

export default function BookingForm() {
  const [state, action, isPending] = useActionState(submitBooking, initial);

  if (state.success) {
    return <SuccessView />;
  }

  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Nombre completo"
          name="nombre"
          type="text"
          autoComplete="name"
          required
          error={fe.nombre}
        />
        <Field
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={fe.email}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Teléfono"
          name="telefono"
          type="tel"
          autoComplete="tel"
          required
          error={fe.telefono}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="servicio" className="text-sm font-medium text-ink/80">
            Servicio de interés <span className="text-purple-1">*</span>
          </label>
          <select
            id="servicio"
            name="servicio"
            required
            defaultValue=""
            className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-ink transition-colors
              focus:outline-none focus:ring-2 focus:ring-purple-1/30
              ${fe.servicio ? "border-red-400" : "border-ink/20 hover:border-purple-3"}`}
          >
            <option value="" disabled>
              Selecciona un servicio…
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          {fe.servicio && <p className="text-xs text-red-600">{fe.servicio}</p>}
        </div>
      </div>

      <TextArea
        label="Disponibilidad horaria"
        name="disponibilidad"
        placeholder="Ej: Lunes a viernes por las mañanas, o fines de semana por la tarde…"
        rows={3}
        required
        error={fe.disponibilidad}
        hint="Indica los días y horarios en que generalmente tienes disponibilidad."
      />

      <TextArea
        label="Cuéntanos un poco (opcional)"
        name="mensaje"
        placeholder="Puedes compartir brevemente qué te trae o qué estás buscando, si lo deseas…"
        rows={4}
        hint="No hay respuestas correctas ni incorrectas. Escribe lo que quieras compartir."
      />

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-full bg-purple-1 px-8 py-4 text-sm font-medium tracking-wide text-white
          transition-all hover:bg-purple-2 focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-purple-1 focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Enviando…" : "Agenda tu sesión exploratoria gratuita"}
      </button>

      <p className="text-center text-xs text-ink/50">
        Tus datos se tratan con absoluta confidencialidad y no se comparten con terceros.
      </p>
    </form>
  );
}

function SuccessView() {
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <Logo className="h-20 w-20" variant="purple" />
      <div className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl text-ink sm:text-3xl">
          Tu solicitud ha sido enviada.
        </h2>
        <p className="max-w-md font-serif text-base leading-relaxed text-ink/70 sm:text-lg">
          Nos pondremos en contacto contigo a la brevedad para coordinar el mejor momento.
          Revisa también tu correo — te hemos enviado una confirmación.
        </p>
        <p className="mt-4 font-serif italic text-purple-2">
          El camino hacia ti comienza con una conversación.
        </p>
      </div>
      <Link
        href="/"
        className="mt-2 rounded-full border border-purple-1 px-8 py-3.5 text-sm text-purple-1
          transition-colors hover:bg-purple-1 hover:text-white"
      >
        Volver al inicio
      </Link>
    </div>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
};

function Field({ label, name, type = "text", autoComplete, required, error, placeholder }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-purple-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        className={`w-full rounded-lg border bg-white px-4 py-3 text-sm text-ink transition-colors
          placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-purple-1/30
          ${error ? "border-red-400" : "border-ink/20 hover:border-purple-3"}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

type TextAreaProps = {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
  hint?: string;
};

function TextArea({ label, name, placeholder, rows = 3, required, error, hint }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-purple-1">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className={`w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm text-ink transition-colors
          placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-purple-1/30
          ${error ? "border-red-400" : "border-ink/20 hover:border-purple-3"}`}
      />
      {hint && !error && <p className="text-xs text-ink/40">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
