"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient, updateClient, deleteClient, type ClientData } from "@/app/actions/admin";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ClientRow } from "./page";

export default function ClientesClient({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const visible = search
    ? clients.filter(
        (c) =>
          c.nombre.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()),
      )
    : clients;

  function refresh() {
    startTransition(() => { router.refresh(); });
  }

  const clientToDelete = clients.find((c) => c.email === confirmDeleteEmail) ?? null;

  async function handleConfirmDelete() {
    if (!confirmDeleteEmail) return;
    setDeleting(true);
    await deleteClient(confirmDeleteEmail);
    setDeleting(false);
    setConfirmDeleteEmail(null);
    router.refresh();
  }

  return (
    <>
      {/* Search + alta */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink placeholder-ink/35 focus:outline-none focus:border-purple-3"
        />
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="shrink-0 flex items-center gap-2 rounded-full bg-purple-1 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Alta cliente
          </button>
        )}
      </div>

      {/* Legal notice */}
      <p className="mb-4 text-[10px] text-ink/30 leading-relaxed max-w-2xl">
        Las notas privadas almacenadas aquí son de uso exclusivo del terapeuta y están protegidas conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). No se comparten con terceros ni se exponen al cliente.
      </p>

      {creating && (
        <div className="mb-4">
          <ClientForm
            onSave={async (data) => {
              const res = await createClient(data);
              if (!res.success) return res.error;
              setCreating(false);
              refresh();
              return null;
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div
        className={`flex flex-col gap-3 transition-opacity ${isPending ? "opacity-60" : ""}`}
      >
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-ink/8 bg-white px-8 py-16 text-center">
            <p className="font-serif text-lg text-ink/35">Sin resultados.</p>
          </div>
        ) : (
          visible.map((c) => (
            <ClientCard
              key={c.id}
              client={c}
              open={openId === c.id}
              onToggle={() => setOpenId(openId === c.id ? null : c.id)}
              onSave={async (data) => {
                const res = await updateClient(c.email, data);
                if (!res.success) return { error: res.error };
                refresh();
                return { error: null, appointmentsUpdated: res.appointmentsUpdated };
              }}
              onDeleteClick={() => setConfirmDeleteEmail(c.email)}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteEmail !== null}
        title="Eliminar cliente"
        message={
          clientToDelete
            ? `¿Eliminar el registro de contacto de ${clientToDelete.nombre} (${clientToDelete.email})?\n\nSe borrará su ficha y sus notas privadas. Sus ${clientToDelete.totalSesiones} citas seguirán guardadas en Citas. Esta acción no se puede deshacer.`
            : ""
        }
        isPending={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteEmail(null)}
      />
    </>
  );
}

// ─── Tarjeta de cliente ─────────────────────────────────────────────────────

function ClientCard({
  client,
  open,
  onToggle,
  onSave,
  onDeleteClick,
}: {
  client: ClientRow;
  open: boolean;
  onToggle: () => void;
  onSave: (
    data: ClientData,
  ) => Promise<{ error: string | null; appointmentsUpdated?: number }>;
  onDeleteClick: () => void;
}) {
  const [nombre, setNombre] = useState(client.nombre);
  const [telefono, setTelefono] = useState(client.telefono);
  const [email, setEmail] = useState(client.email);
  const [notes, setNotes] = useState(client.notas);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  let ultimaLabel = "Sin citas registradas";
  if (client.ultimaSesion) {
    const [uy, um, ud] = client.ultimaSesion.split("-").map(Number);
    ultimaLabel = `última: ${new Date(uy, um - 1, ud).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    const res = await onSave({ nombre, email, telefono, notas: notes });
    if (res.error) {
      setError(res.error);
    } else if (res.appointmentsUpdated !== undefined) {
      const n = res.appointmentsUpdated;
      setSuccessMsg(`Email actualizado · ${n} cita${n === 1 ? "" : "s"} actualizada${n === 1 ? "" : "s"}`);
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-white overflow-hidden">
      {/* Summary row */}
      <div className="w-full flex items-center gap-1 hover:bg-lavender transition-colors">
        <button
          onClick={onToggle}
          className="min-w-0 flex-1 px-5 py-4 flex items-center justify-between gap-4 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="font-serif text-base text-ink capitalize">{client.nombre}</span>
              {client.serviciosPrincipales.map((s) => (
                <span key={s} className="rounded-full bg-purple-1/8 px-2 py-0.5 text-[10px] text-purple-2">
                  {s.split(" ").slice(0, 2).join(" ")}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-ink/40">
              <span>{client.email}</span>
              <span>{client.totalSesiones} sesiones</span>
              {client.facturacionTotal > 0 && (
                <span>${client.facturacionTotal.toLocaleString("es-MX")} MXN</span>
              )}
              <span>{ultimaLabel}</span>
            </div>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`shrink-0 text-ink/30 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          title="Eliminar cliente"
          aria-label="Eliminar cliente"
          className="shrink-0 mr-4 rounded-full p-2 text-ink/25 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
          </svg>
        </button>
      </div>

      {/* Edit panel */}
      {open && (
        <div className="border-t border-ink/6 px-5 py-4 flex flex-col gap-3 bg-lavender/50">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Nombre">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={inp}
              />
            </FormField>

            <FormField label="Teléfono">
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={inp}
              />
            </FormField>

            <FormField label="Email" className="sm:col-span-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inp}
              />
            </FormField>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink/50 uppercase tracking-wide">
              Notas privadas
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Observaciones del proceso, patrones, avances, próximos pasos…"
              className={inp + " resize-none"}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="self-end rounded-full bg-purple-1 px-5 py-2 text-xs font-medium text-white hover:bg-purple-2 transition-colors disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Formulario de alta ─────────────────────────────────────────────────────

function ClientForm({
  onSave,
  onCancel,
}: {
  onSave: (data: ClientData) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ClientData>({ nombre: "", email: "", telefono: "", notas: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const err = await onSave(form);
    if (err) setError(err);
    setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 border-purple-3/30 bg-white px-5 py-5 flex flex-col gap-4"
    >
      <h3 className="font-serif text-base text-ink">Alta de cliente</h3>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Nombre">
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            className={inp}
          />
        </FormField>

        <FormField label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className={inp}
          />
        </FormField>

        <FormField label="Teléfono" className="sm:col-span-2">
          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className={inp}
          />
        </FormField>

        <FormField label="Notas privadas" className="sm:col-span-2">
          <textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            rows={3}
            className={inp + " resize-none"}
          />
        </FormField>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-purple-1 px-5 py-2 text-xs font-medium text-white hover:bg-purple-2 transition-colors disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar"}
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
  "w-full rounded-xl border border-ink/12 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-purple-3";

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
