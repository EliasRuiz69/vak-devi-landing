import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import NuevaCitaForm from "./NuevaCitaForm";

export const metadata: Metadata = {
  title: "Nueva cita — Vāk Devi",
  robots: { index: false, follow: false },
};

export default async function NuevaCitaPage() {
  const admin = createAdminClient();
  const [{ data: services }, { data: clients }] = await Promise.all([
    admin
      .from("services")
      .select("id, nombre, duracion_minutos")
      .eq("activo", true)
      .order("orden"),
    admin.from("clients").select("nombre, email, telefono").order("nombre", { ascending: true }),
  ]);

  const svcOptions = (services ?? []).map((s) => ({
    id: s.id as string,
    nombre: s.nombre as string,
    duracion_minutos: s.duracion_minutos as number,
  }));

  const clientOptions = (clients ?? []).map((c) => ({
    nombre: c.nombre as string,
    email: c.email as string,
    telefono: (c.telefono as string | null) ?? "",
  }));

  return (
    <div className="p-5 lg:p-8 max-w-2xl mx-auto">
      <Link
        href="/admin/citas"
        className="inline-flex items-center gap-1.5 text-xs text-ink/45 hover:text-purple-2 transition-colors mb-6"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5m7-7l-7 7 7 7" />
        </svg>
        Volver a citas
      </Link>

      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-purple-3 mb-1">Gestión</p>
        <h1 className="font-serif text-3xl text-ink">Nueva cita</h1>
        <p className="text-sm text-ink/45 mt-1">Crea una cita manual para un cliente.</p>
      </div>

      <NuevaCitaForm serviceOptions={svcOptions} clientOptions={clientOptions} />
    </div>
  );
}
