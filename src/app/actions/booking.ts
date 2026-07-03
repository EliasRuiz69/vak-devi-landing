"use server";

import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { therapistEmailHtml, userConfirmationHtml } from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export type BookingState = {
  success: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
};

export async function submitBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const raw = {
    nombre: (formData.get("nombre") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    telefono: (formData.get("telefono") as string)?.trim() ?? "",
    servicio: (formData.get("servicio") as string)?.trim() ?? "",
    mensaje: (formData.get("mensaje") as string)?.trim() ?? "",
    disponibilidad: (formData.get("disponibilidad") as string)?.trim() ?? "",
  };

  const fieldErrors: Record<string, string> = {};
  if (!raw.nombre) fieldErrors.nombre = "Tu nombre es requerido.";
  if (!raw.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email))
    fieldErrors.email = "Introduce un email válido.";
  if (!raw.telefono) fieldErrors.telefono = "Tu teléfono es requerido.";
  if (!raw.servicio) fieldErrors.servicio = "Selecciona un servicio.";
  if (!raw.disponibilidad)
    fieldErrors.disponibilidad = "Indica tu disponibilidad horaria.";

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: null, fieldErrors };
  }

  const { error: dbError } = await supabase.from("bookings").insert({
    nombre: raw.nombre,
    email: raw.email,
    telefono: raw.telefono,
    servicio: raw.servicio,
    mensaje: raw.mensaje,
    disponibilidad: raw.disponibilidad,
  });

  if (dbError) {
    console.error("Supabase insert error:", dbError);
    return {
      success: false,
      error: "Hubo un problema al guardar tu solicitud. Por favor intenta de nuevo.",
    };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const therapistEmail = process.env.THERAPIST_EMAIL!;

  const emailResults = await Promise.allSettled([
    resend.emails.send({
      from,
      to: therapistEmail,
      subject: `Nueva solicitud de sesión — ${raw.nombre}`,
      html: therapistEmailHtml(raw),
    }),
    resend.emails.send({
      from,
      to: raw.email,
      subject: "Hemos recibido tu solicitud — Vak Devi",
      html: userConfirmationHtml(raw),
    }),
  ]);
  for (const r of emailResults) {
    if (r.status === "rejected") console.error("[Resend] email error:", r.reason);
    else if (r.value.error) console.error("[Resend] API error:", r.value.error);
  }

  return { success: true, error: null };
}
