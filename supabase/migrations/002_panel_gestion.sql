-- ================================================================
-- Vāk Devi — Panel de Gestión de Consultoría
-- Migración: 002_panel_gestion.sql
-- Ejecutar manualmente en Supabase Studio → SQL Editor
-- PREREQUISITO: 001_init.sql ya ejecutada y con los 6 servicios
-- ================================================================


-- ================================================================
-- BLOQUE 1 — SERVICIOS: campo precio_mxn (solo uso interno admin)
--
-- ⚠️  POLÍTICA DEL SITIO: este campo es CONFIDENCIAL.
--     Nunca debe aparecer en la landing pública (/), en el flujo
--     de agendado (/agendar) ni en ninguna API pública.
--     Solo se consume dentro del panel /admin mediante el cliente
--     service_role (servidor).  Los componentes públicos solo
--     seleccionan: nombre, descripcion, duracion_minutos, es_premium.
-- ================================================================
alter table public.services
  add column if not exists precio_mxn numeric(10, 2);

comment on column public.services.precio_mxn is
  'USO INTERNO — precio por sesión en MXN. '
  'NUNCA exponer en landing, /agendar ni APIs públicas. '
  'Solo visible en /admin vía service_role.';


-- ================================================================
-- BLOQUE 2 — PRECIOS reales de los 6 servicios
--
-- Referencia de mercado: psicoterapia privada en Mérida, México 2026.
-- EQ-i 2.0 incluye test + informe + sesión de interpretación.
-- ================================================================
update public.services
  set precio_mxn = 900.00
  where nombre ilike 'Psicoterapia%';

update public.services
  set precio_mxn = 850.00
  where nombre ilike 'Coaching%';

update public.services
  set precio_mxn = 1000.00
  where nombre ilike 'Acompañamiento%';

update public.services
  set precio_mxn = 600.00
  where nombre ilike 'Talleres%';

-- EQ-i 2.0: servicio premium certificado — precio más alto del catálogo
update public.services
  set precio_mxn = 3500.00
  where nombre ilike 'Evaluación%';

update public.services
  set precio_mxn = 850.00
  where nombre ilike 'Reconexión%';


-- ================================================================
-- BLOQUE 3 — APPOINTMENTS: ampliar los estados permitidos
--
-- Se añaden dos estados nuevos al CHECK constraint:
--   'completed' → sesión celebrada (cuenta para facturación)
--   'no_show'   → el cliente no se presentó (no genera ingreso)
--
-- Solo las citas con estado 'completed' se suman a la facturación.
-- ================================================================

-- Eliminar el CHECK anterior (generado inline en 001_init.sql).
-- Nombre auto-asignado por PostgreSQL: appointments_estado_check
alter table public.appointments
  drop constraint if exists appointments_estado_check;

-- Nuevo CHECK con los 5 estados del ciclo de vida completo
alter table public.appointments
  add constraint appointments_estado_check
  check (estado in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));


-- ================================================================
-- BLOQUE 4 — APPOINTMENTS: campo notas_internas (privado)
--
-- Notas de la terapeuta sobre la sesión o el cliente.
-- Solo visible dentro del panel /admin — nunca llega al cliente.
-- ================================================================
alter table public.appointments
  add column if not exists notas_internas text;

comment on column public.appointments.notas_internas is
  'Notas privadas de la terapeuta sobre la sesión. '
  'Visible solo en /admin. Nunca se expone al cliente.';


-- ================================================================
-- BLOQUE 5 — NUEVA TABLA: client_notes
--
-- CRM ligero: notas generales de la terapeuta por cliente (email).
-- AVISO LFPDPPP: esta tabla contiene datos personales sujetos a
-- la Ley Federal de Protección de Datos Personales en Posesión
-- de Particulares. Tratar con confidencialidad y reserva absoluta.
-- ================================================================
create table if not exists public.client_notes (
  id             uuid        primary key default gen_random_uuid(),
  email_cliente  text        not null unique,
  nombre_cliente text,                            -- denormalizado para búsqueda rápida
  notas          text,
  actualizado_en timestamptz not null default now()
);

comment on table public.client_notes is
  'CRM: notas privadas de la terapeuta por cliente (email único). '
  'LFPDPPP — datos personales confidenciales. Solo acceso autenticado.';


