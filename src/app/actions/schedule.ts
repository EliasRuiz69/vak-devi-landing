"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { Resend } from "resend";
import {
  addMinutes,
  formatFechaLong,
  generateCandidateSlots,
  parseTimeMins,
  slotsOverlap,
} from "@/lib/schedule-utils";
import {
  appointmentNotificationHtml,
  appointmentConfirmationHtml,
} from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export type AppointmentState = {
  success: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
  appointmentData?: {
    serviceName: string;
    fecha: string;
    hora: string;
    nombre: string;
    email: string;
  };
};

export async function createAppointment(
  _prev: AppointmentState,
  formData: FormData,
): Promise<AppointmentState> {
  const raw = {
    serviceId: (formData.get("serviceId") as string)?.trim() ?? "",
    fecha: (formData.get("fecha") as string)?.trim() ?? "",
    hora: (formData.get("hora") as string)?.trim() ?? "",
    nombre: (formData.get("nombre") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    telefono: (formData.get("telefono") as string)?.trim() ?? "",
    motivo: (formData.get("motivo") as string)?.trim() ?? "",
  };

  // Field validation
  const fieldErrors: Record<string, string> = {};
  if (!raw.serviceId) fieldErrors.serviceId = "Selecciona un servicio.";
  if (!raw.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(raw.fecha))
    fieldErrors.fecha = "Selecciona una fecha válida.";
  if (!raw.hora || !/^\d{2}:\d{2}$/.test(raw.hora))
    fieldErrors.hora = "Selecciona un horario.";
  if (!raw.nombre) fieldErrors.nombre = "Tu nombre es requerido.";
  if (!raw.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email))
    fieldErrors.email = "Introduce un email válido.";
  if (!raw.telefono) fieldErrors.telefono = "Tu teléfono es requerido.";

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: null, fieldErrors };
  }

  const admin = createAdminClient();

  // Fetch service + schedule config
  const [{ data: service }, { data: config }] = await Promise.all([
    admin
      .from("services")
      .select("id, nombre, duracion_minutos")
      .eq("id", raw.serviceId)
      .eq("activo", true)
      .single(),
    admin.from("schedule_config").select("*").eq("activo", true).single(),
  ]);

  if (!service) {
    return { success: false, error: "El servicio seleccionado no está disponible." };
  }
  if (!config) {
    return { success: false, error: "Error de configuración. Intenta más tarde." };
  }

  // Race-condition guard: re-check slot availability
  const candidates = generateCandidateSlots(
    config.hora_inicio as string,
    config.hora_fin as string,
    config.duracion_bloque_minutos as number,
    service.duracion_minutos as number,
  );

  if (!candidates.includes(raw.hora)) {
    return {
      success: false,
      error: "El horario seleccionado no es válido para este servicio.",
    };
  }

  const { data: appts } = await admin
    .from("appointments")
    .select("hora_inicio, hora_fin")
    .eq("fecha", raw.fecha)
    .neq("estado", "cancelled");

  const slotMins = parseTimeMins(raw.hora);
  const blocked = (appts ?? []).some((a) =>
    slotsOverlap(
      slotMins,
      service.duracion_minutos as number,
      parseTimeMins((a.hora_inicio as string).slice(0, 5)),
      parseTimeMins((a.hora_fin as string).slice(0, 5)),
    ),
  );

  if (blocked) {
    return {
      success: false,
      error:
        "Ese horario acaba de ser reservado. Por favor selecciona otra fecha u horario.",
    };
  }

  // Compute hora_fin
  const horaFin = addMinutes(raw.hora, service.duracion_minutos as number);

  // Insert appointment (admin client so it bypasses RLS cleanly)
  const { error: dbError } = await admin.from("appointments").insert({
    service_id: raw.serviceId,
    fecha: raw.fecha,
    hora_inicio: raw.hora,
    hora_fin: horaFin,
    nombre_cliente: raw.nombre,
    email_cliente: raw.email,
    telefono_cliente: raw.telefono,
    motivo_consulta: raw.motivo || null,
    estado: "pending",
  });

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return {
      success: false,
      error: "No pudimos guardar tu cita. Por favor intenta de nuevo.",
    };
  }

  // Send emails (non-blocking — don't fail the booking if email fails)
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const therapistEmail = process.env.THERAPIST_EMAIL!;
  const fechaLong = formatFechaLong(raw.fecha);

  const emailResults = await Promise.allSettled([
    resend.emails.send({
      from,
      to: therapistEmail,
      subject: `Nueva cita — ${raw.nombre} — ${fechaLong}`,
      html: appointmentNotificationHtml({
        nombre: raw.nombre,
        email: raw.email,
        telefono: raw.telefono,
        servicio: service.nombre as string,
        fecha: fechaLong,
        hora: raw.hora,
        duracion: service.duracion_minutos as number,
        motivo: raw.motivo,
      }),
    }),
    resend.emails.send({
      from,
      to: raw.email,
      subject: "Tu cita ha sido reservada — Vak Devi",
      html: appointmentConfirmationHtml({
        nombre: raw.nombre,
        servicio: service.nombre as string,
        fecha: fechaLong,
        hora: raw.hora,
        duracion: service.duracion_minutos as number,
      }),
    }),
  ]);
  for (const r of emailResults) {
    if (r.status === "rejected") console.error("[Resend] email error:", r.reason);
    else if (r.value.error) console.error("[Resend] API error:", r.value.error);
  }

  return {
    success: true,
    error: null,
    appointmentData: {
      serviceName: service.nombre as string,
      fecha: fechaLong,
      hora: raw.hora,
      nombre: raw.nombre,
      email: raw.email,
    },
  };
}
