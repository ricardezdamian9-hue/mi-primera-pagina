-- ==========================================================
-- SETUP 3: BLINDAJE DE LAS REACCIONES Y EL CONTADOR
-- ==========================================================
-- Problema que corrige este script:
-- La política "guestbook_public_update" (del setup 2) daba permiso de
-- UPDATE sobre TODA la fila de "guestbook" a cualquier visitante anónimo.
-- Eso significa que, con la key pública que ya está en script.js,
-- cualquiera podía no solo sumar un like, sino reescribir el "nombre",
-- el "mensaje" o el "dibujo" de una firma ajena.
--
-- La solución: en vez de dejar UPDATE libre, quitamos ese permiso y
-- creamos funciones (RPC) que SOLO pueden sumar +1 a "likes" o
-- "reportes" de un id concreto. El visitante llama a la función,
-- nunca toca la tabla directamente.

-- 1. Quitar la política insegura del setup anterior
drop policy if exists "guestbook_public_update" on guestbook;

-- 2. Función segura para sumar un like
create or replace function public.sumar_like(fila_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update guestbook set likes = likes + 1 where id = fila_id;
$$;

-- 3. Función segura para sumar un reporte
create or replace function public.sumar_reporte(fila_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update guestbook set reportes = reportes + 1 where id = fila_id;
$$;

-- 4. Permitir que cualquier visitante anónimo llame a estas dos funciones
--    (y solo estas dos, no un UPDATE genérico)
grant execute on function public.sumar_like(bigint) to anon;
grant execute on function public.sumar_reporte(bigint) to anon;

-- ==========================================================
-- MISMO BLINDAJE PARA EL CONTADOR DE VISITAS (site_counter)
-- ==========================================================
-- El código actual hace: leer visits -> sumar 1 en el navegador -> UPDATE.
-- Esto tiene dos problemas: (a) si ya existiera una política de UPDATE
-- abierta, cualquiera podría poner el contador en cualquier número, y
-- (b) dos visitas al mismo tiempo pueden pisarse y perder una visita
-- (condición de carrera). La función de abajo resuelve ambas cosas
-- sumando 1 directamente en la base de datos y devolviendo el valor
-- ya actualizado.

drop policy if exists "site_counter_public_update" on site_counter;

create or replace function public.sumar_visita()
returns bigint
language sql
security definer
set search_path = public
as $$
  update site_counter set visits = visits + 1 where id = 1
  returning visits;
$$;

grant execute on function public.sumar_visita() to anon;

-- Nota: después de correr este script, "guestbook" y "site_counter"
-- deberían seguir permitiendo SELECT e INSERT (donde aplique) para
-- "anon", pero YA NO deberían tener ninguna política de UPDATE directo.
-- Verifícalo en Supabase > Authentication > Policies.
