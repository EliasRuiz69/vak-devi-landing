"use client";

import { useState } from "react";
import { getTodayMerida, getMonthStart, getMonthGrid, getDateBlockInfo } from "@/lib/admin-utils";
import { isWorkingDay } from "@/lib/schedule-utils";
import { STATUS_STYLE } from "@/lib/appointment-status";
import type { ApptRow, ScheduleConfig, BlockedDate } from "./page";

const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

function toDate(fecha: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shiftMonth(monthStart: string, delta: number): string {
  const [y, m] = monthStart.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function CalendarMonthView({
  appointments,
  scheduleConfig,
  blockedDates,
}: {
  appointments: ApptRow[];
  scheduleConfig: ScheduleConfig | null;
  blockedDates: BlockedDate[];
}) {
  const today = getTodayMerida();
  const [monthStart, setMonthStart] = useState(getMonthStart(today));

  const [year, month] = monthStart.split("-").map(Number);
  const weeks = getMonthGrid(year, month - 1);

  const monthLabel = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(
    toDate(monthStart),
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonthStart((m) => shiftMonth(m, -1))}
            aria-label="Mes anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setMonthStart((m) => shiftMonth(m, 1))}
            aria-label="Mes siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="ml-2 font-serif text-lg capitalize text-ink">{monthLabel}</span>
        </div>
        <button
          onClick={() => setMonthStart(getMonthStart(today))}
          className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink/55 hover:border-purple-3 hover:text-ink transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center">
        {DIAS_CORTOS.map((d) => (
          <div key={d} className="py-1 text-[11px] font-medium uppercase tracking-wide text-ink/30">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-1.5">
        {weeks.map((week) => (
          <div key={week[0]} className="grid grid-cols-7 gap-1.5">
            {week.map((dateStr) => {
              const inCurrentMonth = dateStr.slice(0, 7) === monthStart.slice(0, 7);
              const isToday = dateStr === today;
              const isWorking = scheduleConfig
                ? isWorkingDay(toDate(dateStr), scheduleConfig.dias_laborables)
                : true;
              const { bloqueoTotal, motivoTotal, bloqueosParciales } = getDateBlockInfo(dateStr, blockedDates);
              const partialTitle = bloqueosParciales
                .map((p) => `${p.horaInicio.slice(0, 5)}–${p.horaFin.slice(0, 5)}${p.motivo ? ` (${p.motivo})` : ""}`)
                .join("; ");
              const dayAppts = appointments
                .filter((a) => a.fecha === dateStr)
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
              const shown = dayAppts.slice(0, 3);
              const extra = dayAppts.length - shown.length;
              const dayNum = Number(dateStr.slice(8, 10));

              return (
                <div
                  key={dateStr}
                  className={`flex min-h-[6.5rem] flex-col gap-1 rounded-xl border p-1.5 ${
                    !inCurrentMonth
                      ? "border-ink/5 bg-ink/[0.02]"
                      : bloqueoTotal
                        ? "border-red-100 bg-red-50/40"
                        : !isWorking
                          ? "border-ink/6 bg-ink/[0.03]"
                          : "border-ink/8 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        isToday
                          ? "bg-purple-1 font-medium text-white"
                          : inCurrentMonth
                            ? "text-ink/55"
                            : "text-ink/25"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {bloqueoTotal ? (
                      <span title={motivoTotal ?? "Bloqueado"} className="text-red-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M5.5 5.5l13 13" />
                        </svg>
                      </span>
                    ) : (
                      bloqueosParciales.length > 0 && (
                        <span title={partialTitle} className="text-amber-500">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3.5 2" />
                          </svg>
                        </span>
                      )
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {shown.map((a) => (
                      <div
                        key={a.id}
                        className={`truncate rounded border px-1 py-0.5 text-[10px] font-medium ${STATUS_STYLE[a.estado]}`}
                      >
                        {a.hora_inicio.slice(0, 5)} {a.nombre_cliente}
                      </div>
                    ))}
                    {extra > 0 && (
                      <div className="px-1 text-[10px] text-ink/40">+{extra} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
