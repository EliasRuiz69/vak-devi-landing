"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { createAuthClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { addMinutes } from "@/lib/schedule-utils";

async function assertAdmin() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

// ── Estado de citas ─────────────────────────────────────────────

export async function confirmAppointment(id: string): Promise<void> {
  await assertAdmin();
  await createAdminClient().from("appointments").update({ estado: "confirmed" }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function completeAppointment(id: string): Promise<void> {
  await assertAdmin();
  await createAdminClient().from("appointments").update({ estado: "completed" }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function cancelAppointment(id: string): Promise<void> {
  await assertAdmin();
  await createAdminClient().from("appointments").update({ estado: "cancelled" }).eq("id", id);
  revalidatePath("/admin", "layout");
}

export async function markNoShow(id: string): Promise<void> {
  await assertAdmin();
  await createAdminClient().from("appointments").update({ estado: "no_show" }).eq("id", id);
  revalidatePath("/admin", "layout");
}

// ── Notas internas de cita ──────────────────────────────────────

export async function updateAppointmentNotes(id: string, formData: FormData): Promise<void> {
  await assertAdmin();
  const notas = ((formData.get("notas") as string) ?? "").trim();
  await createAdminClient().from("appointments").update({ notas_internas: notas || null }).eq("id", id);
  revalidatePath("/admin", "layout");
}

// ── Crear cita manual ───────────────────────────────────────────

export type ManualApptState = {
  success: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
};

export async function createManualAppointment(
  _prev: ManualApptState,
  formData: FormData,
): Promise<ManualApptState> {
  await assertAdmin();
  const raw = {
    serviceId: ((formData.get("serviceId") as string) ?? "").trim(),
    fecha: ((formData.get("fecha") as string) ?? "").trim(),
    hora: ((formData.get("hora") as string) ?? "").trim(),
    nombre: ((formData.get("nombre") as string) ?? "").trim(),
    email: ((formData.get("email") as string) ?? "").trim(),
    telefono: ((formData.get("telefono") as string) ?? "").trim(),
    motivo: ((formData.get("motivo") as string) ?? "").trim(),
  };
  const fe: Record<string, string> = {};
  if (!raw.serviceId) fe.serviceId = "Selecciona un servicio.";
  if (!raw.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(raw.fecha)) fe.fecha = "Fecha inválida.";
  if (!raw.hora || !/^\d{2}:\d{2}$/.test(raw.hora)) fe.hora = "Horario inválido (HH:MM).";
  if (!raw.nombre) fe.nombre = "Nombre requerido.";
  if (!raw.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.email)) fe.email = "Email inválido.";
  if (!raw.telefono) fe.telefono = "Teléfono requerido.";
  if (Object.keys(fe).length) return { success: false, error: null, fieldErrors: fe };

  const admin = createAdminClient();
  const { data: service } = await admin
    .from("services")
    .select("nombre, duracion_minutos")
    .eq("id", raw.serviceId)
    .single();
  if (!service) return { success: false, error: "Servicio no encontrado." };

  const horaFin = addMinutes(raw.hora, service.duracion_minutos as number);
  const { error } = await admin.from("appointments").insert({
    service_id: raw.serviceId,
    fecha: raw.fecha,
    hora_inicio: raw.hora,
    hora_fin: horaFin,
    nombre_cliente: raw.nombre,
    email_cliente: raw.email,
    telefono_cliente: raw.telefono,
    motivo_consulta: raw.motivo || null,
    estado: "confirmed",
  });
  if (error) return { success: false, error: "Error al guardar. Inténtalo de nuevo." };
  revalidatePath("/admin", "layout");
  return { success: true, error: null };
}

// ── CRUD Servicios ──────────────────────────────────────────────

export type ServiceFormState = { error: string | null; success: boolean };

export type ServiceData = {
  nombre: string;
  descripcion: string;
  duracion_minutos: number;
  precio_mxn: number | null;
  es_premium: boolean;
  activo: boolean;
  orden: number;
};

export async function updateService(id: string, data: ServiceData): Promise<ServiceFormState> {
  await assertAdmin();
  const { error } = await createAdminClient().from("services").update(data).eq("id", id);
  if (error) return { error: error.message, success: false };
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/agendar");
  return { error: null, success: true };
}

export async function createService(
  data: Omit<ServiceData, "activo">,
): Promise<ServiceFormState> {
  await assertAdmin();
  const { error } = await createAdminClient().from("services").insert({ ...data, activo: true });
  if (error) return { error: error.message, success: false };
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/agendar");
  return { error: null, success: true };
}

export async function toggleServiceActive(id: string, activo: boolean): Promise<void> {
  await assertAdmin();
  await createAdminClient().from("services").update({ activo }).eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/agendar");
}

// ── Configuración de horario ────────────────────────────────────

export type ScheduleData = {
  dias_laborables: number[];
  hora_inicio: string;
  hora_fin: string;
  duracion_bloque_minutos: number;
};

export async function updateScheduleConfig(id: string, data: ScheduleData): Promise<ServiceFormState> {
  await assertAdmin();
  const { error } = await createAdminClient()
    .from("schedule_config")
    .update({ ...data, actualizado_en: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message, success: false };
  revalidatePath("/admin", "layout");
  revalidatePath("/agendar");
  return { error: null, success: true };
}

// ── Días bloqueados ─────────────────────────────────────────────

export async function addBlockedDate(fecha: string, motivo: string): Promise<ServiceFormState> {
  await assertAdmin();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Fecha inválida.", success: false };
  const { error } = await createAdminClient()
    .from("blocked_dates")
    .insert({ fecha, motivo: motivo.trim() || null });
  if (error) {
    return {
      error: error.code === "23505" ? "Esa fecha ya está bloqueada." : error.message,
      success: false,
    };
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/agendar");
  return { error: null, success: true };
}

export async function removeBlockedDate(id: string): Promise<void> {
  await assertAdmin();
  await createAdminClient().from("blocked_dates").delete().eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/agendar");
}

// ── Notas de clientes (CRM) ─────────────────────────────────────

export async function upsertClientNotes(
  email: string,
  nombre: string,
  notas: string,
): Promise<void> {
  await assertAdmin();
  await createAdminClient()
    .from("client_notes")
    .upsert(
      { email_cliente: email, nombre_cliente: nombre, notas: notas.trim() || null, actualizado_en: new Date().toISOString() },
      { onConflict: "email_cliente" },
    );
  revalidatePath("/admin", "layout");
}
