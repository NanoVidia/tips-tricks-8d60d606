-- Lock down purchase_events and trial_starts from clients (server-only)
CREATE POLICY "No client access to purchase_events"
  ON public.purchase_events FOR SELECT
  TO authenticated, anon
  USING (false);

CREATE POLICY "No client insert trial_starts"
  ON public.trial_starts FOR INSERT
  TO authenticated, anon
  WITH CHECK (false);

-- Restrict has_active_access execution to server (service_role) only
REVOKE EXECUTE ON FUNCTION public.has_active_access(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_access(uuid) TO service_role;