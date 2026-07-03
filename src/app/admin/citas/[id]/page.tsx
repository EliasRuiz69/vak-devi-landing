import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import { formatFechaLong } from "@/lib/schedule-utils";
import {
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  markNoShow,
  updateAppointmentNotes,
} from "@/app/actions/admin";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
  no_show: "bg-red-50 text-red-600",
};

export default async function CitaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: appt } = await admin
    .from("appointments")
    .select("*, services(nombre, duracion_minutos, precio_mxn)")
    .eq("id", id)
    .single();

  if (!appt) notFound();

  const estado = appt.estado as string;
  const svc = appt.services as { nombre: string; duracion_minutos: number; precio_mxn: number | null } | null;
  const fechaLong = formatFechaLong(appt.fecha as string);

  // Bind server actions to this appointment's id
  const doConfirm = confirmAppointment.bind(null, id);
  const doComplete = completeAppointment.bind(null, id);
  const doCancel = cancelAppointment.bind(null, id);
  const doNoShow = markNoShow.bind(null, id);
  const saveNotes = updateAppointmentNotes.bind(null, id);

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/citas"
        className="inline-flex items-center gap-1.5 text-xs text-ink/45 hover:text-purple-2 transition-colors mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5m7-7l-7 7 7 7" />
        </svg>
        Volver a citas
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[estado]}`}>
            {STATUS_LABEL[estado]}
          </span>
          {svc && <span className="text-xs text-ink/45">{svc.nombre}</span>}
        </div>
        <h1 className="font-serif text-3xl text-ink capitalize">{appt.nombre_cliente as string}</h1>
        <p className="text-sm text-ink/50 mt-1 capitalize">
          {fechaLong} — {(appt.hora_inicio as string).slice(0, 5)} h
          {svc && ` · ${svc.duracion_minutos} min`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Client info */}
        <div className="bg-white rounded-2xl border border-ink/8 p-5">
          <h2 className="font-serif text-sm text-ink mb-3">Datos del cliente</h2>
          <div className="flex flex-col gap-2 text-sm">
            <Row label="Email">
              <a href={`mailto:${appt.email_cliente}`} className="text-purple-2 hover:underline">
                {appt.email_cliente as string}
              </a>
            </Row>
            <Row label="Teléfono">{appt.telefono_cliente as string}</Row>
            {svc?.precio_mxn != null && (
              <Row label="Precio sesión">
                ${svc.precio_mxn.toLocaleString("es-MX")} MXN
              </Row>
            )}
          </div>
        </div>

        {/* Motivo */}
        <div className="bg-white rounded-2xl border border-ink/8 p-5">
          <h2 className="font-serif text-sm text-ink mb-3">Motivo de consulta</h2>
          {appt.motivo_consulta ? (
            <p className="text-sm text-ink/70 italic leading-relaxed">
              "{appt.motivo_consulta as string}"
            </p>
          ) : (
            <p className="text-sm text-ink/35">No especificado.</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-ink/8 p-5 mb-6">
        <h2 className="font-serif text-sm text-ink mb-3">
          Notas internas{" "}
          <span className="text-xs font-sans text-ink/35 font-normal">(solo visible aquí)</span>
        </h2>
        <form action={saveNotes} className="flex flex-col gap-3">
          <textarea
            name="notas"
            defaultValue={(appt.notas_internas as string | null) ?? ""}
            rows={5}
            placeholder="Observaciones de la sesión, seguimiento, próximos pasos…"
            className="w-full rounded-xl border border-ink/12 bg-lavender px-4 py-3 text-sm text-ink placeholder-ink/30 resize-none focus:outline-none focus:border-purple-3"
          />
          <button
            type="submit"
            className="self-end rounded-full bg-purple-1 px-5 py-2 text-xs font-medium text-white hover:bg-purple-2 transition-colors"
          >
            Guardar notas
          </button>
        </form>
      </div>

      {/* Actions */}
      {(estado === "pending" ||
        estado === "confirmed") && (
        <div className="bg-white rounded-2xl border border-ink/8 p-5">
          <h2 className="font-serif text-sm text-ink mb-3">Cambiar estado</h2>
          <div className="flex flex-wrap gap-2">
            {estado === "pending" && (
              <form action={doConfirm}>
                <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                  Confirmar
                </button>
              </form>
            )}
            <form action={doComplete}>
              <button type="submit" className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                Marcar como completada
              </button>
            </form>
            <form action={doNoShow}>
              <button type="submit" className="rounded-full border border-orange-300 px-4 py-2 text-xs font-medium text-orange-600 hover:bg-orange-50 transition-colors">
                No asistió
              </button>
            </form>
            <form action={doCancel}>
              <button type="submit" className="rounded-full border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                Cancelar cita
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-ink/40 shrink-0 w-24">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  );
}
