-- ================================================================
-- Vāk Devi — Bloqueos de agenda: rangos de fechas y de horario
-- Migración: 004_blocked_dates_ranges.sql
-- Ejecutar manualmente en Supabase Studio → SQL Editor
-- PREREQUISITO: 001, 002 y 003 ya ejecutadas
-- ================================================================


-- ================================================================
-- BLOQUE 1 — AMPLIAR: blocked_dates
--
-- Antes: una fila = un día completo bloqueado (columna "fecha" única).
-- Ahora una fila puede representar dos cosas distintas:
--   • Bloqueo de días completos: hora_inicio/hora_fin nulos,
--     "fecha" … "fecha_fin" es el rango (un solo día si son iguales).
--   • Bloqueo de horario: hora_inicio/hora_fin no nulos,
--     siempre de un único día (fecha = fecha_fin).
-- ================================================================

-- Backfill: las filas existentes son bloqueos de un solo día.
alter table public.blocked_dates add column if not exists fecha_fin date;
update public.blocked_dates set fecha_fin = fecha where fecha_fin is null;
alter table public.blocked_dates alter column fecha_fin set not null;

alter table public.blocked_dates add column if not exists hora_inicio time;
alter table public.blocked_dates add column if not exists hora_fin time;

-- Ya no es "un día = una fila" (puede haber varios bloqueos de horario
-- el mismo día, o un rango que empieza en un día ya bloqueado).
alter table public.blocked_dates drop constraint if exists blocked_dates_fecha_key;

alter table public.blocked_dates
  add constraint blocked_dates_rango_valido check (fecha_fin >= fecha);

-- Un bloqueo "de horario" (hora_inicio/hora_fin no nulos) es siempre
-- de un solo día — para varios días se usan bloqueos de día completo.
alter table public.blocked_dates
  add constraint blocked_dates_horario_valido check (
    (hora_inicio is null and hora_fin is null)
    or (hora_inicio is not null and hora_fin is not null
        and hora_inicio < hora_fin and fecha = fecha_fin)
  );

comment on column public.blocked_dates.fecha is
  'Fecha de inicio del bloqueo (o el único día, si es un bloqueo de horario).';
comment on column public.blocked_dates.fecha_fin is
  'Fecha de fin del bloqueo (inclusive). Igual a "fecha" en bloqueos de un solo día.';
comment on column public.blocked_dates.hora_inicio is
  'NULL = bloqueo de día(s) completo(s). No nulo = bloqueo de horario dentro de "fecha".';
comment on column public.blocked_dates.hora_fin is
  'Ver hora_inicio.';
