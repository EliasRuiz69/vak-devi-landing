"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateScheduleConfig,
  addBlockedDate,
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

  // Blocked date form state
  const [newFecha, setNewFecha] = useState("");
  const [newMotivo, setNewMotivo] = useState("");

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

  async function handleAddBlocked(e: React.FormEvent) {
    e.preventDefault();
    setBlockError(null);
    if (!newFecha) { setBlockError("Selecciona una fecha."); return; }
    const res = await addBlockedDate(newFecha, newMotivo);
    if (res.error) { setBlockError(res.error); return; }
    setNewFecha("");
    setNewMotivo("");
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

      {/* Blocked dates */}
      <div className="bg-white rounded-2xl border border-ink/8 p-5">
        <h2 className="font-serif text-base text-ink mb-4">Días bloqueados</h2>
        <p className="text-xs text-ink/40 mb-4">
          Vacaciones, festivos o cualquier día en el que no haya disponibilidad.
        </p>

        {/* Add form */}
        <form onSubmit={handleAddBlocked} className="flex flex-wrap gap-2 mb-5">
          <input
            type="date"
            value={newFecha}
            onChange={(e) => setNewFecha(e.target.value)}
            className="rounded-xl border border-ink/12 px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3"
          />
          <input
            type="text"
            value={newMotivo}
            onChange={(e) => setNewMotivo(e.target.value)}
            placeholder="Motivo (opcional)"
            className="flex-1 min-w-32 rounded-xl border border-ink/12 px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3"
          />
          <button
            type="submit"
            className="rounded-xl bg-purple-1 px-4 py-2 text-xs font-medium text-white hover:bg-purple-2 transition-colors"
          >
            Bloquear
          </button>
          {blockError && (
            <p className="w-full text-xs text-red-500">{blockError}</p>
          )}
        </form>

        {/* List */}
        {blockedDates.length === 0 ? (
          <p className="text-sm text-ink/35">No hay días bloqueados.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {blockedDates.map((b) => {
              const [y, m, d] = b.fecha.split("-").map(Number);
              const label = new Date(y, m - 1, d).toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm text-ink capitalize">{label}</p>
                    {b.motivo && <p className="text-xs text-ink/40">{b.motivo}</p>}
                  </div>
                  <button
                    onClick={() => handleRemove(b.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const inp =
  "w-full rounded-xl border border-ink/12 bg-lavender px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3";
