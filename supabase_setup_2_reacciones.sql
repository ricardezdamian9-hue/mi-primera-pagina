-- Agrega contadores de "me gusta" y "reportes" a las firmas existentes
alter table guestbook add column if not exists likes bigint not null default 0;
alter table guestbook add column if not exists reportes bigint not null default 0;

-- Falta permiso de UPDATE (antes solo había insert/select) para poder sumar likes/reportes
create policy "guestbook_public_update"
on guestbook for update
to anon
using (true)
with check (true);
