import { createAdminClient } from "@/lib/supabase-admin";
import type { Service } from "@/content/services";
import Services from "./Services";


export default async function ServicesSection() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("services")
    .select("id, nombre, descripcion, es_premium")
    .eq("activo", true)
    .order("orden");

  const services: Service[] = (data ?? []).map((s) => ({
    id: s.id as string,
    name: s.nombre as string,
    description: s.descripcion as string,
    premium: (s.es_premium ?? false) as boolean,
    tools: undefined,
  }));

  return <Services services={services} />;
}
