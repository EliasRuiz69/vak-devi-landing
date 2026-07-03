-- ================================================================
-- Vāk Devi — Sistema de agendado
-- Migración: 001_init.sql
-- Ejecutar manualmente en Supabase Studio → SQL Editor
-- ================================================================


-- ----------------------------------------------------------------
-- LIMPIEZA OPCIONAL: tabla "bookings" del prototipo anterior
-- Descomenta si quieres eliminarla (ya no se usa).
-- ----------------------------------------------------------------
-- drop table if exists public.bookings;


-- ================================================================
-- BLOQUE 1 — TABLA: services
-- Catálogo de los 6 servicios terapéuticos.
-- es_premium distingue el EQ-i 2.0 (certificado internacional)
-- del resto, para mostrar un badge visual diferenciado.
-- ================================================================
create table if not exists public.services (
  id               uuid        primary key default gen_random_uuid(),
  nombre           text        not null,
  descripcion      text,
  duracion_minutos integer     not null default 60,
  es_premium       boolean     not null default false,
  activo           boolean     not null default true,
  orden            integer     not null default 0,
  creado_en        timestamptz not null default now()
);


-- ================================================================
-- BLOQUE 2 — TABLA: schedule_config
-- Configura cuándo trabaja la terapeuta.
-- dias_laborables usa convención ISO 8601: 1=lunes … 7=domingo.
-- Solo debe existir UNA fila con activo=true en producción.
-- ================================================================
create table if not exists public.schedule_config (
  id                      uuid        primary key default gen_random_uuid(),
  dias_laborables         integer[]   not null default '{1,2,3,4,5}',
  hora_inicio             time        not null default '09:00',
  hora_fin                time        not null default '19:00',
  duracion_bloque_minutos integer     not null default 60,
  activo                  boolean     not null default true,
  actualizado_en          timestamptz not null default now()
);


-- ================================================================
-- BLOQUE 3 — TABLA: appointments
-- Citas reservadas. hora_fin se calcula y guarda al insertar
-- (hora_inicio + duracion del servicio seleccionado), lo que
-- simplifica enormemente las consultas de disponibilidad.
--
-- estado:
--   'pending'   → recién reservada, sin confirmar
--   'confirmed' → la terapeuta la confirmó
--   'cancelled' → cancelada (no bloquea el horario)
-- ================================================================
create table if not exists public.appointments (
  id               uuid        primary key default gen_random_uuid(),
  service_id       uuid        not null references public.services(id),
  fecha            date        not null,
  hora_inicio      time        not null,
  hora_fin         time        not null,
  nombre_cliente   text        not null,
  email_cliente    text        not null,
  telefono_cliente text        not null,
  motivo_consulta  text,
  estado           text        not null default 'pending'
                               check (estado in ('pending','confirmed','cancelled')),
  creado_en        timestamptz not null default now()
);

-- Índice para acelerar la consulta de disponibilidad por fecha.
-- El WHERE excluye canceladas para no bloquear huecos libres.
create index if not exists idx_appointments_fecha_activas
  on public.appointments(fecha)
  where estado <> 'cancelled';


-- ================================================================
-- BLOQUE 4 — ROW LEVEL SECURITY (RLS)
-- Funciona igual en self-hosted que en Supabase Cloud.
-- El servidor usa service_role_key (bypass RLS) para calcular
-- disponibilidad sin exponer datos personales de otras citas.
-- ================================================================
alter table public.services        enable row level security;
alter table public.schedule_config enable row level security;
alter table public.appointments    enable row level security;

-- ── services: lectura pública (necesaria para el flujo de agendado)
--              escritura solo para la terapeuta autenticada
create policy "services_select_public"
  on public.services for select
  to anon, authenticated
  using (activo = true);

create policy "services_all_authenticated"
  on public.services for all
  to authenticated
  using (true) with check (true);

-- ── schedule_config: lectura pública, escritura autenticada
create policy "schedule_select_public"
  on public.schedule_config for select
  to anon, authenticated
  using (true);

create policy "schedule_all_authenticated"
  on public.schedule_config for all
  to authenticated
  using (true) with check (true);

-- ── appointments:
--    • anon puede INSERTAR su propia cita (flujo de agendado)
--    • anon NO puede leer citas ajenas (privacidad)
--    • el servidor (service_role) bypass RLS para disponibilidad
--    • la terapeuta autenticada gestiona todo
create policy "appointments_insert_anon"
  on public.appointments for insert
  to anon
  with check (true);

create policy "appointments_all_authenticated"
  on public.appointments for all
  to authenticated
  using (true) with check (true);


