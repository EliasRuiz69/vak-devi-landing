import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase-admin";
import DisponibilidadClient from "./DisponibilidadClient";

export const metadata: Metadata = {
  title: "Disponibilidad — Vāk Devi",
  robots: { index: false, follow: false },
};

export type ScheduleConfig = {
  id: string;
  dias_laborables: number[];
  hora_inicio: string;
  hora_fin: string;
  duracion_bloque_minutos: number;
};

export type BlockedDate = {
  id: string;
  fecha: string;
  motivo: string | null;
};

export default async function DisponibilidadPage() {
  const admin = createAdminClient();

  const [{ data: cfg }, { data: blocked }] = await Promise.all([
    admin.from("schedule_config").select("*").eq("activo", true).single(),
    admin.from("blocked_dates").select("id, fecha, motivo").order("fecha"),
  ]);

  const config: ScheduleConfig | null = cfg
    ? {
        id: cfg.id as string,
        dias_laborables: cfg.dias_laborables as number[],
        hora_inicio: (cfg.hora_inicio as string).slice(0, 5),
        hora_fin: (cfg.hora_fin as string).slice(0, 5),
        duracion_bloque_minutos: cfg.duracion_bloque_minutos as number,
      }
    : null;

  const blockedDates: BlockedDate[] = (blocked ?? []).map((b) => ({
    id: b.id as string,
    fecha: b.fecha as string,
    motivo: b.motivo as string | null,
  }));

  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-purple-3 mb-1">Gestión</p>
        <h1 className="font-serif text-3xl text-ink">Disponibilidad</h1>
        <p className="text-sm text-ink/45 mt-1">
          Configura horarios de trabajo y bloquea días de descanso o vacaciones.
        </p>
      </div>
      <DisponibilidadClient config={config} blockedDates={blockedDates} />
    </div>
  );
}
