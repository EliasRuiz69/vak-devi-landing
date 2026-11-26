-- Datos sintéticos SOLO para el Supabase de TEST (vakdevi-test-api.ervia.tech).
-- NUNCA ejecutar en producción.
--
-- Se ejecuta después de las migraciones 001–008 (que ya cargan servicios de
-- ejemplo, el horario y citas pasadas) o después de copiar los servicios de
-- producción. Añade:
--   1. El servicio de la Primera Cita Virtual Exploratoria Gratuita (en
--      producción se creó desde el panel; aquí se replica para el agente).
--   2. Citas futuras y bloqueos en los 3 próximos días, dentro del horario de
--      producción (todos los días, 12:00–22:00), para probar la disponibilidad
--      que consulta el agente de WhatsApp.
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

-- 2. Citas y bloqueos en los 3 próximos días
do $$
declare
  d1 date; d2 date; d3 date;
  sid_psico uuid;
  sid_explo uuid;
begin
  d1 := current_date + 1;
  d2 := current_date + 2;
  d3 := current_date + 3;

  -- Primer servicio activo que no sea el exploratorio (vale tanto con los
  -- servicios de ejemplo de 001 como con los copiados de producción).
  select id into sid_psico from public.services
    where activo and nombre <> 'Primera Cita Virtual Exploratoria Gratuita'
    order by orden limit 1;
  select id into sid_explo from public.services where nombre = 'Primera Cita Virtual Exploratoria Gratuita';

  -- Día 1: dos citas ocupando 13:00–14:30
  insert into public.appointments
    (service_id, fecha, hora_inicio, hora_fin, nombre_cliente, email_cliente, telefono_cliente, estado, origen)
  values
    (sid_psico, d1, '13:00', '14:00', 'Cliente Prueba Uno', 'prueba1@example.com', '9990000001', 'confirmed', 'web'),
    (sid_explo, d1, '14:00', '14:30', 'Cliente Prueba Dos', 'prueba2@example.com', '9990000002', 'pending', 'admin');

  -- Día 2: bloqueo parcial de 15:00 a 17:00
  insert into public.blocked_dates (fecha, fecha_fin, hora_inicio, hora_fin, motivo)
  values (d2, d2, '15:00', '17:00', 'TEST — bloqueo parcial');

  -- Día 3: bloqueo de día completo
  insert into public.blocked_dates (fecha, fecha_fin, motivo)
  values (d3, d3, 'TEST — día completo bloqueado');

  raise notice 'Datos de prueba: citas el %, bloqueo parcial el %, día bloqueado el %', d1, d2, d3;
end $$;