-- ================================================================
-- BLOQUE 5 — DATOS: los 6 servicios reales de Vāk Devi
-- ================================================================
insert into public.services
  (nombre, descripcion, duracion_minutos, es_premium, orden)
values
(
  'Psicoterapia individual, de parejas y familiar',
  'Un espacio seguro y confidencial para explorar tus emociones, sanar heridas del pasado y desarrollar recursos internos que te permitan vivir con más plenitud y autenticidad.',
  60, false, 1
),
(
  'Coaching para el crecimiento personal',
  'Para quienes están en un momento de transición o búsqueda. Trabajamos juntos tus metas, valores y creencias para que puedas tomar decisiones desde quién realmente eres.',
  60, false, 2
),
(
  'Acompañamiento en crisis',
  'Cuando la vida parece desbordarse, tener un espacio de escucha y claridad puede marcar la diferencia. Sesiones de apoyo intensivo para momentos de quiebre o duelo.',
  60, false, 3
),
(
  'Talleres y grupos vivenciales',
  'Experiencias colectivas de autoconocimiento y crecimiento personal. Un lugar donde encontrarte con otros que también están aprendiendo a habitarse.',
  120, false, 4
),
(
  'Evaluación de Inteligencia Emocional EQ-i 2.0',
  'Un test certificado internacionalmente que mide 15 competencias de inteligencia emocional. Aplico el test, elaboro un informe detallado y te acompaño en una sesión para interpretarlos juntos y trazar un plan de crecimiento personal.',
  90, true, 5
),
(
  'Reconexión con tu inteligencia espiritual',
  'A través de un enfoque holístico e integrativo, exploramos juntos esa dimensión interior con diversas herramientas de acompañamiento adaptadas a tu proceso único.',
  60, false, 6
);


-- ================================================================
-- BLOQUE 6 — DATOS: configuración de horario
-- Lunes–viernes, 09:00–19:00, bloques de 60 minutos.
-- ================================================================
insert into public.schedule_config
  (dias_laborables, hora_inicio, hora_fin, duracion_bloque_minutos)
values
  ('{1,2,3,4,5}', '09:00', '19:00', 60);


-- ================================================================
-- BLOQUE 7 — DATOS: citas de ejemplo
-- Generan huecos ocupados visibles desde el primer día.
-- Puedes eliminarlas en producción cuando arranques con clientes reales.
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
    (service_id, fecha, hora_inicio, hora_fin, nombre_cliente, email_cliente, telefono_cliente, estado)
  values
    -- Jueves 2 jul
    (sid_psico,  '2026-07-02', '10:00', '11:00', 'María González',  'maria@example.com',    '9991234567', 'confirmed'),
    (sid_coach,  '2026-07-02', '14:00', '15:00', 'Carlos Méndez',   'carlos@example.com',   '9997654321', 'pending'),
    -- Viernes 3 jul
    (sid_crisis, '2026-07-03', '09:00', '10:00', 'Laura Sánchez',   'laura@example.com',    '9993456789', 'confirmed'),
    (sid_psico,  '2026-07-03', '11:00', '12:00', 'Roberto Díaz',    'roberto@example.com',  '9998765432', 'pending'),
    (sid_espiri, '2026-07-03', '16:00', '17:00', 'Sofía Ramírez',   'sofia@example.com',    '9994567890', 'pending'),
    -- Lunes 7 jul
    (sid_eqi,    '2026-07-07', '10:00', '11:30', 'Ana Torres',      'ana@example.com',      '9992345678', 'confirmed'),
    (sid_coach,  '2026-07-07', '15:00', '16:00', 'Daniela Vega',    'daniela@example.com',  '9990987654', 'pending'),
    -- Martes 8 jul
    (sid_psico,  '2026-07-08', '09:00', '10:00', 'Miguel Herrera',  'miguel@example.com',   '9996789012', 'confirmed'),
    (sid_psico,  '2026-07-08', '16:00', '17:00', 'Valeria Cruz',    'valeria@example.com',  '9995678901', 'pending'),
    -- Miércoles 9 jul
    (sid_taller, '2026-07-09', '10:00', '12:00', 'Isabella Morales','isabella@example.com', '9991357924', 'confirmed'),
    (sid_psico,  '2026-07-09', '13:00', '14:00', 'Fernando Leal',   'fernando@example.com', '9990123456', 'confirmed'),
    -- Jueves 10 jul
    (sid_eqi,    '2026-07-10', '09:00', '10:30', 'Gabriela Ruiz',   'gabriela@example.com', '9993571468', 'pending'),
    (sid_coach,  '2026-07-10', '12:00', '13:00', 'Andrés Moreno',   'andres@example.com',   '9992468013', 'confirmed');
end;
$$;
