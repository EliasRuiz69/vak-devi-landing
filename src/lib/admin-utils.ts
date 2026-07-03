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

export function subtractDays(fecha: string, days: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return fmtDate(new Date(y, m - 1, d - days));
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
