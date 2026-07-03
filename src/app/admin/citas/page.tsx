import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import { formatFechaLong } from "@/lib/schedule-utils";
import CitasClient from "./CitasClient";

export const metadata: Metadata = {
  title: "Citas — Vāk Devi",
  robots: { index: false, follow: false },
};

export type ApptRow = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente: string;
  motivo_consulta: string | null;
  notas_internas: string | null;
  estado: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  creado_en: string;
  fechaLong: string;
  servicioNombre: string;
  servicioId: string;
};

export default async function CitasPage() {
  const admin = createAdminClient();

  const [{ data: appts }, { data: services }] = await Promise.all([
    admin
      .from("appointments")
      .select("*, services(id, nombre)")
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: true }),
    admin.from("services").select("id, nombre").eq("activo", true).order("orden"),
  ]);

  const rows: ApptRow[] = (appts ?? []).map((a) => ({
    id: a.id as string,
    fecha: a.fecha as string,
    hora_inicio: a.hora_inicio as string,
    hora_fin: a.hora_fin as string,
    nombre_cliente: a.nombre_cliente as string,
    email_cliente: a.email_cliente as string,
    telefono_cliente: a.telefono_cliente as string,
    motivo_consulta: a.motivo_consulta as string | null,
    notas_internas: a.notas_internas as string | null,
    estado: a.estado as ApptRow["estado"],
    creado_en: a.creado_en as string,
    fechaLong: formatFechaLong(a.fecha as string),
    servicioNombre: (a.services as { nombre: string } | null)?.nombre ?? "",
    servicioId: (a.services as { id: string } | null)?.id ?? "",
  }));

  const serviceOptions = (services ?? []).map((s) => ({
    id: s.id as string,
    nombre: s.nombre as string,
  }));

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-purple-3 mb-1">Gestión</p>
          <h1 className="font-serif text-3xl text-ink">Citas</h1>
          <p className="text-sm text-ink/45 mt-1">
            {rows.filter((a) => a.estado === "pending").length} pendientes ·{" "}
            {rows.filter((a) => a.estado === "confirmed").length} confirmadas
          </p>
        </div>
        <Link
          href="/admin/citas-nueva"
          className="shrink-0 flex items-center gap-2 rounded-full bg-purple-1 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-2 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva cita
        </Link>
      </div>

      <CitasClient appointments={rows} serviceOptions={serviceOptions} />
    </div>
  );
}
