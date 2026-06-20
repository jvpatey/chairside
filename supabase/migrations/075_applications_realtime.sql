-- Enable realtime updates for clinic application badge refresh.
alter table public.applications replica identity full;

alter publication supabase_realtime add table public.applications;
