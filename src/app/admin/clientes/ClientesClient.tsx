"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertClientNotes } from "@/app/actions/admin";
import type { ClientRow } from "./page";

export default function ClientesClient({ clients }: { clients: ClientRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [openEmail, setOpenEmail] = useState<string | null>(null);

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

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-ink/15 bg-white px-4 py-2 text-sm text-ink placeholder-ink/35 focus:outline-none focus:border-purple-3"
        />
      </div>

      {/* Legal notice */}
      <p className="mb-4 text-[10px] text-ink/30 leading-relaxed max-w-2xl">
        Las notas privadas almacenadas aquí son de uso exclusivo del terapeuta y están protegidas conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). No se comparten con terceros ni se exponen al cliente.
      </p>

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
              key={c.email}
              client={c}
              open={openEmail === c.email}
              onToggle={() => setOpenEmail(openEmail === c.email ? null : c.email)}
              onSave={async (notas) => {
                await upsertClientNotes(c.email, c.nombre, notas);
                refresh();
              }}
            />
          ))
        )}
      </div>
    </>
  );
}

function ClientCard({
  client,
  open,
  onToggle,
  onSave,
}: {
  client: ClientRow;
  open: boolean;
  onToggle: () => void;
  onSave: (notas: string) => void;
}) {
  const [notes, setNotes] = useState(client.notas);
  const [saving, setSaving] = useState(false);

  const [uy, um, ud] = client.ultimaSesion.split("-").map(Number);
  const ultimaLabel = new Date(uy, um - 1, ud).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleSave() {
    setSaving(true);
    await onSave(notes);
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-white overflow-hidden">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-lavender transition-colors text-left"
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
            <span>última: {ultimaLabel}</span>
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

      {/* Notes panel */}
      {open && (
        <div className="border-t border-ink/6 px-5 py-4 flex flex-col gap-3 bg-lavender/50">
          <p className="text-xs font-medium text-ink/40 uppercase tracking-wide">Notas privadas</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Observaciones del proceso, patrones, avances, próximos pasos…"
            className="w-full rounded-xl border border-ink/12 bg-white px-4 py-3 text-sm text-ink placeholder-ink/30 resize-none focus:outline-none focus:border-purple-3"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="self-end rounded-full bg-purple-1 px-5 py-2 text-xs font-medium text-white hover:bg-purple-2 transition-colors disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar notas"}
          </button>
        </div>
      )}
    </div>
  );
}
