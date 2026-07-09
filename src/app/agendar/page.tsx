import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { createAdminClient } from "@/lib/supabase-admin";
import BookingWizard from "./BookingWizard";

export const metadata: Metadata = {
  title: "Agendar cita — Vāk Devi",
  description:
    "Agenda tu cita con Vāk Devi. Elige tu servicio, fecha y horario en pocos pasos.",
};

export type ServiceRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracion_minutos: number;
  es_premium: boolean;
};

export type ScheduleConfig = {
  dias_laborables: number[];
  hora_inicio: string;
  hora_fin: string;
  duracion_bloque_minutos: number;
};

export default async function AgendarPage() {
  const admin = createAdminClient();

  const [{ data: services }, { data: config }] = await Promise.all([
    admin
      .from("services")
      .select("id, nombre, descripcion, duracion_minutos, es_premium")
      .eq("activo", true)
      .order("orden"),
    admin
      .from("schedule_config")
      .select("dias_laborables, hora_inicio, hora_fin, duracion_bloque_minutos")
      .eq("activo", true)
      .single(),
  ]);

  const scheduleConfig: ScheduleConfig = config ?? {
    dias_laborables: [1, 2, 3, 4, 5],
    hora_inicio: "09:00",
    hora_fin: "19:00",
    duracion_bloque_minutos: 60,
  };

  return (
    <div className="min-h-screen bg-lavender">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-ink/8 bg-white/70 px-6 py-4 backdrop-blur-sm sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <Logo className="h-9 w-9 transition-opacity group-hover:opacity-80" variant="purple" />
            <span className="font-serif text-base tracking-widest text-ink">VĀK DEVI</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-purple-2 transition-colors hover:text-purple-1"
          >
            × Cancelar
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-6 py-12 sm:px-10 lg:py-16">
        <div className="mb-10 flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.25em] text-purple-3">
            Sistema de agendado
          </p>
          <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">
            Agenda tu cita
          </h1>
          <p className="font-serif text-base leading-relaxed text-ink/60">
            Elige el servicio, la fecha y el horario que mejor se adapten a ti.
          </p>
        </div>

        <BookingWizard
          services={(services as ServiceRow[]) ?? []}
          scheduleConfig={scheduleConfig}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/8 px-6 py-8 text-center">
        <p className="text-xs tracking-wide text-ink/40">
          © {new Date().getFullYear()} Vāk Devi — Mérida, México
        </p>
      </footer>
    </div>
  );
}
