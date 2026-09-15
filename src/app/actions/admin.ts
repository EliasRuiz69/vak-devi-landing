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

  // Registrar/actualizar al cliente (no bloqueante)
  const { error: clientError } = await admin.from("clients").upsert(
    {
      email: raw.email,
      nombre: raw.nombre,
      telefono: raw.telefono,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (clientError) console.error("[clients] upsert error:", clientError);

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
  imagen_url: string | null;
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

const SERVICE_IMAGE_BUCKET = "servicios";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadServiceImage(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  try {
    await assertAdmin();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { error: "No se recibió ningún archivo." };
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { error: "Formato no permitido. Usa JPG, PNG o WEBP." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: "La imagen no puede superar 5MB." };
    }

    const ext = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : file.type.split("/")[1];
    const fileName = `${crypto.randomUUID()}.${ext}`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from(SERVICE_IMAGE_BUCKET)
      .upload(fileName, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("[storage] uploadServiceImage error:", uploadError);
      return { error: "Error al subir la imagen. Inténtalo de nuevo." };
    }

    const { data } = admin.storage.from(SERVICE_IMAGE_BUCKET).getPublicUrl(fileName);
    return { url: data.publicUrl };
  } catch (err) {
    console.error("[storage] uploadServiceImage error:", err);
    return { error: "Error inesperado al subir la imagen." };
  }
}

// Borrado best-effort de una imagen anterior — nunca bloquea el flujo del
// formulario. Cualquier fallo (parseo de URL o error de Storage) solo se
// reporta en consola del servidor.
export async function deleteServiceImage(url: string): Promise<void> {
  try {
    await assertAdmin();
    const marker = `/storage/v1/object/public/${SERVICE_IMAGE_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) {
      console.error("[storage] deleteServiceImage: no se pudo extraer la ruta de", url);
      return;
    }
    const path = url.slice(idx + marker.length);
    if (!path) return;

    const { error } = await createAdminClient().storage.from(SERVICE_IMAGE_BUCKET).remove([path]);
    if (error) console.error("[storage] deleteServiceImage error:", error);
  } catch (err) {
    console.error("[storage] deleteServiceImage error:", err);
  }
}

export async function toggleServiceActive(id: string, activo: boolean): Promise<void> {
  await assertAdmin();
  await createAdminClient().from("services").update({ activo }).eq("id", id);
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/agendar");
}

export async function reorderServices(
  updates: { id: string; orden: number }[],
): Promise<ServiceFormState> {
  await assertAdmin();
  const admin = createAdminClient();
  const results = await Promise.all(
    updates.map(({ id, orden }) =>
      admin.from("services").update({ orden }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message, success: false };
  revalidatePath("/admin/servicios");
  revalidatePath("/agendar");
  return { error: null, success: true };
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

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const HORA_RE = /^\d{2}:\d{2}$/;

export async function addBlockedDateRange(
  fechaInicio: string,
  fechaFin: string,
  motivo: string,
): Promise<ServiceFormState> {
  await assertAdmin();
  if (!FECHA_RE.test(fechaInicio) || !FECHA_RE.test(fechaFin)) {
    return { error: "Fecha inválida.", success: false };
  }
  if (fechaInicio > fechaFin) {
    return { error: "La fecha de inicio debe ser anterior o igual a la de fin.", success: false };
  }
  const { error } = await createAdminClient().from("blocked_dates").insert({
    fecha: fechaInicio,
    fecha_fin: fechaFin,
    motivo: motivo.trim() || null,
  });
  if (error) return { error: error.message, success: false };
  revalidatePath("/admin", "layout");
  revalidatePath("/agendar");
  return { error: null, success: true };
}

export async function addBlockedTimeRange(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  motivo: string,
): Promise<ServiceFormState> {
  await assertAdmin();
  if (!FECHA_RE.test(fecha)) return { error: "Fecha inválida.", success: false };
  if (!HORA_RE.test(horaInicio) || !HORA_RE.test(horaFin)) {
    return { error: "Horario inválido.", success: false };
  }
  if (horaInicio >= horaFin) {
    return { error: "La hora de inicio debe ser anterior a la de fin.", success: false };
  }
  const { error } = await createAdminClient().from("blocked_dates").insert({
    fecha,
    fecha_fin: fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    motivo: motivo.trim() || null,
  });
  if (error) return { error: error.message, success: false };
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

// ── Eliminar citas y clientes ────────────────────────────────────

export async function deleteAppointment(id: string): Promise<void> {
  await assertAdmin();
  await createAdminClient().from("appointments").delete().eq("id", id);
  revalidatePath("/admin", "layout");
}

// Elimina solo el registro de contacto del cliente (tabla "clients").
// Su historial de citas en "appointments" NO se toca — permanece intacto.
export async function deleteClient(email: string): Promise<void> {
  await assertAdmin();
  await createAdminClient().from("clients").delete().eq("email", email);
  revalidatePath("/admin", "layout");
}

// ── CRUD Clientes (CRM) ──────────────────────────────────────────

export type ClientFormState = { error: string | null; success: boolean };

export type ClientData = { nombre: string; email: string; telefono: string; notas: string };

export async function createClient(data: ClientData): Promise<ClientFormState> {
  await assertAdmin();
  const { error } = await createAdminClient().from("clients").insert({
    email: data.email,
    nombre: data.nombre,
    telefono: data.telefono || null,
    notas: data.notas.trim() || null,
  });
  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe un cliente con ese email." : error.message,
      success: false,
    };
  }
  revalidatePath("/admin", "layout");
  return { error: null, success: true };
}

export async function updateClient(
  email: string,
  data: Omit<ClientData, "email">,
): Promise<ClientFormState> {
  await assertAdmin();
  const { error } = await createAdminClient()
    .from("clients")
    .update({
      nombre: data.nombre,
      telefono: data.telefono || null,
      notas: data.notas.trim() || null,
      actualizado_en: new Date().toISOString(),
    })
    .eq("email", email);
  if (error) return { error: error.message, success: false };
  revalidatePath("/admin", "layout");
  return { error: null, success: true };
}
