import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase-admin";
import ServiciosClient from "./ServiciosClient";

export const metadata: Metadata = {
  title: "Servicios — Vāk Devi",
  robots: { index: false, follow: false },
};

export type ServiceRow = {
  id: string;
  nombre: string;
  descripcion: string;
  duracion_minutos: number;
  precio_mxn: number | null;
  es_premium: boolean;
  activo: boolean;
  orden: number;
};

export default async function ServiciosPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("services")
    .select("id, nombre, descripcion, duracion_minutos, precio_mxn, es_premium, activo, orden")
    .order("orden");

  const rows: ServiceRow[] = (data ?? []).map((s) => ({
    id: s.id as string,
    nombre: s.nombre as string,
    descripcion: s.descripcion as string,
    duracion_minutos: s.duracion_minutos as number,
    precio_mxn: s.precio_mxn as number | null,
    es_premium: (s.es_premium ?? false) as boolean,
    activo: (s.activo ?? true) as boolean,
    orden: s.orden as number,
  }));

  return (
    <div className="p-5 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-purple-3 mb-1">Gestión</p>
        <h1 className="font-serif text-3xl text-ink">Servicios</h1>
        <p className="text-sm text-ink/45 mt-1">
          Los cambios aquí se reflejan automáticamente en el landing y en /agendar.
        </p>
      </div>
      <ServiciosClient services={rows} />
    </div>
  );
}
