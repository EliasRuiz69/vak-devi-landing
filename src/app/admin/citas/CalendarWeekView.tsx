"use client";

import { useState } from "react";
import { getTodayMerida, getCalendarWeekStart, addDays, getDateBlockInfo } from "@/lib/admin-utils";
import { isWorkingDay } from "@/lib/schedule-utils";
import { STATUS_STYLE } from "@/lib/appointment-status";
import { getDayCalendarData } from "./day-appointments";
import type { ApptRow, ScheduleConfig, BlockedDate } from "./page";

const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toDate(fecha: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatWeekRange(start: string, end: string): string {
  const startFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(toDate(start));
  const endFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(
    toDate(end),
  );
  return `${startFmt} – ${endFmt}`;
}

export default function CalendarWeekView({
  appointments,
  scheduleConfig,
  blockedDates,
}: {
  appointments: ApptRow[];
  scheduleConfig: ScheduleConfig | null;
  blockedDates: BlockedDate[];
}) {
  const today = getTodayMerida();
  const [weekStart, setWeekStart] = useState(getCalendarWeekStart(today));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const rangeLabel = formatWeekRange(weekStart, days[6]);

  return (
    <div className="flex flex-col gap-3">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            aria-label="Semana anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            aria-label="Semana siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="ml-2 font-serif text-lg capitalize text-ink">{rangeLabel}</span>
        </div>
        <button
          onClick={() => setWeekStart(getCalendarWeekStart(today))}
          className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink/55 hover:border-purple-3 hover:text-ink transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* Columns — scroll horizontal en pantallas angostas en vez de comprimir */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[780px] grid-cols-7 gap-2">
          {days.map((fecha, i) => {
            const isToday = fecha === today;
            const isWorking = scheduleConfig
              ? isWorkingDay(toDate(fecha), scheduleConfig.dias_laborables)
              : true;
            const blockInfo = getDateBlockInfo(fecha, blockedDates);
            const { appointments: dayAppts } = getDayCalendarData(fecha, appointments, blockInfo, isWorking);
            const partialTitle = blockInfo.bloqueosParciales
              .map((p) => `${p.horaInicio.slice(0, 5)}–${p.horaFin.slice(0, 5)}${p.motivo ? ` (${p.motivo})` : ""}`)
              .join("; ");
            const dayNum = Number(fecha.slice(8, 10));

            return (
              <div
                key={fecha}
                className={`flex flex-col gap-2 rounded-xl border p-2 ${
                  blockInfo.bloqueoTotal
                    ? "border-red-100 bg-red-50/40"
                    : !isWorking
                      ? "border-ink/6 bg-ink/[0.03]"
                      : "border-ink/8 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-ink/35">
                      {DIAS_CORTOS[i]}
                    </span>
                    <span
                      className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday ? "bg-purple-1 font-medium text-white" : "text-ink/60"
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>
                  {blockInfo.bloqueoTotal ? (
                    <span title={blockInfo.motivoTotal ?? "Bloqueado"} className="text-red-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M5.5 5.5l13 13" />
                      </svg>
                    </span>
                  ) : (
                    blockInfo.bloqueosParciales.length > 0 && (
                      <span title={partialTitle} className="text-amber-500">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3.5 2" />
                        </svg>
                      </span>
                    )
                  )}
                </div>

                <div className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto">
                  {dayAppts.length === 0 ? (
                    <p className="px-0.5 text-[10px] italic text-ink/25">Sin citas</p>
                  ) : (
                    dayAppts.map((a) => (
                      <div
                        key={a.id}
                        className={`truncate rounded border px-1.5 py-1 text-[10px] font-medium ${STATUS_STYLE[a.estado]}`}
                      >
                        <div>{a.hora_inicio.slice(0, 5)}</div>
                        <div className="truncate">{a.nombre_cliente}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
