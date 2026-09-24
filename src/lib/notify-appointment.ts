import { Resend } from "resend";
import {
  appointmentNotificationHtml,
  appointmentConfirmationHtml,
} from "@/lib/email-templates";

export type AppointmentEmailData = {
  nombre: string;
  email: string;
  telefono: string;
  servicio: string;
  duracion: number;
  fechaLong: string;
  hora: string;
  motivo?: string;
};

// Movido tal cual desde createAppointment (schedule.ts) — notificación a la
// terapeuta + confirmación al cliente, best effort (Promise.allSettled),
// nunca bloqueante. Mismo wording, asunto y remitente que el flujo público.
export async function sendAppointmentEmails(data: AppointmentEmailData): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const therapistEmail = process.env.THERAPIST_EMAIL!;

  // Se crea aquí, no a nivel de módulo: RESEND_API_KEY solo existe en runtime
  // y `new Resend()` lanza si falta, lo que rompía `next build` en Docker.
  let resend: Resend;
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
  } catch (err) {
    console.error("[Resend] email error:", err);
    return;
  }

  const emailResults = await Promise.allSettled([
    resend.emails.send({
      from,
      to: therapistEmail,
      subject: `Nueva cita — ${data.nombre} — ${data.fechaLong}`,
      html: appointmentNotificationHtml({
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        servicio: data.servicio,
        fecha: data.fechaLong,
        hora: data.hora,
        duracion: data.duracion,
        motivo: data.motivo,
      }),
    }),
    resend.emails.send({
      from,
      to: data.email,
      subject: "Tu cita ha sido reservada — Vak Devi",
      html: appointmentConfirmationHtml({
        nombre: data.nombre,
        servicio: data.servicio,
        fecha: data.fechaLong,
        hora: data.hora,
        duracion: data.duracion,
      }),
    }),
  ]);
  for (const r of emailResults) {
    if (r.status === "rejected") console.error("[Resend] email error:", r.reason);
    else if (r.value.error) console.error("[Resend] API error:", r.value.error);
  }
}
