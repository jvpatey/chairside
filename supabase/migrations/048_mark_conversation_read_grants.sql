-- Restrict mark_conversation_read to authenticated (revoke default PUBLIC execute).

revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
