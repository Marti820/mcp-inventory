-- 0001 · Prueba 0: usuarios y notas compartidas.
-- Las notas son de usar y tirar: sirven para comprobar que lo que escribe
-- uno desde su asistente lo lee el otro desde el suyo. Se eliminan en v1.

create table users (
  id          int generated always as identity primary key,
  name        text not null unique check (name ~ '^[a-z][a-z0-9_-]{1,31}$'),
  token_hash  text not null unique,
  created_at  timestamptz not null default now()
);

create table notes (
  id          int generated always as identity primary key,
  author_id   int not null references users(id),
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index notes_created_at_idx on notes (created_at desc);

-- Supabase expone el esquema public por su API REST. Con RLS activado y sin
-- políticas, nadie entra por ahí; el servidor MCP se conecta como dueño de
-- las tablas y no se ve afectado.
alter table users enable row level security;
alter table notes enable row level security;
