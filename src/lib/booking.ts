import type { SupabaseClient } from "@supabase/supabase-js";
import { addMinutes, formatFechaLong } from "@/lib/schedule-utils";
import { sendAppointmentEmails } from "@/lib/notify-appointment";

// Canal por el que entra la cita (columna appointments.origen, migración 008).
export type OrigenCita = "web" | "admin" | "whatsapp";

export type SaveAppointmentInput = {
  service: { id: string; nombre: string; duracion_minutos: number };
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  nombre: string;
  email: string;
  telefono: string;
  motivo?: string | null;
  estado?: "pending" | "confirmed";
  origen: OrigenCita;
  // false = no enviar los emails de confirmación (p. ej. alta manual de una
  // sesión ya pasada).
  notify: boolean;
};

// Guarda una cita, registra/actualiza al cliente y envía los emails.
// Punto único de escritura de citas para /agendar (schedule.ts), el alta
// manual (admin.ts) y la API del agente de WhatsApp. No comprueba la
// disponibilidad: eso lo hace cada llamador antes, porque cada flujo tiene
// sus propias reglas (p. ej. el alta manual admite fechas pasadas).
export async function saveAppointment(
  admin: SupabaseClient,
  input: SaveAppointmentInput,
): Promise<{ ok: true } | { ok: false }> {
  const horaFin = addMinutes(input.hora, input.service.duracion_minutos);

  const { error: dbError } = await admin.from("appointments").insert({
    service_id: input.service.id,
    fecha: input.fecha,
    hora_inicio: input.hora,
    hora_fin: horaFin,
    nombre_cliente: input.nombre,
    email_cliente: input.email,
    telefono_cliente: input.telefono,
    motivo_consulta: input.motivo || null,
    estado: input.estado ?? "pending",
    origen: input.origen,
  });

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return { ok: false };
  }

  // Registrar/actualizar al cliente (no bloqueante — un fallo aquí
  // nunca debe impedir confirmar una cita ya guardada correctamente)
  const { error: clientError } = await admin.from("clients").upsert(
    {
      email: input.email,
      nombre: input.nombre,
      telefono: input.telefono,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (clientError) console.error("[clients] upsert error:", clientError);

  // Emails (no bloqueantes — no fallan la reserva si el envío falla)
  if (input.notify) {
    await sendAppointmentEmails({
      nombre: input.nombre,
      email: input.email,
      telefono: input.telefono,
      servicio: input.service.nombre,
      duracion: input.service.duracion_minutos,
      fechaLong: formatFechaLong(input.fecha),
      hora: input.hora,
      motivo: input.motivo ?? undefined,
      origen: input.origen,
    });
  }

  return { ok: true };
}
