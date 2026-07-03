import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import {
  getTodayMerida,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  subtractDays,
  countWorkingDays,
  formatMXN,
} from "@/lib/admin-utils";
import { parseTimeMins, formatFechaLong } from "@/lib/schedule-utils";
import DashboardCharts from "./DashboardCharts";

export const metadata: Metadata = {
  title: "Dashboard — Vāk Devi",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
  no_show: "bg-red-50 text-red-600",
};

export default async function DashboardPage() {
  const admin = createAdminClient();
  const today = getTodayMerida();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);
  const monthStart = getMonthStart(today);
  const thirtyDaysAgo = subtractDays(today, 29);
  const fourteenDaysAgo = subtractDays(today, 13);

  const [
    { data: completedRaw },
    { data: todayRaw },
    { data: weekRaw },
    { data: config },
  ] = await Promise.all([
    admin
      .from("appointments")
      .select("fecha, hora_inicio, services(nombre, precio_mxn)")
      .eq("estado", "completed")
      .gte("fecha", thirtyDaysAgo)
      .lte("fecha", today),
    admin
      .from("appointments")
      .select("id, estado, nombre_cliente, hora_inicio, services(nombre)")
      .eq("fecha", today)
      .order("hora_inicio"),
    admin
      .from("appointments")
      .select("id, estado")
      .gte("fecha", weekStart)
      .lte("fecha", weekEnd),
    admin.from("schedule_config").select("*").eq("activo", true).single(),
  ]);

  const completed = completedRaw ?? [];
  type SvcField = { nombre: string; precio_mxn: number | null } | null;

  const factMes = completed
    .filter((a) => (a.fecha as string) >= monthStart)
    .reduce((s, a) => s + ((a.services as unknown as SvcField)?.precio_mxn ?? 0), 0);

  const ticketMedio =
    completed.length > 0
      ? completed.reduce((s, a) => s + ((a.services as unknown as SvcField)?.precio_mxn ?? 0), 0) /
        completed.length
      : 0;

  const weekNonCancelled = (weekRaw ?? []).filter((a) => a.estado !== "cancelled");
  const citasHoy = (todayRaw ?? []).filter((a) => a.estado !== "cancelled").length;

  // Occupancy
  let occupancyRate = 0;
  let totalPossible = 0;
  if (config) {
    const slotsPerDay = Math.floor(
      (parseTimeMins((config.hora_fin as string).slice(0, 5)) -
        parseTimeMins((config.hora_inicio as string).slice(0, 5))) /
        (config.duracion_bloque_minutos as number),
    );
    const wDays = countWorkingDays(weekStart, weekEnd, config.dias_laborables as number[]);
    totalPossible = wDays * slotsPerDay;
    occupancyRate =
      totalPossible > 0 ? Math.round((weekNonCancelled.length / totalPossible) * 100) : 0;
  }

  // Top service
  const svcCount = new Map<string, number>();
  for (const a of completed) {
    const n = (a.services as unknown as SvcField)?.nombre ?? "Otro";
    svcCount.set(n, (svcCount.get(n) ?? 0) + 1);
  }
  const topSvc = [...svcCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const topSvcName = topSvc
    ? topSvc[0].split(" ").slice(0, 2).join(" ") + "…"
    : "—";

  // Revenue chart (last 14 days)
  const revMap: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) revMap[subtractDays(today, i)] = 0;
  for (const a of completed) {
    const f = a.fecha as string;
    if (f >= fourteenDaysAgo && f in revMap)
      revMap[f] += (a.services as unknown as SvcField)?.precio_mxn ?? 0;
  }
  const revenueData = Object.entries(revMap).map(([fecha, total]) => {
    const [y, m, d] = fecha.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return {
      fecha,
      label: dt.toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
      total,
    };
  });

  // Service chart
  const svcData = [...svcCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([nombre, count]) => ({ nombre: nombre.split(" ").slice(0, 2).join(" "), count }));

  // Hour chart
  const hourMap = new Map<string, number>();
  for (const a of completed) {
    const h = (a.hora_inicio as string).slice(0, 5);
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
  }
  const hourData = [...hourMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([hora, count]) => ({ hora, count }));

  const upcomingToday = (todayRaw ?? []).filter(
    (a) => a.estado !== "cancelled" && a.estado !== "no_show",
  );

  const [ty, tm] = today.split("-").map(Number);
  const monthLabel = new Date(ty, tm - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <p className="text-xs uppercase tracking-[0.25em] text-purple-3 mb-1">Panel</p>
        <h1 className="font-serif text-3xl text-ink">Dashboard</h1>
        <p className="text-sm text-ink/45 mt-1 capitalize">{formatFechaLong(today)}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Stat label="Citas hoy" value={String(citasHoy)} sub={`${(todayRaw ?? []).filter((a) => a.estado === "completed").length} completadas`} />
        <Stat label="Citas esta semana" value={String(weekNonCancelled.length)} sub={`${weekNonCancelled.filter((a) => a.estado === "pending").length} pendientes`} />
        <Stat label={`Facturación ${monthLabel}`} value={formatMXN(factMes)} sub="sesiones completadas" accent />
        <Stat label="Ticket medio" value={formatMXN(Math.round(ticketMedio))} sub="últimos 30 días" />
        <Stat label="Ocupación semanal" value={`${occupancyRate}%`} sub={`${weekNonCancelled.length} de ${totalPossible} huecos`} />
        <Stat label="Más solicitado" value={topSvcName} sub={topSvc ? `${topSvc[1]} sesiones` : ""} />
      </div>

      {/* Agenda + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Today */}
        <div className="xl:col-span-1 bg-white rounded-2xl border border-ink/8 overflow-hidden">
          <div className="px-5 py-4 border-b border-ink/6 flex items-center justify-between">
            <h2 className="font-serif text-base text-ink">Agenda de hoy</h2>
            <Link href="/admin/citas" className="text-xs text-purple-2 hover:underline">
              Ver todas →
            </Link>
          </div>
          {upcomingToday.length === 0 ? (
            <p className="px-5 py-10 text-sm text-ink/35 text-center">Sin citas hoy.</p>
          ) : (
            <div className="divide-y divide-ink/5">
              {upcomingToday.map((a) => (
                <Link
                  key={a.id as string}
                  href={`/admin/citas/${a.id}`}
                  className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-lavender transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {a.nombre_cliente as string}
                    </p>
                    <p className="text-xs text-ink/45 truncate">
                      {(a.services as unknown as { nombre: string } | null)?.nombre ?? ""}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <p className="text-xs text-ink/55 font-medium">
                      {(a.hora_inicio as string).slice(0, 5)} h
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[a.estado as string]}`}
                    >
                      {STATUS_LABEL[a.estado as string]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="xl:col-span-2 flex flex-col gap-5">
          <DashboardCharts
            revenueData={revenueData}
            serviceData={svcData}
            hourData={hourData}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 lg:p-5 ${accent ? "bg-purple-1 border-purple-1" : "bg-white border-ink/8"}`}
    >
      <p
        className={`text-[10px] uppercase tracking-widest mb-2 ${accent ? "text-white/65" : "text-purple-3"}`}
      >
        {label}
      </p>
      <p
        className={`font-serif text-2xl lg:text-3xl leading-none ${accent ? "text-white" : "text-ink"}`}
      >
        {value}
      </p>
      <p className={`text-xs mt-1.5 ${accent ? "text-white/55" : "text-ink/40"}`}>{sub}</p>
    </div>
  );
}
