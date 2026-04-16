
DROP INDEX IF EXISTS idx_scenarios_title_trgm;
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
CREATE INDEX idx_scenarios_title_trgm ON public.medical_scenarios USING GIN (title_en extensions.gin_trgm_ops);

-- Update search function to use extensions schema
CREATE OR REPLACE FUNCTION public.search_scenarios(search_query TEXT, category_filter scenario_category DEFAULT NULL)
RETURNS SETOF public.medical_scenarios
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
