-- ================================================================
-- Vāk Devi — Servicios en promoción
-- Migración: 006_servicios_promo.sql
-- Ejecutar manualmente en Supabase Studio → SQL Editor
-- PREREQUISITO: 001 a 005 ya ejecutadas
-- ================================================================

alter table public.services
  add column if not exists is_promo boolean not null default false;

comment on column public.services.is_promo is
  'TRUE = el servicio se muestra en el bloque "Promociones" de la landing '
  '(y solo ahí, no en la lista normal). FALSE = posición habitual.';


-- ----------------------------------------------------------------
-- RLS / permisos — sin cambios necesarios.
--
-- Las políticas de "services" (001_init.sql) son a nivel de FILA, no de
-- columna: "services_select_public" (anon/authenticated, activo = true) y
-- "services_all_authenticated". Una columna nueva queda cubierta por ellas
-- automáticamente. Además, la landing y el panel leen/escriben con
-- createAdminClient() (service role), que no pasa por RLS. No existen
-- vistas sobre "services" que haya que actualizar.
-- ----------------------------------------------------------------
