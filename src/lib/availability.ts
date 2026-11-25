import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateCandidateSlots,
  isWorkingDay,
  parseTimeMins,
  slotsOverlap,
} from "@/lib/schedule-utils";
import { getTodayMerida } from "@/lib/admin-utils";

export type SlotsResult =
  | { ok: true; slots: string[]; duracionMinutos: number }
  | { ok: false; reason: "not_found" };

// Huecos libres de un servicio en una fecha (YYYY-MM-DD). Fuente única del
// cálculo: la usan /api/slots (calendario de /agendar) y la API del agente
// de WhatsApp (/api/agente/*), para que ambos canales vean y respeten la
// misma disponibilidad: días laborables y horario de schedule_config,
// bloqueos de día completo y de horas (blocked_dates), citas pending y
// confirmed, y el margen de 2 h sobre la hora actual de Mérida si la fecha
// es hoy (salvo skipAdvance).
export async function getAvailableSlots(
  admin: SupabaseClient,
  serviceId: string,
  fecha: string,
  { skipAdvance = false }: { skipAdvance?: boolean } = {},
): Promise<SlotsResult> {
  const [{ data: service }, { data: config }] = await Promise.all([
    admin.from("services").select("duracion_minutos").eq("id", serviceId).single(),
    admin.from("schedule_config").select("*").eq("activo", true).single(),
  ]);

  if (!service || !config) {
    return { ok: false, reason: "not_found" };
  }
  const duracion = service.duracion_minutos as number;

  // Check working day
  const [y, mo, d] = fecha.split("-").map(Number);
  const dateObj = new Date(y, mo - 1, d);
  if (!isWorkingDay(dateObj, config.dias_laborables as number[])) {
    return { ok: true, slots: [], duracionMinutos: duracion };
  }

  // Check blocked_dates — bloqueo de día(s) completo(s) (hora_inicio nulo)
  // que cubra esta fecha dentro de su rango [fecha, fecha_fin].
  const { count: blockedCount } = await admin
    .from("blocked_dates")
    .select("id", { count: "exact", head: true })
    .is("hora_inicio", null)
    .lte("fecha", fecha)
    .gte("fecha_fin", fecha);
  if ((blockedCount ?? 0) > 0) {
    return { ok: true, slots: [], duracionMinutos: duracion };
  }

  const candidates = generateCandidateSlots(
    config.hora_inicio as string,
    config.hora_fin as string,
    config.duracion_bloque_minutos as number,
    duracion,
  );

  const [{ data: appts }, { data: blockedTimes }] = await Promise.all([
    admin
      .from("appointments")
      .select("hora_inicio, hora_fin")
      .eq("fecha", fecha)
      .in("estado", ["pending", "confirmed"]),
    admin
      .from("blocked_dates")
      .select("hora_inicio, hora_fin")
      .eq("fecha", fecha)
      .not("hora_inicio", "is", null),
  ]);

  const bookedRanges = [
    ...(appts ?? []).map((a) => ({
      start: parseTimeMins((a.hora_inicio as string).slice(0, 5)),
      end: parseTimeMins((a.hora_fin as string).slice(0, 5)),
    })),
    ...(blockedTimes ?? []).map((b) => ({
      start: parseTimeMins((b.hora_inicio as string).slice(0, 5)),
      end: parseTimeMins((b.hora_fin as string).slice(0, 5)),
    })),
  ];

  // "Hoy" en Mérida, no en la zona del servidor (el contenedor corre en UTC:
  // a partir de las 18:00 de Mérida su fecha ya es la de mañana).
  const isToday = fecha === getTodayMerida();

  let nowMins = 0;
  if (isToday && !skipAdvance) {
    const meridaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Merida" }));
    nowMins = meridaNow.getHours() * 60 + meridaNow.getMinutes() + 120;
  }

  const available = candidates.filter((slot) => {
    const slotMins = parseTimeMins(slot);
    if (isToday && !skipAdvance && slotMins < nowMins) return false;
    return !bookedRanges.some((r) => slotsOverlap(slotMins, duracion, r.start, r.end));
  });

  return { ok: true, slots: available, duracionMinutos: duracion };
}
