import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getAvailableSlots } from "@/lib/availability";
import { getTodayMerida, addDays } from "@/lib/admin-utils";
import { formatFechaLong } from "@/lib/schedule-utils";
import {
  FECHA_RE,
  UUID_RE,
  badRequest,
  isAgentAuthorized,
  readJson,
  unauthorized,
} from "@/lib/agent-auth";

const MAX_DIAS = 14;

// Huecos libres de un servicio desde una fecha, para el agente de WhatsApp.
// Body: { serviceId, desde?: "YYYY-MM-DD" (por defecto hoy en Mérida), dias?: 1–14 (por defecto 7) }
// Usa getAvailableSlots(), la misma lógica que el calendario de /agendar.
// Devuelve la fecha ya escrita en español (fecha_texto) para que el modelo
// no tenga que calcular días de la semana.
export async function POST(req: Request) {
  if (!isAgentAuthorized(req)) return unauthorized();

  const body = await readJson(req);
  if (!body) return badRequest("json_invalido");

  const serviceId = String(body.serviceId ?? "");
  if (!UUID_RE.test(serviceId)) return badRequest("serviceId_invalido");

  const hoy = getTodayMerida();
  let desde = body.desde ? String(body.desde) : hoy;
  if (!FECHA_RE.test(desde)) return badRequest("desde_invalido");
  if (desde < hoy) desde = hoy;

  const diasRaw = Number(body.dias ?? 7);
  const dias = Number.isInteger(diasRaw) ? Math.min(Math.max(diasRaw, 1), MAX_DIAS) : 7;

  const admin = createAdminClient();
  const resultado: { fecha: string; fecha_texto: string; horas: string[] }[] = [];

  for (let i = 0; i < dias; i++) {
    const fecha = addDays(desde, i);
    const r = await getAvailableSlots(admin, serviceId, fecha);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: "servicio_no_encontrado" }, { status: 404 });
    }
    if (r.slots.length > 0) {
      resultado.push({ fecha, fecha_texto: formatFechaLong(fecha), horas: r.slots });
    }
  }

  return NextResponse.json({
    ok: true,
    zona_horaria: "America/Merida",
    desde,
    hasta: addDays(desde, dias - 1),
    dias_con_horarios: resultado,
  });
}
