import type { DateBlockInfo } from "@/lib/admin-utils";
import type { ApptRow } from "./page";

// Agrupa, para una fecha, todo lo que Semana (7 columnas) y Día (1 columna)
// necesitan renderizar — evita repetir el filtrar+ordenar citas por día en
// ambos componentes. No incluye lógica de UI, solo el cálculo.
export type DayCalendarData = {
  fecha: string;
  appointments: ApptRow[];
  isWorking: boolean;
  blockInfo: DateBlockInfo;
};

export function getDayCalendarData(
  fecha: string,
  appointments: ApptRow[],
  blockInfo: DateBlockInfo,
  isWorking: boolean,
): DayCalendarData {
  const dayAppointments = appointments
    .filter((a) => a.fecha === fecha)
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  return { fecha, appointments: dayAppointments, isWorking, blockInfo };
}
