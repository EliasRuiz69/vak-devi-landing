import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  generateCandidateSlots,
  isWorkingDay,
  parseTimeMins,
  slotsOverlap,
} from "@/lib/schedule-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const serviceId = searchParams.get("serviceId");
  const fecha = searchParams.get("fecha");
  const skipAdvance = searchParams.get("skipAdvance") === "1";

  if (!serviceId || !fecha) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: service }, { data: config }] = await Promise.all([
    admin.from("services").select("duracion_minutos").eq("id", serviceId).single(),
    admin.from("schedule_config").select("*").eq("activo", true).single(),
  ]);

  if (!service || !config) {
    return NextResponse.json({ error: "Service or config not found" }, { status: 404 });
  }

  // Check working day
  const [y, mo, d] = fecha.split("-").map(Number);
  const dateObj = new Date(y, mo - 1, d);
  if (!isWorkingDay(dateObj, config.dias_laborables as number[])) {
    return NextResponse.json({ slots: [] });
  }

  // Check blocked_dates
  const { count: blockedCount } = await admin
    .from("blocked_dates")
    .select("id", { count: "exact", head: true })
    .eq("fecha", fecha);
  if ((blockedCount ?? 0) > 0) {
    return NextResponse.json({ slots: [] });
  }

  const candidates = generateCandidateSlots(
    config.hora_inicio as string,
    config.hora_fin as string,
    config.duracion_bloque_minutos as number,
    service.duracion_minutos as number,
  );

  const { data: appts } = await admin
    .from("appointments")
    .select("hora_inicio, hora_fin")
    .eq("fecha", fecha)
    .in("estado", ["pending", "confirmed"]);

  const bookedRanges = (appts ?? []).map((a) => ({
    start: parseTimeMins((a.hora_inicio as string).slice(0, 5)),
    end: parseTimeMins((a.hora_fin as string).slice(0, 5)),
  }));

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isToday = fecha === todayIso;

  let nowMins = 0;
  if (isToday && !skipAdvance) {
    const meridaNow = new Date(today.toLocaleString("en-US", { timeZone: "America/Merida" }));
    nowMins = meridaNow.getHours() * 60 + meridaNow.getMinutes() + 120;
  }

  const available = candidates.filter((slot) => {
    const slotMins = parseTimeMins(slot);
    if (isToday && !skipAdvance && slotMins < nowMins) return false;
    return !bookedRanges.some((r) =>
      slotsOverlap(slotMins, service.duracion_minutos as number, r.start, r.end),
    );
  });

  return NextResponse.json({ slots: available });
}
