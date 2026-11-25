import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getAvailableSlots } from "@/lib/availability";
import { saveAppointment } from "@/lib/booking";
import { getTodayMerida } from "@/lib/admin-utils";
import { formatFechaLong } from "@/lib/schedule-utils";
import {
  FECHA_RE,
  HORA_RE,
  UUID_RE,
  badRequest,
  isAgentAuthorized,
  readJson,
  unauthorized,
} from "@/lib/agent-auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Reserva una cita desde el agente de WhatsApp.
// Body: { serviceId, fecha, hora, nombre, email, telefono }
// - telefono lo pone n8n a partir del chat de WhatsApp, nunca el modelo.
// - No se guarda motivo de consulta (minimización de datos de salud).
// - Vuelve a comprobar el hueco con getAvailableSlots() justo antes de
//   guardar; si ya no está libre responde 409 con alternativas del mismo día.
export async function POST(req: Request) {
  if (!isAgentAuthorized(req)) return unauthorized();

  const body = await readJson(req);
  if (!body) return badRequest("json_invalido");

  const serviceId = String(body.serviceId ?? "");
  const fecha = String(body.fecha ?? "");
  const hora = String(body.hora ?? "");
  const nombre = String(body.nombre ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const telefono = String(body.telefono ?? "").replace(/\D/g, "");

  if (!UUID_RE.test(serviceId)) return badRequest("serviceId_invalido");
  if (!FECHA_RE.test(fecha)) return badRequest("fecha_invalida");
  if (!HORA_RE.test(hora)) return badRequest("hora_invalida");
  if (nombre.length < 2 || nombre.length > 100) return badRequest("nombre_invalido");
  if (!EMAIL_RE.test(email) || email.length > 200) return badRequest("email_invalido");
  if (telefono.length < 10 || telefono.length > 15) return badRequest("telefono_invalido");
  if (fecha < getTodayMerida()) return badRequest("fecha_pasada");

  const admin = createAdminClient();

  const { data: service } = await admin
    .from("services")
    .select("id, nombre, duracion_minutos")
    .eq("id", serviceId)
    .eq("activo", true)
    .single();
  if (!service) {
    return NextResponse.json({ ok: false, error: "servicio_no_encontrado" }, { status: 404 });
  }

  const disponibilidad = await getAvailableSlots(admin, serviceId, fecha);
  if (!disponibilidad.ok) {
    return NextResponse.json({ ok: false, error: "servicio_no_encontrado" }, { status: 404 });
  }
  if (!disponibilidad.slots.includes(hora)) {
    return NextResponse.json(
      {
        ok: false,
        error: "horario_no_disponible",
        alternativas_mismo_dia: disponibilidad.slots.slice(0, 3),
      },
      { status: 409 },
    );
  }

  const saved = await saveAppointment(admin, {
    service: {
      id: service.id as string,
      nombre: service.nombre as string,
      duracion_minutos: service.duracion_minutos as number,
    },
    fecha,
    hora,
    nombre,
    email,
    telefono,
    origen: "whatsapp",
    notify: true,
  });

  if (!saved.ok) {
    return NextResponse.json({ ok: false, error: "no_se_pudo_guardar" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    cita: {
      servicio: service.nombre,
      fecha,
      fecha_texto: formatFechaLong(fecha),
      hora,
      duracion_minutos: service.duracion_minutos,
      email_confirmacion: email,
    },
  });
}
