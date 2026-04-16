
-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create enum for categories
CREATE TYPE public.scenario_category AS ENUM ('clinic', 'or_labor', 'behavior', 'qa');

-- Create medical scenarios table
CREATE TABLE public.medical_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category scenario_category NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  situation_en TEXT NOT NULL,
  situation_ar TEXT NOT NULL,
  action_en TEXT NOT NULL,
  action_ar TEXT NOT NULL,
  script_en TEXT NOT NULL,
  script_ar TEXT NOT NULL,
  synonyms TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_scenarios ENABLE ROW LEVEL SECURITY;

-- Public read access (reference data)
CREATE POLICY "Anyone can read medical scenarios"
  ON public.medical_scenarios FOR SELECT
  USING (true);

-- GIN index for fuzzy search on title and synonyms
CREATE INDEX idx_scenarios_title_trgm ON public.medical_scenarios USING GIN (title_en gin_trgm_ops);
CREATE INDEX idx_scenarios_synonyms ON public.medical_scenarios USING GIN (synonyms);
CREATE INDEX idx_scenarios_category ON public.medical_scenarios (category);

-- Search function that handles typos via trigram similarity and synonyms
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
      OR similarity(title_en, search_query) > 0.15
      OR title_en ILIKE '%' || search_query || '%'
      OR title_ar ILIKE '%' || search_query || '%'
      OR situation_en ILIKE '%' || search_query || '%'
      OR action_en ILIKE '%' || search_query || '%'
      OR script_en ILIKE '%' || search_query || '%'
      OR EXISTS (SELECT 1 FROM unnest(synonyms) s WHERE similarity(s, search_query) > 0.3 OR s ILIKE '%' || search_query || '%')
    )
  ORDER BY
    CASE WHEN search_query IS NOT NULL AND search_query != '' THEN similarity(title_en, search_query) ELSE 1 END DESC;
$$;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_medical_scenarios_updated_at
  BEFORE UPDATE ON public.medical_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
