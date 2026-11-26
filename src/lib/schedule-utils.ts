export function parseTimeMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function formatTimeMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(time: string, minutes: number): string {
  return formatTimeMins(parseTimeMins(time) + minutes);
}

export function generateCandidateSlots(
  horaInicio: string,
  horaFin: string,
  blockMinutes: number,
  serviceDuration: number,
): string[] {
  const start = parseTimeMins(horaInicio.slice(0, 5));
  const end = parseTimeMins(horaFin.slice(0, 5));
  const slots: string[] = [];
  for (let t = start; t + serviceDuration <= end; t += blockMinutes) {
    slots.push(formatTimeMins(t));
  }
  return slots;
}

export function slotsOverlap(
  slotStartMins: number,
  slotDuration: number,
  apptStartMins: number,
  apptEndMins: number,
): boolean {
  return slotStartMins < apptEndMins && slotStartMins + slotDuration > apptStartMins;
}

// schedule_config.dias_laborables usa Lun=1 … Sáb=6 en ambas convenciones,
// pero el domingo aparece como 0 (lo guarda así el panel de Disponibilidad,
// Dom=0 … Sáb=6) o como 7 (ISO, valor por defecto de las migraciones).
// Se aceptan las dos para que el domingo no quede siempre cerrado.
export function isWorkingDay(date: Date, workingDays: number[]): boolean {
  const jsDay = date.getDay();
  if (jsDay === 0) return workingDays.includes(0) || workingDays.includes(7);
  return workingDays.includes(jsDay);
}

export function formatFechaLong(fecha: string): string {
  const [y, mo, d] = fecha.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
