-- Full deny policies for purchase_events (server-only via service_role bypasses RLS)
CREATE POLICY "deny_insert_purchase_events" ON public.purchase_events FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "deny_update_purchase_events" ON public.purchase_events FOR UPDATE TO authenticated, anon USING (false);
CREATE POLICY "deny_delete_purchase_events" ON public.purchase_events FOR DELETE TO authenticated, anon USING (false);

-- Deny update/delete on trial_starts from clients
CREATE POLICY "deny_update_trial_starts" ON public.trial_starts FOR UPDATE TO authenticated, anon USING (false);
CREATE POLICY "deny_delete_trial_starts" ON public.trial_starts FOR DELETE TO authenticated, anon USING (false);

-- Convert has_active_access to SECURITY INVOKER (no longer needs definer privileges)
DROP FUNCTION IF EXISTS public.has_active_access(uuid);
CREATE FUNCTION public.has_active_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND (
        (status = 'trial' AND trial_ends_at > now())
        OR (status = 'active' AND (current_period_end IS NULL OR current_period_end > now()))
      )
  );
$$;