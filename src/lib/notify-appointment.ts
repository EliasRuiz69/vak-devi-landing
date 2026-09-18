import { Resend } from "resend";
import {
  appointmentNotificationHtml,
  appointmentConfirmationHtml,
} from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

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
