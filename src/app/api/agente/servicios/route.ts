import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { isAgentAuthorized, unauthorized } from "@/lib/agent-auth";

// Catálogo de servicios activos para el agente de WhatsApp.
// NUNCA devuelve precio_mxn: los precios no se comunican por el chat.
export async function POST(req: Request) {
  if (!isAgentAuthorized(req)) return unauthorized();

  const { data, error } = await createAdminClient()
    .from("services")
    .select("id, nombre, descripcion, duracion_minutos, es_premium, is_promo")
    .eq("activo", true)
    .order("orden");

  if (error) {
    console.error("[agente/servicios]", error);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    servicios: (data ?? []).map((s) => ({
      id: s.id,
      nombre: s.nombre,
      descripcion: s.descripcion,
      duracion_minutos: s.duracion_minutos,
      destacado: s.es_premium,
      promocion: s.is_promo,
    })),
  });
}
