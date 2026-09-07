-- Allow the notify edge function (service_role) to resolve fill_in_sms plan gates
-- when deciding whether to SMS workers on fill-in post → live.

grant execute on function public.clinic_can_use_feature(uuid, text) to service_role;
