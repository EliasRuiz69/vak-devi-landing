// Convención única de etiqueta/color por estado de cita — antes duplicada
// en CitasClient.tsx (con borde) y dashboard/page.tsx (sin borde). Los
// valores bg/text son idénticos en ambos; el borde solo se ve donde el
// markup ya aplica la utilidad `border` (Tailwind pone border-width:0 por
// defecto, así que border-color sin esa utilidad no se renderiza).
export const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

export const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  no_show: "bg-red-50 text-red-600 border-red-200",
};
