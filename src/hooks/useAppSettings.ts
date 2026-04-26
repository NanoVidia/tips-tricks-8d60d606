// Unified hook for loading app_settings with embedded defaults.
// Falls back to defaults if loading fails or a key is missing.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Defaults mirror the current behavior before database values load.
// Note: app_frozen is controlled directly from src/App.tsx, not from the database.
export const defaultSettings = {
  whatsapp_number: "96899815505",
  whatsapp_label: "Contact on WhatsApp",
  logo_text: "OB/GYN Reference",
  logo_emoji: "🩺",
  disclaimer_short:
    "Educational reference only — not a substitute for clinical judgment or individualized care.",
  disclaimer_long:
    "Educational use only. All content (AI responses, calculators, drug info, surgery library, MCQs) is for healthcare-professional reference. Verify against current guidelines and apply clinical judgment for every patient.",
} as const;

export type SettingKey = keyof typeof defaultSettings;
type SettingValue<K extends SettingKey> = (typeof defaultSettings)[K];

async function fetchSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")
    .limit(500);
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("empty");
  const map: Record<string, unknown> = {};
  for (const r of data) map[r.key] = r.value;
  return map;
}

export function useAppSettings() {
  const q = useQuery({
    queryKey: ["app_settings"],
    queryFn: fetchSettings,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const dict = q.data;
  const source: "db" | "fallback" = dict ? "db" : "fallback";

  function get<K extends SettingKey>(key: K): SettingValue<K> {
    if (dict && key in dict) return dict[key] as SettingValue<K>;
    return defaultSettings[key];
  }

  return { get, source, isLoading: q.isLoading, all: dict };
}
