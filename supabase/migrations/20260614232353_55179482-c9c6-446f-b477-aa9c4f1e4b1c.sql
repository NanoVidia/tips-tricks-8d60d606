
-- 1) admin_sessions: explicit deny-all for anon/authenticated (server-only via service_role)
DROP POLICY IF EXISTS "deny_all_admin_sessions" ON public.admin_sessions;
CREATE POLICY "deny_all_admin_sessions"
ON public.admin_sessions
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 2) subscriptions: explicit deny writes from clients
DROP POLICY IF EXISTS "deny_insert_subscriptions" ON public.subscriptions;
CREATE POLICY "deny_insert_subscriptions"
ON public.subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "deny_update_subscriptions" ON public.subscriptions;
CREATE POLICY "deny_update_subscriptions"
ON public.subscriptions
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "deny_delete_subscriptions" ON public.subscriptions;
CREATE POLICY "deny_delete_subscriptions"
ON public.subscriptions
FOR DELETE
TO anon, authenticated
USING (false);

-- 3) Lock down SECURITY DEFINER / definer-style functions from client roles
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_admin_sessions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_admin_sessions() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_active_access(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_access(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 4) Convert search_scenarios to SECURITY INVOKER (medical_scenarios already allows public reads)
CREATE OR REPLACE FUNCTION public.search_scenarios(search_query text, category_filter scenario_category DEFAULT NULL::scenario_category)
RETURNS SETOF public.medical_scenarios
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT *
  FROM public.medical_scenarios
  WHERE (category_filter IS NULL OR category = category_filter)
    AND (
      search_query IS NULL
      OR search_query = ''
      OR extensions.similarity(title_en, search_query) > 0.15
      OR title_en ILIKE '%' || search_query || '%'
      OR title_ar ILIKE '%' || search_query || '%'
      OR situation_en ILIKE '%' || search_query || '%'
      OR action_en ILIKE '%' || search_query || '%'
      OR script_en ILIKE '%' || search_query || '%'
      OR EXISTS (SELECT 1 FROM unnest(synonyms) s WHERE extensions.similarity(s, search_query) > 0.3 OR s ILIKE '%' || search_query || '%')
    )
  ORDER BY
    CASE WHEN search_query IS NOT NULL AND search_query != '' THEN extensions.similarity(title_en, search_query) ELSE 1 END DESC;
$function$;
