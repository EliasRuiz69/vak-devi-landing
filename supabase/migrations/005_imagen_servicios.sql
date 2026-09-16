-- ================================================================
-- Vāk Devi — Imagen de servicios
-- Migración: 005_imagen_servicios.sql
-- Ejecutar manualmente en Supabase Studio → SQL Editor
-- PREREQUISITO: 001, 002, 003 y 004 ya ejecutadas
--
-- NOTA: esta migración documenta en SQL un cambio que YA fue aplicado
-- manualmente en producción (columna + bucket creados directamente en
-- Supabase Studio, ~septiembre 2026, antes de que existiera esta migración
-- versionada). Se añade aquí únicamente para dejar el repositorio
-- consistente con el patrón de 001/002/003/004 — usa IF NOT EXISTS, así
-- que es seguro volver a ejecutarla aunque la columna ya exista.
-- ================================================================

alter table public.services
  add column if not exists imagen_url text;

comment on column public.services.imagen_url is
  'URL pública completa de Supabase Storage (bucket "servicios") para la '
  'imagen del servicio. NULL = sin imagen asignada.';


-- ----------------------------------------------------------------
-- Bucket de Storage — SIN equivalente SQL versionable aquí.
--
-- El bucket público "servicios" se creó manualmente en Supabase Studio
-- (Storage → New bucket → público), aproximadamente en septiembre 2026,
-- junto con esta columna. La creación de buckets de Storage no forma
-- parte del esquema de Postgres que gestionan estas migraciones — si se
-- necesita recrear el entorno desde cero, hay que crear el bucket
-- "servicios" a mano en Supabase Studio y marcarlo como público antes de
-- subir imágenes desde /admin/servicios.
-- ----------------------------------------------------------------
