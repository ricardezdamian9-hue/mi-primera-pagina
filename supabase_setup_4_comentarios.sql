-- ==========================================================
-- SETUP 4: COMENTARIOS POR POST
-- ==========================================================
-- Tabla separada del guestbook. Cada fila es un comentario
-- ligado a un post_id ("post-1", "post-2", ...) que coincide
-- con el id del <article class="post"> en index.html.

create table if not exists comentarios (
  id bigint generated always as identity primary key,
  post_id text not null,
  nombre text not null default 'Anónimo_Wired',
  mensaje text not null,
  created_at timestamptz not null default now(),
  constraint mensaje_no_vacio check (char_length(trim(mensaje)) > 0),
  constraint mensaje_max_largo check (char_length(mensaje) <= 500),
  constraint nombre_max_largo check (char_length(nombre) <= 40)
);

-- Índice para que "traer los comentarios de un post" sea rápido
create index if not exists idx_comentarios_post_id on comentarios (post_id);

-- Activar Row Level Security (igual que en guestbook)
alter table comentarios enable row level security;

-- Cualquiera puede LEER los comentarios (para que se vean sin iniciar sesión)
create policy "comentarios_public_select"
on comentarios for select
to anon
using (true);

-- Cualquiera puede INSERTAR un comentario nuevo
create policy "comentarios_public_insert"
on comentarios for insert
to anon
with check (true);

-- OJO: a propósito NO se crea política de UPDATE ni DELETE para "anon".
-- Con esto, un visitante puede escribir un comentario pero nadie puede
-- editar o borrar el comentario de otro usando la key pública (el mismo
-- error que corregiste en el setup 2/3 del guestbook, pero evitado desde
-- el diseño en vez de parcheado después).

-- Nota: las validaciones de longitud (mensaje_max_largo, nombre_max_largo,
-- mensaje_no_vacio) corren en la base de datos, así que aunque alguien
-- salte el JS del navegador y pegue directo a la API de Supabase, no puede
-- mandar un mensaje vacío ni un texto gigante.
