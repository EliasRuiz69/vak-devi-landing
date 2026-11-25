-- Datos sintéticos SOLO para el Supabase de TEST (vakdevi-test-api.ervia.tech).
-- NUNCA ejecutar en producción.
--
-- Se ejecuta después de las migraciones 001–008 (que ya cargan los 6 servicios,
-- el horario y citas pasadas de ejemplo). Añade:
--   1. El servicio de la Primera Cita Virtual Exploratoria Gratuita (en
--      producción se creó desde el panel; aquí se replica para el agente).
--   2. Citas futuras y bloqueos en los 3 próximos días laborables, para probar
--      la disponibilidad que consulta el agente de WhatsApp.
-- Las fechas son relativas al día en que se ejecuta. Idempotente en lo posible.

-- 1. Servicio exploratorio
insert into public.services (nombre, descripcion, duracion_minutos, es_premium, activo, orden)
select
  'Primera Cita Virtual Exploratoria Gratuita',
  'Sesión virtual gratuita para conocernos y valorar juntos cómo puedo acompañarte.',
  60, false, true, 0
where not exists (
  select 1 from public.services where nombre = 'Primera Cita Virtual Exploratoria Gratuita'
);

-- 2. Citas y bloqueos en los 3 próximos días laborables (lunes a viernes)
do $$
declare
  d1 date; d2 date; d3 date;
  sid_psico uuid;
  sid_explo uuid;
begin
  select d::date into d1 from generate_series(current_date + 1, current_date + 14, interval '1 day') d
    where extract(isodow from d) between 1 and 5 order by d limit 1;
  select d::date into d2 from generate_series(d1 + 1, d1 + 14, interval '1 day') d
    where extract(isodow from d) between 1 and 5 order by d limit 1;
  select d::date into d3 from generate_series(d2 + 1, d2 + 14, interval '1 day') d
    where extract(isodow from d) between 1 and 5 order by d limit 1;

  select id into sid_psico from public.services where nombre ilike 'Psicoterapia%' limit 1;
  select id into sid_explo from public.services where nombre = 'Primera Cita Virtual Exploratoria Gratuita';

  -- Día 1: dos citas ocupando 10:00–12:00
  insert into public.appointments
    (service_id, fecha, hora_inicio, hora_fin, nombre_cliente, email_cliente, telefono_cliente, estado, origen)
  values
    (sid_psico, d1, '10:00', '11:00', 'Cliente Prueba Uno', 'prueba1@example.com', '9990000001', 'confirmed', 'web'),
    (sid_explo, d1, '11:00', '12:00', 'Cliente Prueba Dos', 'prueba2@example.com', '9990000002', 'pending', 'admin');

  -- Día 2: bloqueo parcial de 12:00 a 14:00
  insert into public.blocked_dates (fecha, fecha_fin, hora_inicio, hora_fin, motivo)
  values (d2, d2, '12:00', '14:00', 'TEST — bloqueo parcial');

  -- Día 3: bloqueo de día completo
  insert into public.blocked_dates (fecha, fecha_fin, motivo)
  values (d3, d3, 'TEST — día completo bloqueado');

  raise notice 'Datos de prueba: citas el %, bloqueo parcial el %, día bloqueado el %', d1, d2, d3;
end $$;