-- ================================================================
-- BLOQUE 6 — NUEVA TABLA: blocked_dates
--
-- Días completos marcados como no disponibles (vacaciones, festivos,
-- formación, etc.). La ruta /api/slots los excluirá al calcular
-- la disponibilidad para el flujo de agendado.
-- ================================================================
create table if not exists public.blocked_dates (
  id        uuid        primary key default gen_random_uuid(),
  fecha     date        not null unique,
  motivo    text,                                 -- opcional, p.ej. "Vacaciones", "INAP"
  creado_en timestamptz not null default now()
);

comment on table public.blocked_dates is
  'Días completos bloqueados para citas. '
  'Leídos por /api/slots para excluirlos del calendario de agendado.';


-- ================================================================
-- BLOQUE 7 — RLS: políticas para las tablas nuevas
-- ================================================================

alter table public.client_notes  enable row level security;
alter table public.blocked_dates enable row level security;

-- client_notes: acceso exclusivo para terapeuta autenticada
create policy "client_notes_all_authenticated"
  on public.client_notes for all
  to authenticated
  using (true) with check (true);

-- blocked_dates: anon y autenticado pueden leer (para /agendar),
-- solo autenticado puede escribir
create policy "blocked_dates_select_public"
  on public.blocked_dates for select
  to anon, authenticated
  using (true);

create policy "blocked_dates_write_authenticated"
  on public.blocked_dates for all
  to authenticated
  using (true) with check (true);


-- ================================================================
-- BLOQUE 8 — ÍNDICE: actualizar índice de disponibilidad
--
-- El índice original usa "estado <> 'cancelled'" para las consultas
-- de disponibilidad. Con los nuevos estados, queremos que solo
-- 'pending' y 'confirmed' bloqueen huecos futuros.
-- Dropeamos y recreamos con la condición más precisa.
-- ================================================================
drop index if exists idx_appointments_fecha_activas;

create index idx_appointments_fecha_activas
  on public.appointments(fecha)
  where estado in ('pending', 'confirmed');


-- ================================================================
-- BLOQUE 9 — DATOS: citas de las últimas 6 semanas (25 may–1 jul)
--
-- Generan historial realista para que los dashboards, gráficos
-- y métricas muestren números significativos desde el primer día.
-- ~125 sesiones completadas + algunas canceladas y no_show.
-- PUEDES eliminar estas filas cuando arranques con clientes reales
-- (DELETE FROM appointments WHERE email_cliente LIKE '%@example.com').
-- ================================================================
do $$
declare
  sid_psico  uuid;
  sid_coach  uuid;
  sid_crisis uuid;
  sid_taller uuid;
  sid_eqi    uuid;
  sid_espiri uuid;
