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
  ultimaSesion: string;
  serviciosPrincipales: string[];
  notas: string;
};

export default async function ClientesPage() {
  const admin = createAdminClient();

  const [{ data: appts }, { data: clientNotes }] = await Promise.all([
    admin
      .from("appointments")
      .select("email_cliente, nombre_cliente, fecha, services(nombre, precio_mxn)")
      .in("estado", ["completed", "confirmed", "pending"])
      .order("fecha", { ascending: false }),
    admin.from("client_notes").select("email_cliente, notas"),
  ]);

  // Aggregate by email
  type SvcField = { nombre: string; precio_mxn: number | null };
  const map = new Map<
    string,
    {
      nombre: string;
      sesiones: number;
      facturacion: number;
      ultima: string;
      servicios: Map<string, number>;
    }
  >();

  for (const a of appts ?? []) {
    const email = a.email_cliente as string;
    const nombre = a.nombre_cliente as string;
    const fecha = a.fecha as string;
    const svc = a.services as unknown as SvcField | null;

    if (!map.has(email)) {
      map.set(email, { nombre, sesiones: 0, facturacion: 0, ultima: fecha, servicios: new Map() });
    }
    const entry = map.get(email)!;
    entry.sesiones += 1;
    entry.facturacion += svc?.precio_mxn ?? 0;
    if (fecha > entry.ultima) entry.ultima = fecha;
    if (svc?.nombre) {
      entry.servicios.set(svc.nombre, (entry.servicios.get(svc.nombre) ?? 0) + 1);
    }
  }

  const notesMap = new Map<string, string>();
  for (const n of clientNotes ?? []) {
    notesMap.set(n.email_cliente as string, n.notas as string);
  }

  const rows: ClientRow[] = [...map.entries()]
    .map(([email, d]) => ({
      email,
      nombre: d.nombre,
      totalSesiones: d.sesiones,
      facturacionTotal: d.facturacion,
      ultimaSesion: d.ultima,
      serviciosPrincipales: [...d.servicios.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([n]) => n),
      notas: notesMap.get(email) ?? "",
    }))
    .sort((a, b) => b.ultimaSesion.localeCompare(a.ultimaSesion));

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
