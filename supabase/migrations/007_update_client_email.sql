-- ================================================================
-- Vāk Devi — Cambiar el email de un cliente de forma atómica
-- Migración: 007_update_client_email.sql
-- Ejecutar manualmente en Supabase Studio → SQL Editor
-- PREREQUISITO: 003_clients_table.sql ya ejecutada
--
-- "appointments" no tiene client_id ni foreign key hacia "clients"
-- (ver 003_clients_table.sql): la única relación entre ambas tablas
-- es el texto de email_cliente / email. Por eso cambiar clients.email
-- por sí solo dejaría el historial de citas y las estadísticas de
-- /admin/clientes huérfanas del email antiguo. Esta función actualiza
-- ambas tablas en una sola llamada — como es un único statement SQL
-- (una llamada a función), Postgres la ejecuta dentro de una sola
-- transacción: nada puede quedar a medias entre el UPDATE de clients
-- y el de appointments.
--
-- SECURITY INVOKER, no DEFINER: la única llamadora es updateClient()
-- en src/app/actions/admin.ts, que ya usa createAdminClient()
-- (service_role) tras assertAdmin() — ese cliente ya bypasa RLS por
-- sí mismo, así que no hace falta que la función se ejecute con los
-- privilegios de su dueño (DEFINER añadiría una escalación de
-- privilegios innecesaria). El acceso se restringe igualmente: solo
-- service_role puede invocarla (ver REVOKE/GRANT al final).
-- ================================================================

create or replace function public.update_client_email(
  p_old_email text,
  p_new_email text
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_old_email            text := p_old_email;
  v_new_email            text := trim(p_new_email);
  v_client_id            uuid;
  v_conflict_id          uuid;
  v_orphan_count         integer;
  v_updated_appointments integer;
begin
  if v_new_email = '' or v_new_email is null then
    raise exception 'El nuevo email no puede estar vacío.';
  end if;

  select id into v_client_id
  from public.clients
  where email = v_old_email;

  if v_client_id is null then
    raise exception 'No existe ningún cliente con el email %.', v_old_email;
  end if;

  if v_new_email = v_old_email then
    return 0;
  end if;

  select id into v_conflict_id
  from public.clients
  where email = v_new_email;

  if v_conflict_id is not null then
    raise exception 'Ya existe un cliente con ese email.'
      using errcode = 'unique_violation';
  end if;

  select count(*) into v_orphan_count
  from public.appointments
  where email_cliente = v_new_email;

  if v_orphan_count > 0 then
    raise exception
      'Ya existen % cita(s) registradas con el email %, pertenecientes a un cliente distinto (probablemente eliminado). No se puede reasignar ese historial.',
      v_orphan_count, v_new_email;
  end if;

  update public.clients
    set email = v_new_email,
        actualizado_en = now()
    where id = v_client_id;

  update public.appointments
    set email_cliente = v_new_email
    where email_cliente = v_old_email;

  get diagnostics v_updated_appointments = row_count;

  return v_updated_appointments;
end;
$$;

comment on function public.update_client_email(text, text) is
  'Cambia el email de un cliente (clients.email) y el email_cliente de '
  'todas sus citas (appointments) en una sola transacción atómica. '
  'Llamada exclusivamente desde updateClient() en '
  'src/app/actions/admin.ts vía createAdminClient() (service_role).';

-- ================================================================
-- SEGURIDAD — por defecto Postgres concede EXECUTE a PUBLIC en toda
-- función nueva; se revoca explícitamente y se deja solo a service_role.
-- ================================================================
revoke all on function public.update_client_email(text, text) from public, anon, authenticated;
grant execute on function public.update_client_email(text, text) to service_role;
