
-- Fix security definer view by setting security_invoker
ALTER VIEW public.weekly_ranking SET (security_invoker = on);
