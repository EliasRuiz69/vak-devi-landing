"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateScheduleConfig,
  addBlockedDateRange,
  addBlockedTimeRange,
  removeBlockedDate,
} from "@/app/actions/admin";
import type { ScheduleConfig, BlockedDate } from "./page";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function DisponibilidadClient({
  config,
  blockedDates,
}: {
  config: ScheduleConfig | null;
  blockedDates: BlockedDate[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [schedError, setSchedError] = useState<string | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);

  // Schedule form state
  const [dias, setDias] = useState<number[]>(config?.dias_laborables ?? [1, 2, 3, 4, 5]);
  const [horaInicio, setHoraInicio] = useState(config?.hora_inicio ?? "09:00");
  const [horaFin, setHoraFin] = useState(config?.hora_fin ?? "18:00");
  const [duracion, setDuracion] = useState(config?.duracion_bloque_minutos ?? 60);

  // Blocked date-range form state
  const [rangeInicio, setRangeInicio] = useState("");
  const [rangeFin, setRangeFin] = useState("");
  const [rangeMotivo, setRangeMotivo] = useState("");

  // Blocked time-range form state
  const [timeFecha, setTimeFecha] = useState("");
  const [timeInicio, setTimeInicio] = useState("");
  const [timeFin, setTimeFin] = useState("");
  const [timeMotivo, setTimeMotivo] = useState("");

  function refresh() {
    startTransition(() => { router.refresh(); });
  }

  function toggleDay(d: number) {
    setDias((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  }

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSchedError(null);
    if (!config) return;
    const res = await updateScheduleConfig(config.id, {
      dias_laborables: dias,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      duracion_bloque_minutos: duracion,
    });
    if (res.error) { setSchedError(res.error); return; }
    refresh();
  }

  async function handleAddRange(e: React.FormEvent) {
    e.preventDefault();
    setBlockError(null);
    if (!rangeInicio || !rangeFin) { setBlockError("Selecciona fecha de inicio y de fin."); return; }
    const res = await addBlockedDateRange(rangeInicio, rangeFin, rangeMotivo);
    if (res.error) { setBlockError(res.error); return; }
    setRangeInicio("");
    setRangeFin("");
    setRangeMotivo("");
    refresh();
  }

  async function handleAddTime(e: React.FormEvent) {
    e.preventDefault();
    setBlockError(null);
    if (!timeFecha || !timeInicio || !timeFin) {
      setBlockError("Selecciona fecha, hora de inicio y hora de fin.");
      return;
    }
    const res = await addBlockedTimeRange(timeFecha, timeInicio, timeFin, timeMotivo);
    if (res.error) { setBlockError(res.error); return; }
    setTimeFecha("");
    setTimeInicio("");
    setTimeFin("");
    setTimeMotivo("");
    refresh();
  }

  async function handleRemove(id: string) {
    await removeBlockedDate(id);
    refresh();
  }

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      {/* Schedule config */}
      <div className="bg-white rounded-2xl border border-ink/8 p-5">
        <h2 className="font-serif text-base text-ink mb-4">Horario de trabajo</h2>

        <form onSubmit={handleSaveSchedule} className="flex flex-col gap-4">
          {/* Days */}
          <div>
            <label className="text-xs font-medium text-ink/50 uppercase tracking-wide block mb-2">
              Días laborables
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    dias.includes(i)
                      ? "bg-purple-1 text-white"
                      : "border border-ink/15 text-ink/50 hover:border-purple-3"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink/50 uppercase tracking-wide block mb-1">
                Hora inicio
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className={inp}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/50 uppercase tracking-wide block mb-1">
                Hora fin
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className={inp}
              />
            </div>
          </div>

          {/* Block duration */}
          <div>
            <label className="text-xs font-medium text-ink/50 uppercase tracking-wide block mb-1">
              Duración de bloque (minutos)
            </label>
            <select
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              className={inp}
            >
              {[30, 45, 60, 90, 120].map((v) => (
                <option key={v} value={v}>
                  {v} min
                </option>
              ))}
            </select>
          </div>

          {schedError && (
            <p className="text-sm text-red-500">{schedError}</p>
          )}

          <button
            type="submit"
            className="self-start rounded-full bg-purple-1 px-5 py-2 text-xs font-medium text-white hover:bg-purple-2 transition-colors"
          >
            Guardar horario
          </button>
        </form>
      </div>

      {/* Bloqueos de agenda */}
      <div className="bg-white rounded-2xl border border-ink/8 p-5">
        <h2 className="font-serif text-base text-ink mb-1">Bloqueos de agenda</h2>
        <p className="text-xs text-ink/40 mb-4">
          Vacaciones, festivos, o unas horas de un día concreto en que no haya disponibilidad.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Bloquear rango de fechas */}
          <form onSubmit={handleAddRange} className="flex flex-col gap-2 rounded-xl border border-ink/8 p-3.5">
            <p className="text-xs font-medium text-ink/50 uppercase tracking-wide">
              Bloquear fechas
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                value={rangeInicio}
                onChange={(e) => setRangeInicio(e.target.value)}
                className="flex-1 rounded-xl border border-ink/12 px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3"
              />
              <input
                type="date"
                value={rangeFin}
                onChange={(e) => setRangeFin(e.target.value)}
                className="flex-1 rounded-xl border border-ink/12 px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3"
              />
            </div>
            <input
              type="text"
              value={rangeMotivo}
              onChange={(e) => setRangeMotivo(e.target.value)}
              placeholder="Motivo (opcional)"
              className="rounded-xl border border-ink/12 px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3"
            />
            <button
              type="submit"
              className="self-start rounded-xl bg-purple-1 px-4 py-2 text-xs font-medium text-white hover:bg-purple-2 transition-colors"
            >
              Bloquear fechas
            </button>
          </form>

          {/* Bloquear horario en un día */}
          <form onSubmit={handleAddTime} className="flex flex-col gap-2 rounded-xl border border-ink/8 p-3.5">
            <p className="text-xs font-medium text-ink/50 uppercase tracking-wide">
              Bloquear horario en un día
            </p>
            <input
              type="date"
              value={timeFecha}
              onChange={(e) => setTimeFecha(e.target.value)}
              className="rounded-xl border border-ink/12 px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3"
            />
            <div className="flex gap-2">
              <input
                type="time"
                value={timeInicio}
                onChange={(e) => setTimeInicio(e.target.value)}
                className="flex-1 rounded-xl border border-ink/12 px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3"
              />
              <input
                type="time"
                value={timeFin}
                onChange={(e) => setTimeFin(e.target.value)}
                className="flex-1 rounded-xl border border-ink/12 px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3"
              />
            </div>
            <input
              type="text"
              value={timeMotivo}
              onChange={(e) => setTimeMotivo(e.target.value)}
              placeholder="Motivo (opcional)"
              className="rounded-xl border border-ink/12 px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3"
            />
            <button
              type="submit"
              className="self-start rounded-xl bg-purple-1 px-4 py-2 text-xs font-medium text-white hover:bg-purple-2 transition-colors"
            >
              Bloquear horario
            </button>
          </form>
        </div>

        {blockError && (
          <p className="mb-4 text-xs text-red-500">{blockError}</p>
        )}

        {/* List */}
        {blockedDates.length === 0 ? (
          <p className="text-sm text-ink/35">No hay bloqueos activos.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {blockedDates.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 px-4 py-2.5"
              >
                <div>
                  <p className="text-sm text-ink capitalize">{formatBlockLabel(b)}</p>
                  {b.motivo && <p className="text-xs text-ink/40">{b.motivo}</p>}
                </div>
                <button
                  onClick={() => handleRemove(b.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatFechaCorta(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatBlockLabel(b: BlockedDate): string {
  if (b.hora_inicio && b.hora_fin) {
    return `${formatFechaCorta(b.fecha)} · ${b.hora_inicio}–${b.hora_fin}`;
  }
  if (b.fecha === b.fecha_fin) return formatFechaCorta(b.fecha);
  return `${formatFechaCorta(b.fecha)} – ${formatFechaCorta(b.fecha_fin)}`;
}

const inp =
  "w-full rounded-xl border border-ink/12 bg-lavender px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3";
