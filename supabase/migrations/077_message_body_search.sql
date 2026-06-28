-- Speed up ILIKE / substring search on message bodies for inbox search.
create extension if not exists pg_trgm;

create index if not exists messages_body_trgm_idx
  on public.messages using gin (body gin_trgm_ops);
