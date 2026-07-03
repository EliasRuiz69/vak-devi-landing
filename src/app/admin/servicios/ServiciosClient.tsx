"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateService,
  createService,
  toggleServiceActive,
  type ServiceData,
} from "@/app/actions/admin";
import type { ServiceRow } from "./page";

export default function ServiciosClient({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    startTransition(() => { router.refresh(); });
  }

  async function handleSave(id: string, data: ServiceData) {
    setError(null);
    const res = await updateService(id, data);
    if (res.error) { setError(res.error); return; }
    setEditingId(null);
    refresh();
  }

  async function handleCreate(data: Omit<ServiceData, "activo">) {
    setError(null);
    const res = await createService(data);
    if (res.error) { setError(res.error); return; }
    setCreating(false);
    refresh();
  }

  async function handleToggle(id: string, activo: boolean) {
    await toggleServiceActive(id, activo);
    refresh();
  }

  return (
    <div className={`flex flex-col gap-4 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      {services.map((svc) =>
        editingId === svc.id ? (
          <ServiceForm
            key={svc.id}
            initial={svc}
            onSave={(data) => handleSave(svc.id, { ...data, activo: svc.activo })}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <ServiceCard
            key={svc.id}
            svc={svc}
            onEdit={() => setEditingId(svc.id)}
            onToggle={() => handleToggle(svc.id, !svc.activo)}
          />
        ),
      )}

      {creating ? (
        <ServiceForm
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="rounded-2xl border-2 border-dashed border-ink/12 px-5 py-6 text-center text-sm text-ink/40 hover:border-purple-3 hover:text-purple-2 transition-colors"
        >
          + Añadir nuevo servicio
        </button>
      )}
    </div>
  );
}

function ServiceCard({
  svc,
  onEdit,
  onToggle,
}: {
  svc: ServiceRow;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white px-5 py-4 transition-opacity ${
        svc.activo ? "border-ink/10" : "border-ink/5 opacity-55"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-serif text-base text-ink">{svc.nombre}</span>
            {svc.es_premium && (
              <span className="rounded-full bg-purple-1/10 px-2 py-0.5 text-[10px] font-medium text-purple-1">
                Premium
              </span>
            )}
            {!svc.activo && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400">
                Inactivo
              </span>
            )}
          </div>
          <p className="text-sm text-ink/55 line-clamp-2">{svc.descripcion}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-ink/40">
            <span>{svc.duracion_minutos} min</span>
            {svc.precio_mxn != null && (
              <span>${svc.precio_mxn.toLocaleString("es-MX")} MXN</span>
            )}
            <span className="text-ink/30">orden: {svc.orden}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            onClick={onEdit}
            className="rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/55 hover:border-purple-3 hover:text-purple-2 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onToggle}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              svc.activo
                ? "border-ink/15 text-ink/45 hover:border-red-200 hover:text-red-500"
                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {svc.activo ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>
    </div>
  );
}

type FormData = Omit<ServiceData, "activo">;

function ServiceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ServiceRow;
  onSave: (data: FormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>({
    nombre: initial?.nombre ?? "",
    descripcion: initial?.descripcion ?? "",
    duracion_minutos: initial?.duracion_minutos ?? 60,
    precio_mxn: initial?.precio_mxn ?? null,
    es_premium: initial?.es_premium ?? false,
    orden: initial?.orden ?? 99,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 border-purple-3/30 bg-white px-5 py-5 flex flex-col gap-4"
    >
      <h3 className="font-serif text-base text-ink">
        {initial ? "Editar servicio" : "Nuevo servicio"}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Nombre" className="sm:col-span-2">
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            className={inp}
          />
        </FormField>

        <FormField label="Descripción" className="sm:col-span-2">
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={3}
            required
            className={inp + " resize-none"}
          />
        </FormField>

        <FormField label="Duración (minutos)">
          <input
            type="number"
            min={15}
            step={15}
            value={form.duracion_minutos}
            onChange={(e) => setForm({ ...form, duracion_minutos: Number(e.target.value) })}
            required
            className={inp}
          />
        </FormField>

        <FormField label="Precio MXN (interno)">
          <input
            type="number"
            min={0}
            step={50}
            value={form.precio_mxn ?? ""}
            onChange={(e) =>
              setForm({ ...form, precio_mxn: e.target.value ? Number(e.target.value) : null })
            }
            placeholder="Sin precio asignado"
            className={inp}
          />
        </FormField>

        <FormField label="Orden">
          <input
            type="number"
            min={1}
            value={form.orden}
            onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
            className={inp}
          />
        </FormField>

        <FormField label="Tipo">
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={form.es_premium}
              onChange={(e) => setForm({ ...form, es_premium: e.target.checked })}
              className="accent-purple-1"
            />
            <span className="text-sm text-ink/70">Marcar como Premium</span>
          </label>
        </FormField>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="rounded-full bg-purple-1 px-5 py-2 text-xs font-medium text-white hover:bg-purple-2 transition-colors"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-ink/15 px-5 py-2 text-xs text-ink/55 hover:border-purple-3 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

const inp =
  "w-full rounded-xl border border-ink/12 bg-lavender px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3";

function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-medium text-ink/50 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}
