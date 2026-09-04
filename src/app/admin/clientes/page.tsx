import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase-admin";
import ClientesClient from "./ClientesClient";

export const metadata: Metadata = {
  title: "Clientes — Vāk Devi",
  robots: { index: false, follow: false },
};

export type ClientRow = {
  email: string;
  nombre: string;
  totalSesiones: number;
  facturacionTotal: number;
  ultimaSesion: string | null;
  serviciosPrincipales: string[];
  notas: string;
};

export default async function ClientesPage() {
  const admin = createAdminClient();

  const [{ data: clients }, { data: appts }] = await Promise.all([
    admin.from("clients").select("email, nombre, notas"),
    admin
      .from("appointments")
      .select("email_cliente, fecha, services(nombre, precio_mxn)")
      .in("estado", ["completed", "confirmed", "pending"])
      .order("fecha", { ascending: false }),
  ]);

  // Aggregate stats by email (sesiones, facturación, última sesión, servicios)
  type SvcField = { nombre: string; precio_mxn: number | null };
  const statsMap = new Map<
    string,
    { sesiones: number; facturacion: number; ultima: string; servicios: Map<string, number> }
  >();

  for (const a of appts ?? []) {
    const email = a.email_cliente as string;
    const fecha = a.fecha as string;
    const svc = a.services as unknown as SvcField | null;

    if (!statsMap.has(email)) {
      statsMap.set(email, { sesiones: 0, facturacion: 0, ultima: fecha, servicios: new Map() });
    }
    const entry = statsMap.get(email)!;
    entry.sesiones += 1;
    entry.facturacion += svc?.precio_mxn ?? 0;
    if (fecha > entry.ultima) entry.ultima = fecha;
    if (svc?.nombre) {
      entry.servicios.set(svc.nombre, (entry.servicios.get(svc.nombre) ?? 0) + 1);
    }
  }

  // "clients" es la fuente de verdad de quién es cliente; las stats se
  // cruzan encima. Un cliente sin citas (p. ej. se borraron todas) es
  // válido y se lista igual, sin fecha ni servicios.
  const rows: ClientRow[] = (clients ?? [])
    .map((c) => {
      const email = c.email as string;
      const stats = statsMap.get(email);
      return {
        email,
        nombre: c.nombre as string,
        totalSesiones: stats?.sesiones ?? 0,
        facturacionTotal: stats?.facturacion ?? 0,
        ultimaSesion: stats?.ultima ?? null,
        serviciosPrincipales: stats
          ? [...stats.servicios.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n)
          : [],
        notas: (c.notas as string | null) ?? "",
      };
    })
    .sort((a, b) => (b.ultimaSesion ?? "").localeCompare(a.ultimaSesion ?? ""));

  return (
    <div className="p-5 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-purple-3 mb-1">CRM</p>
        <h1 className="font-serif text-3xl text-ink">Clientes</h1>
        <p className="text-sm text-ink/45 mt-1">
          {rows.length} clientes · Notas privadas protegidas conforme a la LFPDPPP.
        </p>
      </div>
      <ClientesClient clients={rows} />
    </div>
  );
}
