// Server-side date helpers — America/Merida timezone
const TZ = "America/Merida";

export function getTodayMerida(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function getWeekStart(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return fmtDate(date);
}

export function getWeekEnd(fecha: string): string {
  const start = getWeekStart(fecha);
  const [y, m, d] = start.split("-").map(Number);
  return fmtDate(new Date(y, m - 1, d + 4));
}

export function getMonthStart(fecha: string): string {
  return fecha.slice(0, 7) + "-01";
}

export function addDays(fecha: string, n: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return fmtDate(new Date(y, m - 1, d + n));
}

export function subtractDays(fecha: string, days: number): string {
  return addDays(fecha, -days);
}

// Lunes de la semana de CALENDARIO (7 días completos, lunes–domingo) que
// contiene "fecha" — distinta de getWeekStart, que es la semana LABORAL
// (lunes–viernes) usada por countWorkingDays. No la reutiliza a propósito:
// aunque el cálculo del lunes es el mismo, mantenerlas separadas evita que
// un cambio futuro en la semántica de una rompa a la otra.
export function getCalendarWeekStart(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return fmtDate(date);
}

// Grid completo de un mes para una vista de calendario: un array de
// semanas (lunes–domingo), cada una con 7 fechas ISO, incluyendo los días
// de relleno del mes anterior/siguiente necesarios para completar la
// primera y última semana. "month" es 0-based (0 = enero), igual que
// Date.getMonth().
export function getMonthGrid(year: number, month: number): string[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lastDateStr = fmtDate(new Date(year, month, daysInMonth));

  let weekStart = getCalendarWeekStart(fmtDate(new Date(year, month, 1)));
  const weeks: string[][] = [];
  while (true) {
    const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    weeks.push(week);
    if (week.includes(lastDateStr)) break;
    weekStart = addDays(weekStart, 7);
  }
  return weeks;
}

// Forma mínima de una fila de blocked_dates que necesita esta función —
// evita importar el tipo BlockedDate de un page.tsx dentro de una lib.
export type BlockedDateLike = {
  fecha: string;
  fecha_fin: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  motivo: string | null;
};

export type DateBlockInfo = {
  bloqueoTotal: boolean;
  motivoTotal: string | null;
  bloqueosParciales: { horaInicio: string; horaFin: string; motivo: string | null }[];
};

// Resuelve, para una fecha dada, si algún bloqueo de blocked_dates la
// cubre — distinguiendo bloqueo de día completo (hora_inicio NULL) de
// bloqueo de horario parcial (hora_inicio/hora_fin con valor, siempre de
// un único día). Pura, sin acceso a Supabase; reutilizable por Mes, y por
// Semana/Día en la Fase 4C.
export function getDateBlockInfo(fecha: string, blockedDates: BlockedDateLike[]): DateBlockInfo {
  const matches = blockedDates.filter((b) => fecha >= b.fecha && fecha <= b.fecha_fin);
  const totalBlock = matches.find((b) => b.hora_inicio === null) ?? null;
  const bloqueosParciales = matches
    .filter((b) => b.hora_inicio !== null)
    .map((b) => ({
      horaInicio: b.hora_inicio as string,
      horaFin: b.hora_fin as string,
      motivo: b.motivo,
    }));

  return {
    bloqueoTotal: totalBlock !== null,
    motivoTotal: totalBlock?.motivo ?? null,
    bloqueosParciales,
  };
}

export function countWorkingDays(from: string, to: string, workingDays: number[]): number {
  let count = 0;
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const start = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  const cur = new Date(start);
  while (cur <= end) {
    const jsDay = cur.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    if (workingDays.includes(isoDay)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
