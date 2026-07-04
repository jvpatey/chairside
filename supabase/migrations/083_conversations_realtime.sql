-- Enable Supabase Realtime for conversation metadata updates (read receipts, inbox previews).

alter table public.conversations replica identity full;

alter publication supabase_realtime add table public.conversations;
