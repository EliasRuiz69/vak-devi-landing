"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  updateService,
  createService,
  toggleServiceActive,
  reorderServices,
  type ServiceData,
} from "@/app/actions/admin";
import type { ServiceRow } from "./page";

export default function ServiciosClient({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderedServices, setOrderedServices] = useState<ServiceRow[]>(services);
  const [toast, setToast] = useState<string | null>(null);

  // Sync local order when server data refreshes
  useEffect(() => {
    setOrderedServices(services);
  }, [services]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedServices((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      const updates = reordered.map((s, i) => ({ id: s.id, orden: i + 1 }));
      reorderServices(updates).then((res) => {
        if (res.error) {
          setError(`Error al guardar el orden: ${res.error}`);
        } else {
          setToast("Orden guardado");
          setTimeout(() => setToast(null), 2500);
        }
      });

      return reordered;
    });
  }

  const draggable = !editingId && !creating;

  return (
    <div className={`flex flex-col gap-4 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      {toast && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
          ✓ {toast}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedServices.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-4">
            {orderedServices.map((svc) =>
              editingId === svc.id ? (
                <ServiceForm
                  key={svc.id}
                  initial={svc}
                  onSave={(data) => handleSave(svc.id, { ...data, activo: svc.activo })}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <SortableServiceCard
                  key={svc.id}
                  svc={svc}
                  onEdit={() => setEditingId(svc.id)}
                  onToggle={() => handleToggle(svc.id, !svc.activo)}
                  draggable={draggable}
                />
              ),
            )}
          </div>
        </SortableContext>
      </DndContext>

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

// ─── Sortable card wrapper ────────────────────────────────────────────────────

function SortableServiceCard({
  svc,
  onEdit,
  onToggle,
  draggable,
}: {
  svc: ServiceRow;
  onEdit: () => void;
  onToggle: () => void;
  draggable: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: svc.id, disabled: !draggable });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: isDragging ? "relative" : undefined,
      }}
    >
      <ServiceCard
        svc={svc}
        onEdit={onEdit}
        onToggle={onToggle}
        handleRef={(el) => setActivatorNodeRef(el)}
        handleListeners={listeners as React.HTMLAttributes<HTMLButtonElement>}
        handleAttributes={attributes as React.HTMLAttributes<HTMLButtonElement>}
        draggable={draggable}
      />
    </div>
  );
}

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({
  svc,
  onEdit,
  onToggle,
  handleRef,
  handleListeners,
  handleAttributes,
  draggable,
}: {
  svc: ServiceRow;
  onEdit: () => void;
  onToggle: () => void;
  handleRef?: (el: HTMLButtonElement | null) => void;
  handleListeners?: React.HTMLAttributes<HTMLButtonElement>;
  handleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  draggable?: boolean;
}) {
  return (
    <div
      className={`flex items-stretch rounded-2xl border bg-white transition-opacity ${
        svc.activo ? "border-ink/10" : "border-ink/5 opacity-55"
      }`}
    >
      {/* Drag handle */}
      <button
        ref={handleRef}
        {...handleListeners}
        {...handleAttributes}
        type="button"
        aria-label="Arrastrar para reordenar"
        className={`flex items-center rounded-l-2xl border-r border-ink/8 px-3 text-ink/20 transition-colors ${
          draggable
            ? "touch-none cursor-grab hover:bg-purple-1/5 hover:text-purple-2 active:cursor-grabbing"
            : "cursor-default opacity-30"
        }`}
      >
        <GripIcon />
      </button>

      {/* Card content */}
      <div className="flex flex-1 items-start justify-between gap-4 px-5 py-4">
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

function GripIcon() {
  return (
    <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" aria-hidden>
      <circle cx="3.5" cy="4" r="1.4" />
      <circle cx="3.5" cy="9" r="1.4" />
      <circle cx="3.5" cy="14" r="1.4" />
      <circle cx="8.5" cy="4" r="1.4" />
      <circle cx="8.5" cy="9" r="1.4" />
      <circle cx="8.5" cy="14" r="1.4" />
    </svg>
  );
}

// ─── Service form (unchanged) ─────────────────────────────────────────────────

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
