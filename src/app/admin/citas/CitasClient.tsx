"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  markNoShow,
} from "@/app/actions/admin";
import type { ApptRow } from "./page";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  no_show: "bg-red-50 text-red-600 border-red-200",
};

type Filter = "all" | "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "completed", label: "Completadas" },
  { key: "cancelled", label: "Canceladas" },
  { key: "no_show", label: "No asistió" },
];

export default function CitasClient({
  appointments,
  serviceOptions,
}: {
  appointments: ApptRow[];
  serviceOptions: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [svcFilter, setSvcFilter] = useState("");

  function doAction(fn: (id: string) => Promise<void>, id: string) {
    startTransition(async () => {
      await fn(id);
      router.refresh();
    });
  }

  const visible = appointments.filter((a) => {
    if (filter !== "all" && a.estado !== filter) return false;
    if (svcFilter && a.servicioId !== svcFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.nombre_cliente.toLowerCase().includes(q) && !a.email_cliente.toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  const counts: Record<Filter, number> = {
    all: appointments.length,
    pending: appointments.filter((a) => a.estado === "pending").length,
    confirmed: appointments.filter((a) => a.estado === "confirmed").length,
    completed: appointments.filter((a) => a.estado === "completed").length,
    cancelled: appointments.filter((a) => a.estado === "cancelled").length,
    no_show: appointments.filter((a) => a.estado === "no_show").length,
  };

  return (
    <>
      {/* Filters row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-purple-1 text-white"
                  : "border border-ink/15 text-ink/55 hover:border-purple-3 hover:text-ink"
              }`}
            >
              {f.label} <span className="opacity-60">({counts[f.key]})</span>
            </button>
          ))}
        </div>

        {/* Search + service filter */}
        <div className="flex gap-2 shrink-0">
          <input
            type="search"
            placeholder="Buscar cliente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink placeholder-ink/35 focus:outline-none focus:border-purple-3 w-44"
          />
          <select
            value={svcFilter}
            onChange={(e) => setSvcFilter(e.target.value)}
            className="rounded-xl border border-ink/15 bg-white px-3 py-1.5 text-xs text-ink focus:outline-none focus:border-purple-3 max-w-40"
          >
            <option value="">Todos los servicios</option>
            {serviceOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre.split(" ").slice(0, 3).join(" ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-ink/8 bg-white px-8 py-16 text-center">
          <p className="font-serif text-lg text-ink/35">No hay citas con estos filtros.</p>
        </div>
      ) : (
        <div className={`flex flex-col gap-3 transition-opacity ${isPending ? "opacity-60" : ""}`}>
          {visible.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border bg-white px-5 py-4 shadow-sm ${
                a.estado === "cancelled" || a.estado === "no_show"
                  ? "border-ink/6 opacity-70"
                  : "border-ink/10"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {/* Info */}
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[a.estado]}`}
                    >
                      {STATUS_LABEL[a.estado]}
                    </span>
                    <span className="text-xs text-ink/45">{a.servicioNombre}</span>
                  </div>
                  <Link
                    href={`/admin/citas/${a.id}`}
                    className="font-serif text-lg text-ink hover:text-purple-2 transition-colors leading-tight capitalize"
                  >
                    {a.nombre_cliente}
                  </Link>
                  <p className="text-sm text-ink/55 capitalize">
                    {a.fechaLong} — {a.hora_inicio.slice(0, 5)} h
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-ink/45 mt-0.5">
                    <a href={`mailto:${a.email_cliente}`} className="hover:text-purple-2">
                      {a.email_cliente}
                    </a>
                    <span>{a.telefono_cliente}</span>
                  </div>
                  {a.motivo_consulta && (
                    <p className="mt-1 text-sm text-ink/55 italic line-clamp-2">
                      "{a.motivo_consulta}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {a.estado === "pending" && (
                    <ActionBtn
                      label="Confirmar"
                      onClick={() => doAction(confirmAppointment, a.id)}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    />
                  )}
                  {(a.estado === "pending" || a.estado === "confirmed") && (
                    <ActionBtn
                      label="Completar"
                      onClick={() => doAction(completeAppointment, a.id)}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    />
                  )}
                  {(a.estado === "pending" || a.estado === "confirmed") && (
                    <ActionBtn
                      label="No asistió"
                      onClick={() => doAction(markNoShow, a.id)}
                      className="border border-orange-300 text-orange-600 hover:bg-orange-50"
                    />
                  )}
                  {a.estado !== "cancelled" && a.estado !== "completed" && a.estado !== "no_show" && (
                    <ActionBtn
                      label="Cancelar"
                      onClick={() => doAction(cancelAppointment, a.id)}
                      className="border border-red-200 text-red-600 hover:bg-red-50"
                    />
                  )}
                  <Link
                    href={`/admin/citas/${a.id}`}
                    className="rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/55 hover:border-purple-3 hover:text-purple-2 transition-colors"
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ActionBtn({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${className}`}
    >
      {label}
    </button>
  );
}
