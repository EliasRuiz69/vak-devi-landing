-- ================================================================
-- Vāk Devi — Tabla dedicada de Clientes
-- Migración: 003_clients_table.sql
-- Ejecutar manualmente en Supabase Studio → SQL Editor
-- PREREQUISITO: 001_init.sql y 002_panel_gestion.sql ya ejecutadas
-- ================================================================


-- ================================================================
-- BLOQUE 1 — TABLA: clients
--
-- Registro de contacto propio del cliente (nombre, email, teléfono,
-- notas privadas), INDEPENDIENTE del historial de citas.
-- Antes, "cliente" era solo una vista calculada agregando
-- appointments + client_notes por email — borrar un cliente
-- obligaba a borrar también todas sus citas. Con esta tabla,
-- eliminar un cliente solo borra su registro de contacto; el
-- historial de citas en "appointments" permanece intacto.
-- ================================================================
create table if not exists public.clients (
  id             uuid        primary key default gen_random_uuid(),
  email          text        not null unique,
  nombre         text        not null,
  telefono       text,
  notas          text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.clients is
  'Registro de contacto del cliente (identidad propia, independiente '
  'de sus citas). Notas privadas sujetas a LFPDPPP. '
  'Se actualiza automáticamente al agendar (/agendar) o al crear '
  'una cita manual desde /admin.';


-- ================================================================
-- BLOQUE 2 — RLS
-- Mismo patrón que client_notes: solo la terapeuta autenticada.
-- El flujo público de /agendar y el alta manual desde /admin
-- escriben siempre vía createAdminClient() (service_role),
-- que no pasa por RLS — no hace falta política para "anon".
-- ================================================================
alter table public.clients enable row level security;

create policy "clients_all_authenticated"
  on public.clients for all
  to authenticated
  using (true) with check (true);


-- ================================================================
-- BLOQUE 3 — BACKFILL
--
-- Reconstruye "clients" a partir de lo que ya existe hoy:
-- nombre/teléfono de la cita más reciente de cada email,
-- y las notas ya guardadas en client_notes.
-- ================================================================
insert into public.clients (email, nombre, telefono, notas)
select distinct on (a.email_cliente)
  a.email_cliente,
  a.nombre_cliente,
  a.telefono_cliente,
  cn.notas
from public.appointments a
left join public.client_notes cn on cn.email_cliente = a.email_cliente
order by a.email_cliente, a.fecha desc, a.hora_inicio desc
on conflict (email) do nothing;

-- Por si hubiera algún email en client_notes sin ninguna cita asociada
-- (caso borde, no debería ocurrir, pero cubre el escenario).
insert into public.clients (email, nombre, telefono, notas)
select cn.email_cliente, cn.nombre_cliente, null, cn.notas
from public.client_notes cn
where not exists (
  select 1 from public.clients c where c.email = cn.email_cliente
)
on conflict (email) do nothing;


-- ================================================================
-- BLOQUE 4 — LIMPIEZA OPCIONAL: client_notes
--
-- "client_notes" queda reemplazada por "clients" (que incluye sus
-- mismas columnas + teléfono). Descomenta y ejecuta ÚNICAMENTE
-- después de verificar en Supabase Studio que "clients" tiene los
-- datos correctos (SELECT * FROM public.clients;).
-- ----------------------------------------------------------------
-- drop table if exists public.client_notes;
