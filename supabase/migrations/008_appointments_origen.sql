-- 008 — Canal de origen de cada cita
--
-- Añade appointments.origen para distinguir las citas creadas desde la web
-- pública (/agendar), el alta manual del panel (/admin/citas-nueva) y el
-- asistente virtual de WhatsApp (API /api/agente/*).
--
-- Compatible hacia atrás: la columna tiene valor por defecto 'web', así que el
-- código actual (que no la envía) sigue funcionando mientras se aplica. Hay que
-- ejecutarla ANTES de desplegar el código que escribe "origen".
--
-- Las citas existentes quedan como 'web' (también las que se dieron de alta a
-- mano antes de esta migración: no hay forma de distinguirlas).

alter table public.appointments
  add column if not exists origen text not null default 'web';

alter table public.appointments
  drop constraint if exists appointments_origen_check;

alter table public.appointments
  add constraint appointments_origen_check
  check (origen in ('web', 'admin', 'whatsapp'));

comment on column public.appointments.origen is
  'Canal por el que se creó la cita: web (/agendar), admin (alta manual) '
  'o whatsapp (asistente virtual). Citas anteriores a la migración 008 = web.';
