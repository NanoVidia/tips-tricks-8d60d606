import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { defaultTranslations, type TranslationKey } from "@/lib/i18n";

type Lang = "en" | "ar";

async function fetchTranslations(): Promise<Record<string, { en: string }>> {
  const { data, error } = await supabase
    .from("app_translations")
    .select("key, en")
    .limit(2000);
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("empty");
  const map: Record<string, { en: string }> = {};
  for (const r of data) map[r.key] = { en: r.en };
  return map;
}

export function useTranslations(lang: Lang = "en") {
  const q = useQuery({
    queryKey: ["app_translations"],
    queryFn: fetchTranslations,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const dict = q.data;
  const source: "db" | "fallback" = dict ? "db" : "fallback";

  function t(key: TranslationKey): string {
    if (dict && dict[key]) return dict[key].en;
    return defaultTranslations[key] ?? key;
  }

  return { t, source, isLoading: q.isLoading };
}
