"use client";

import { useState } from "react";
import Link from "next/link";
import { getTodayMerida, addDays, getDateBlockInfo } from "@/lib/admin-utils";
import { isWorkingDay, formatFechaLong } from "@/lib/schedule-utils";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/appointment-status";
import { getDayCalendarData } from "./day-appointments";
import type { ApptRow, ScheduleConfig, BlockedDate } from "./page";

function toDate(fecha: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function CalendarDayView({
  appointments,
  scheduleConfig,
  blockedDates,
  initialDate,
}: {
  appointments: ApptRow[];
  scheduleConfig: ScheduleConfig | null;
  blockedDates: BlockedDate[];
  initialDate?: string;
}) {
  const today = getTodayMerida();
  const [fecha, setFecha] = useState(initialDate ?? today);

  const isToday = fecha === today;
  const isWorking = scheduleConfig ? isWorkingDay(toDate(fecha), scheduleConfig.dias_laborables) : true;
  const blockInfo = getDateBlockInfo(fecha, blockedDates);
  const { appointments: dayAppts } = getDayCalendarData(fecha, appointments, blockInfo, isWorking);

  const partialTitle = blockInfo.bloqueosParciales
    .map((p) => `${p.horaInicio.slice(0, 5)}–${p.horaFin.slice(0, 5)}${p.motivo ? ` (${p.motivo})` : ""}`)
    .join("; ");

  return (
    <div className="flex flex-col gap-4">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFecha((f) => addDays(f, -1))}
            aria-label="Día anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setFecha((f) => addDays(f, 1))}
            aria-label="Día siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setFecha(today)}
          className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink/55 hover:border-purple-3 hover:text-ink transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* Day header */}
      <div>
        <p className="flex items-center gap-2 font-serif text-xl capitalize text-ink">
          {formatFechaLong(fecha)}
          {isToday && (
            <span className="rounded-full bg-purple-1 px-2 py-0.5 text-[10px] font-medium text-white">Hoy</span>
          )}
        </p>

        {blockInfo.bloqueoTotal ? (
          <p
            title={blockInfo.motivoTotal ?? "Bloqueado"}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M5.5 5.5l13 13" />
            </svg>
            Día bloqueado{blockInfo.motivoTotal ? ` — ${blockInfo.motivoTotal}` : ""}
          </p>
        ) : blockInfo.bloqueosParciales.length > 0 ? (
          <p
            title={partialTitle}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            Bloqueo parcial: {partialTitle}
          </p>
        ) : !isWorking ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/40">
            Día no laborable
          </p>
        ) : null}
      </div>

      {/* Appointments */}
      {dayAppts.length === 0 ? (
        <div className="rounded-2xl border border-ink/8 bg-white px-8 py-16 text-center">
          <p className="font-serif text-lg text-ink/35">No hay citas registradas este día.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dayAppts.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border bg-white px-5 py-4 shadow-sm ${
                a.estado === "cancelled" || a.estado === "no_show" ? "border-ink/6 opacity-70" : "border-ink/10"
              }`}
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[a.estado]}`}
                  >
                    {STATUS_LABEL[a.estado]}
                  </span>
                  <span className="text-xs text-ink/45">{a.servicioNombre}</span>
                  <span className="text-xs text-ink/45">
                    · {a.hora_inicio.slice(0, 5)}–{a.hora_fin.slice(0, 5)} h
                  </span>
                </div>
                <Link
                  href={`/admin/citas/${a.id}`}
                  className="font-serif text-lg text-ink hover:text-purple-2 transition-colors leading-tight capitalize"
                >
                  {a.nombre_cliente}
                </Link>
                <div className="flex flex-wrap gap-4 text-xs text-ink/45 mt-0.5">
                  <a href={`mailto:${a.email_cliente}`} className="hover:text-purple-2">
                    {a.email_cliente}
                  </a>
                  <span>{a.telefono_cliente}</span>
                </div>
                {a.motivo_consulta && (
                  <p className="mt-1 text-sm text-ink/55 italic line-clamp-2">"{a.motivo_consulta}"</p>
                )}
                <Link
                  href={`/admin/citas/${a.id}`}
                  className="mt-2 self-start rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/55 hover:border-purple-3 hover:text-purple-2 transition-colors"
                >
                  Ver detalle
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