begin
  select id into sid_psico  from public.services where nombre ilike 'Psicoterapia%';
  select id into sid_coach  from public.services where nombre ilike 'Coaching%';
  select id into sid_crisis from public.services where nombre ilike 'Acompañamiento%';
  select id into sid_taller from public.services where nombre ilike 'Talleres%';
  select id into sid_eqi    from public.services where nombre ilike 'Evaluación%';
  select id into sid_espiri from public.services where nombre ilike 'Reconexión%';

  insert into public.appointments
    (service_id, fecha, hora_inicio, hora_fin,
     nombre_cliente, email_cliente, telefono_cliente, estado)
  values

  -- ── SEMANA 1: 25–29 mayo 2026 ─────────────────────────────────

  -- Lunes 26 may
  (sid_psico,  '2026-05-25', '09:00', '10:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_coach,  '2026-05-25', '10:00', '11:00', 'Carlos Méndez',     'carlos@example.com',    '9997654321', 'completed'),
  (sid_psico,  '2026-05-25', '11:00', '12:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_espiri, '2026-05-25', '16:00', '17:00', 'Sofía Ramírez',     'sofia@example.com',     '9994567890', 'completed'),
  (sid_psico,  '2026-05-25', '17:00', '18:00', 'Tomás Guerrero',    'tomas@example.com',     '9996543210', 'completed'),

  -- Martes 27 may
  (sid_psico,  '2026-05-26', '09:00', '10:00', 'Valeria Cruz',      'valeria@example.com',   '9995678901', 'completed'),
  (sid_eqi,    '2026-05-26', '10:00', '11:30', 'Ana Torres',        'ana@example.com',       '9992345678', 'completed'),
  (sid_psico,  '2026-05-26', '12:00', '13:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'completed'),
  (sid_coach,  '2026-05-26', '16:00', '17:00', 'Rodrigo Ávila',     'rodrigo@example.com',   '9994321098', 'completed'),

  -- Miércoles 28 may
  (sid_psico,  '2026-05-27', '09:00', '10:00', 'Miguel Herrera',    'miguel@example.com',    '9996789012', 'completed'),
  (sid_crisis, '2026-05-27', '10:00', '11:00', 'Roberto Díaz',      'roberto@example.com',   '9998765432', 'completed'),
  (sid_coach,  '2026-05-27', '12:00', '13:00', 'Isabella Morales',  'isabella@example.com',  '9991357924', 'completed'),
  (sid_psico,  '2026-05-27', '15:00', '16:00', 'Carmen Espinoza',   'carmen@example.com',    '9993210987', 'completed'),
  (sid_espiri, '2026-05-27', '17:00', '18:00', 'Natalia Bello',     'natalia@example.com',   '9997891234', 'completed'),

  -- Jueves 29 may
  (sid_psico,  '2026-05-28', '09:00', '10:00', 'Fernando Leal',     'fernando@example.com',  '9990123456', 'completed'),
  (sid_psico,  '2026-05-28', '10:00', '11:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_eqi,    '2026-05-28', '11:00', '12:30', 'Gabriela Ruiz',     'gabriela@example.com',  '9993571468', 'completed'),
  (sid_psico,  '2026-05-28', '16:00', '17:00', 'Lucía Pedraza',     'lucia@example.com',     '9995432109', 'completed'),

  -- Viernes 30 may
  (sid_taller, '2026-05-29', '10:00', '12:00', 'Paola Castillo',    'paola@example.com',     '9998901234', 'completed'),
  (sid_psico,  '2026-05-29', '09:00', '10:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_psico,  '2026-05-29', '12:00', '13:00', 'Tomás Guerrero',    'tomas@example.com',     '9996543210', 'completed'),
  (sid_espiri, '2026-05-29', '17:00', '18:00', 'Héctor Villanueva', 'hector@example.com',    '9992109876', 'completed'),

  -- ── SEMANA 2: 1–5 junio 2026 ──────────────────────────────────

  -- Lunes 1 jun
  (sid_psico,  '2026-06-01', '09:00', '10:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_espiri, '2026-06-01', '10:00', '11:00', 'Sofía Ramírez',     'sofia@example.com',     '9994567890', 'completed'),
  (sid_psico,  '2026-06-01', '11:00', '12:00', 'Valeria Cruz',      'valeria@example.com',   '9995678901', 'completed'),
  (sid_coach,  '2026-06-01', '15:00', '16:00', 'Rodrigo Ávila',     'rodrigo@example.com',   '9994321098', 'completed'),
  (sid_psico,  '2026-06-01', '17:00', '18:00', 'Tomás Guerrero',    'tomas@example.com',     '9996543210', 'completed'),

  -- Martes 2 jun
  (sid_psico,  '2026-06-02', '09:00', '10:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'completed'),
  (sid_crisis, '2026-06-02', '10:00', '11:00', 'Roberto Díaz',      'roberto@example.com',   '9998765432', 'completed'),
  (sid_psico,  '2026-06-02', '11:00', '12:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_eqi,    '2026-06-02', '15:00', '16:30', 'Ana Torres',        'ana@example.com',       '9992345678', 'completed'),

  -- Miércoles 3 jun
  (sid_psico,  '2026-06-03', '09:00', '10:00', 'Miguel Herrera',    'miguel@example.com',    '9996789012', 'completed'),
  (sid_psico,  '2026-06-03', '10:00', '11:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_coach,  '2026-06-03', '12:00', '13:00', 'Isabella Morales',  'isabella@example.com',  '9991357924', 'completed'),
  (sid_psico,  '2026-06-03', '16:00', '17:00', 'Carmen Espinoza',   'carmen@example.com',    '9993210987', 'completed'),
  (sid_espiri, '2026-06-03', '17:00', '18:00', 'Natalia Bello',     'natalia@example.com',   '9997891234', 'completed'),

  -- Jueves 4 jun
  (sid_psico,  '2026-06-04', '09:00', '10:00', 'Fernando Leal',     'fernando@example.com',  '9990123456', 'completed'),
  (sid_psico,  '2026-06-04', '10:00', '11:00', 'Lucía Pedraza',     'lucia@example.com',     '9995432109', 'completed'),
  (sid_coach,  '2026-06-04', '11:00', '12:00', 'Carlos Méndez',     'carlos@example.com',    '9997654321', 'completed'),
  (sid_psico,  '2026-06-04', '16:00', '17:00', 'Valeria Cruz',      'valeria@example.com',   '9995678901', 'completed'),

  -- Viernes 5 jun
  (sid_taller, '2026-06-05', '10:00', '12:00', 'Paola Castillo',    'paola@example.com',     '9998901234', 'completed'),
  (sid_psico,  '2026-06-05', '09:00', '10:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_psico,  '2026-06-05', '12:00', '13:00', 'Tomás Guerrero',    'tomas@example.com',     '9996543210', 'completed'),
  (sid_espiri, '2026-06-05', '16:00', '17:00', 'Héctor Villanueva', 'hector@example.com',    '9992109876', 'completed'),
  (sid_psico,  '2026-06-05', '17:00', '18:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'no_show'),

  -- ── SEMANA 3: 8–12 junio 2026 ─────────────────────────────────

  -- Lunes 8 jun
  (sid_psico,  '2026-06-08', '09:00', '10:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_psico,  '2026-06-08', '10:00', '11:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'completed'),
  (sid_eqi,    '2026-06-08', '11:00', '12:30', 'Gabriela Ruiz',     'gabriela@example.com',  '9993571468', 'completed'),
  (sid_coach,  '2026-06-08', '15:00', '16:00', 'Rodrigo Ávila',     'rodrigo@example.com',   '9994321098', 'completed'),
  (sid_psico,  '2026-06-08', '17:00', '18:00', 'Carmen Espinoza',   'carmen@example.com',    '9993210987', 'completed'),

  -- Martes 9 jun
  (sid_psico,  '2026-06-09', '09:00', '10:00', 'Miguel Herrera',    'miguel@example.com',    '9996789012', 'completed'),
  (sid_crisis, '2026-06-09', '10:00', '11:00', 'Roberto Díaz',      'roberto@example.com',   '9998765432', 'completed'),
  (sid_psico,  '2026-06-09', '11:00', '12:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_espiri, '2026-06-09', '16:00', '17:00', 'Sofía Ramírez',     'sofia@example.com',     '9994567890', 'completed'),
  (sid_psico,  '2026-06-09', '17:00', '18:00', 'Lucía Pedraza',     'lucia@example.com',     '9995432109', 'completed'),

  -- Miércoles 10 jun
  (sid_psico,  '2026-06-10', '09:00', '10:00', 'Fernando Leal',     'fernando@example.com',  '9990123456', 'completed'),
  (sid_coach,  '2026-06-10', '10:00', '11:00', 'Carlos Méndez',     'carlos@example.com',    '9997654321', 'completed'),
  (sid_psico,  '2026-06-10', '11:00', '12:00', 'Valeria Cruz',      'valeria@example.com',   '9995678901', 'completed'),
  (sid_psico,  '2026-06-10', '16:00', '17:00', 'Tomás Guerrero',    'tomas@example.com',     '9996543210', 'completed'),
  (sid_espiri, '2026-06-10', '17:00', '18:00', 'Natalia Bello',     'natalia@example.com',   '9997891234', 'completed'),

  -- Jueves 11 jun
  (sid_psico,  '2026-06-11', '09:00', '10:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_taller, '2026-06-11', '10:00', '12:00', 'Isabella Morales',  'isabella@example.com',  '9991357924', 'completed'),
  (sid_psico,  '2026-06-11', '12:00', '13:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'completed'),
  (sid_coach,  '2026-06-11', '16:00', '17:00', 'Andrés Moreno',     'andres@example.com',    '9992468013', 'completed'),

  -- Viernes 12 jun
  (sid_psico,  '2026-06-12', '09:00', '10:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_eqi,    '2026-06-12', '10:00', '11:30', 'Ana Torres',        'ana@example.com',       '9992345678', 'completed'),
  (sid_psico,  '2026-06-12', '12:00', '13:00', 'Lucía Pedraza',     'lucia@example.com',     '9995432109', 'completed'),
  (sid_crisis, '2026-06-12', '16:00', '17:00', 'Héctor Villanueva', 'hector@example.com',    '9992109876', 'completed'),
  (sid_psico,  '2026-06-12', '17:00', '18:00', 'Carmen Espinoza',   'carmen@example.com',    '9993210987', 'cancelled'),

  -- ── SEMANA 4: 15–19 junio 2026 ────────────────────────────────

  -- Lunes 15 jun
  (sid_psico,  '2026-06-15', '09:00', '10:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_psico,  '2026-06-15', '10:00', '11:00', 'Valeria Cruz',      'valeria@example.com',   '9995678901', 'completed'),
  (sid_coach,  '2026-06-15', '11:00', '12:00', 'Carlos Méndez',     'carlos@example.com',    '9997654321', 'completed'),
  (sid_espiri, '2026-06-15', '15:00', '16:00', 'Sofía Ramírez',     'sofia@example.com',     '9994567890', 'completed'),
  (sid_psico,  '2026-06-15', '17:00', '18:00', 'Tomás Guerrero',    'tomas@example.com',     '9996543210', 'completed'),

  -- Martes 16 jun
  (sid_psico,  '2026-06-16', '09:00', '10:00', 'Miguel Herrera',    'miguel@example.com',    '9996789012', 'completed'),
  (sid_psico,  '2026-06-16', '10:00', '11:00', 'Fernando Leal',     'fernando@example.com',  '9990123456', 'completed'),
  (sid_eqi,    '2026-06-16', '11:00', '12:30', 'Gabriela Ruiz',     'gabriela@example.com',  '9993571468', 'completed'),
  (sid_psico,  '2026-06-16', '15:00', '16:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'completed'),
  (sid_coach,  '2026-06-16', '17:00', '18:00', 'Rodrigo Ávila',     'rodrigo@example.com',   '9994321098', 'completed'),

  -- Miércoles 17 jun
  (sid_psico,  '2026-06-17', '09:00', '10:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_psico,  '2026-06-17', '10:00', '11:00', 'Lucía Pedraza',     'lucia@example.com',     '9995432109', 'completed'),
  (sid_crisis, '2026-06-17', '11:00', '12:00', 'Roberto Díaz',      'roberto@example.com',   '9998765432', 'completed'),
  (sid_espiri, '2026-06-17', '16:00', '17:00', 'Natalia Bello',     'natalia@example.com',   '9997891234', 'completed'),
  (sid_psico,  '2026-06-17', '17:00', '18:00', 'Carmen Espinoza',   'carmen@example.com',    '9993210987', 'completed'),

  -- Jueves 18 jun
  (sid_psico,  '2026-06-18', '09:00', '10:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_taller, '2026-06-18', '10:00', '12:00', 'Paola Castillo',    'paola@example.com',     '9998901234', 'completed'),
  (sid_coach,  '2026-06-18', '12:00', '13:00', 'Carlos Méndez',     'carlos@example.com',    '9997654321', 'completed'),
  (sid_psico,  '2026-06-18', '16:00', '17:00', 'Valeria Cruz',      'valeria@example.com',   '9995678901', 'completed'),
  (sid_psico,  '2026-06-18', '17:00', '18:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'no_show'),

  -- Viernes 19 jun
  (sid_psico,  '2026-06-19', '09:00', '10:00', 'Fernando Leal',     'fernando@example.com',  '9990123456', 'completed'),
  (sid_psico,  '2026-06-19', '10:00', '11:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_espiri, '2026-06-19', '11:00', '12:00', 'Sofía Ramírez',     'sofia@example.com',     '9994567890', 'completed'),
  (sid_coach,  '2026-06-19', '15:00', '16:00', 'Andrés Moreno',     'andres@example.com',    '9992468013', 'completed'),
  (sid_psico,  '2026-06-19', '17:00', '18:00', 'Tomás Guerrero',    'tomas@example.com',     '9996543210', 'completed'),

  -- ── SEMANA 5: 22–26 junio 2026 ────────────────────────────────

  -- Lunes 22 jun
  (sid_psico,  '2026-06-22', '09:00', '10:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_psico,  '2026-06-22', '10:00', '11:00', 'Miguel Herrera',    'miguel@example.com',    '9996789012', 'completed'),
  (sid_eqi,    '2026-06-22', '11:00', '12:30', 'Ana Torres',        'ana@example.com',       '9992345678', 'completed'),
  (sid_psico,  '2026-06-22', '15:00', '16:00', 'Lucía Pedraza',     'lucia@example.com',     '9995432109', 'completed'),
  (sid_espiri, '2026-06-22', '17:00', '18:00', 'Héctor Villanueva', 'hector@example.com',    '9992109876', 'completed'),

  -- Martes 23 jun
  (sid_psico,  '2026-06-23', '09:00', '10:00', 'Valeria Cruz',      'valeria@example.com',   '9995678901', 'completed'),
  (sid_coach,  '2026-06-23', '10:00', '11:00', 'Carlos Méndez',     'carlos@example.com',    '9997654321', 'completed'),
  (sid_psico,  '2026-06-23', '11:00', '12:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'completed'),
  (sid_crisis, '2026-06-23', '16:00', '17:00', 'Roberto Díaz',      'roberto@example.com',   '9998765432', 'completed'),
  (sid_psico,  '2026-06-23', '17:00', '18:00', 'Carmen Espinoza',   'carmen@example.com',    '9993210987', 'no_show'),

  -- Miércoles 24 jun
  (sid_psico,  '2026-06-24', '09:00', '10:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_psico,  '2026-06-24', '10:00', '11:00', 'Fernando Leal',     'fernando@example.com',  '9990123456', 'completed'),
  (sid_taller, '2026-06-24', '11:00', '13:00', 'Isabella Morales',  'isabella@example.com',  '9991357924', 'completed'),
  (sid_espiri, '2026-06-24', '15:00', '16:00', 'Sofía Ramírez',     'sofia@example.com',     '9994567890', 'completed'),
  (sid_psico,  '2026-06-24', '17:00', '18:00', 'Tomás Guerrero',    'tomas@example.com',     '9996543210', 'completed'),

  -- Jueves 25 jun
  (sid_psico,  '2026-06-25', '09:00', '10:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_eqi,    '2026-06-25', '10:00', '11:30', 'Gabriela Ruiz',     'gabriela@example.com',  '9993571468', 'completed'),
  (sid_psico,  '2026-06-25', '12:00', '13:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'completed'),
  (sid_coach,  '2026-06-25', '16:00', '17:00', 'Rodrigo Ávila',     'rodrigo@example.com',   '9994321098', 'completed'),
  (sid_psico,  '2026-06-25', '17:00', '18:00', 'Lucía Pedraza',     'lucia@example.com',     '9995432109', 'cancelled'),

  -- Viernes 26 jun
  (sid_psico,  '2026-06-26', '09:00', '10:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_psico,  '2026-06-26', '10:00', '11:00', 'Valeria Cruz',      'valeria@example.com',   '9995678901', 'completed'),
  (sid_espiri, '2026-06-26', '11:00', '12:00', 'Natalia Bello',     'natalia@example.com',   '9997891234', 'completed'),
  (sid_crisis, '2026-06-26', '15:00', '16:00', 'Héctor Villanueva', 'hector@example.com',    '9992109876', 'completed'),
  (sid_coach,  '2026-06-26', '17:00', '18:00', 'Carlos Méndez',     'carlos@example.com',    '9997654321', 'completed'),

  -- ── SEMANA 6 parcial: 29–30 junio 2026 ───────────────────────

  -- Lunes 29 jun
  (sid_psico,  '2026-06-29', '09:00', '10:00', 'María González',    'maria@example.com',     '9991234567', 'completed'),
  (sid_coach,  '2026-06-29', '10:00', '11:00', 'Carlos Méndez',     'carlos@example.com',    '9997654321', 'completed'),
  (sid_psico,  '2026-06-29', '11:00', '12:00', 'Miguel Herrera',    'miguel@example.com',    '9996789012', 'completed'),
  (sid_psico,  '2026-06-29', '15:00', '16:00', 'Daniela Vega',      'daniela@example.com',   '9990987654', 'completed'),
  (sid_espiri, '2026-06-29', '17:00', '18:00', 'Sofía Ramírez',     'sofia@example.com',     '9994567890', 'completed'),

  -- Martes 30 jun
  (sid_psico,  '2026-06-30', '09:00', '10:00', 'Laura Sánchez',     'laura@example.com',     '9993456789', 'completed'),
  (sid_eqi,    '2026-06-30', '10:00', '11:30', 'Ana Torres',        'ana@example.com',       '9992345678', 'completed'),
  (sid_psico,  '2026-06-30', '12:00', '13:00', 'Valeria Cruz',      'valeria@example.com',   '9995678901', 'completed'),
  (sid_crisis, '2026-06-30', '16:00', '17:00', 'Roberto Díaz',      'roberto@example.com',   '9998765432', 'completed'),

  -- ── HOY: miércoles 1 julio 2026 ───────────────────────────────

  -- Mañana: ya completadas
  (sid_psico,  '2026-07-01', '09:00', '10:00', 'Fernando Leal',     'fernando@example.com',  '9990123456', 'completed'),
  (sid_psico,  '2026-07-01', '10:00', '11:00', 'Lucía Pedraza',     'lucia@example.com',     '9995432109', 'completed'),
  -- Tarde: por suceder
  (sid_psico,  '2026-07-01', '11:00', '12:00', 'Carmen Espinoza',   'carmen@example.com',    '9993210987', 'confirmed'),
  (sid_coach,  '2026-07-01', '15:00', '16:00', 'Rodrigo Ávila',     'rodrigo@example.com',   '9994321098', 'confirmed'),
  (sid_psico,  '2026-07-01', '17:00', '18:00', 'Tomás Guerrero',    'tomas@example.com',     '9996543210', 'pending');

end;
$$;


-- ================================================================
-- BLOQUE 10 — DATOS: notas de clientes (CRM de ejemplo)
--
-- Notas internas realistas para clientes recurrentes.
-- Simulan el uso de la sección "Clientes" del panel desde el
-- primer día. Borrar o reemplazar con datos reales.
-- ================================================================
insert into public.client_notes (email_cliente, nombre_cliente, notas)
values
(
  'maria@example.com',
  'María González',
  'Proceso de duelo por separación (18 meses). Avances significativos en regulación emocional. Trabaja como maestra. Viene semanalmente desde enero. Le funcionan muy bien las técnicas de respiración y la escritura reflexiva. Familia de origen con patrones de apego ansioso.'
),
(
  'ana@example.com',
  'Ana Torres',
  'Completó la evaluación EQ-i 2.0 en mayo — puntuación destacada en empatía y relaciones interpersonales. Área de trabajo: gestión del estrés y flexibilidad. Continúa con coaching post-evaluación para integrar los resultados en su plan de desarrollo.'
),
(
  'roberto@example.com',
  'Roberto Díaz',
  'Acompañamiento en crisis tras pérdida laboral inesperada. Viene quincenal. Muestra resistencia inicial pero buena capacidad reflexiva. Explorar vocación y valores de carrera en próximas sesiones. Tiene red de apoyo familiar sólida.'
),
(
  'daniela@example.com',
  'Daniela Vega',
  'Proceso terapéutico por ansiedad generalizada. Trabaja en empresa de logística (alto estrés). Una no-asistencia sin aviso en junio — aclarado después, hubo emergencia familiar. Retomó sin inconvenientes. Responde bien al enfoque cognitivo-conductual.'
),
(
  'laura@example.com',
  'Laura Sánchez',
  'Cliente desde febrero. Proceso de autoestima y límites relacionales. Historial de relaciones emocionalmente dependientes. Progreso notable: empezó a identificar patrones repetitivos. Próxima meta: explorar la narrativa de "no soy suficiente" con EMDR básico.'
),
(
  'sofia@example.com',
  'Sofía Ramírez',
  'Sesiones de inteligencia espiritual y meditación. Interesada en Eneagrama (tipo 4). Practica yoga por su cuenta. Viene en momentos de búsqueda de sentido, sin crisis aguda. Buen nivel de introspección. Espacio más contemplativo que terapéutico.'
),
(
  'gabriela@example.com',
  'Gabriela Ruiz',
  'Perfil ejecutivo — gerente de RRHH. Evaluación EQ-i para desarrollo profesional. Resultados: fortaleza en asertividad y autoexpresión emocional; área de crecimiento en manejo del impulso. Muy analítica, prefiere marcos conceptuales antes de las intervenciones.'
),
(
  'miguel@example.com',
  'Miguel Herrera',
  'Proceso por conflictos de pareja y comunicación. Viene solo (la pareja no quiso participar). Avance en reconocimiento de patrones propios. Trabaja en construcción — jornadas largas, poco tiempo para sí mismo. Sesiones quincenales por agenda.'
);
