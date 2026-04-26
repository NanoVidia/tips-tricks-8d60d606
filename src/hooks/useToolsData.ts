// Unified hook for loading /tools data from the database with static fallback data.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  emergencyProtocols as STATIC_PROTOCOLS,
  pregnancyDrugs as STATIC_DRUGS,
  guidelines as STATIC_GUIDELINES,
  ddxLibrary as STATIC_DDX,
} from "@/data/toolsData";

export type Protocol = (typeof STATIC_PROTOCOLS)[number];
export type Drug = (typeof STATIC_DRUGS)[number];
export type Guideline = (typeof STATIC_GUIDELINES)[number];
export type DDx = (typeof STATIC_DDX)[number];

async function fetchAll() {
  const [p, d, g, x] = await Promise.all([
    supabase.from("tools_protocols").select("external_id, title, color, steps, targets").eq("active", true).order("display_order", { ascending: true }).limit(200),
    supabase.from("tools_drugs").select("name, category, trimester, lactation, notes").eq("active", true).limit(500),
    supabase.from("tools_guidelines").select("society, region, color, items").eq("active", true).order("display_order", { ascending: true }).limit(100),
    supabase.from("tools_ddx").select("presentation, differentials, red_flags").eq("active", true).order("display_order", { ascending: true }).limit(100),
  ]);
  if (p.error || d.error || g.error || x.error) throw p.error ?? d.error ?? g.error ?? x.error;
  if (!p.data?.length && !d.data?.length) throw new Error("empty");

  const protocols: Protocol[] = (p.data ?? []).map((r) => ({
    id: r.external_id ?? crypto.randomUUID(),
    title: r.title,
    color: r.color,
    steps: r.steps ?? [],
    targets: r.targets ?? "",
  }));
  const drugs: Drug[] = (d.data ?? []).map((r) => ({
    name: r.name,
    category: r.category,
    trimester: r.trimester,
    lactation: r.lactation,
    notes: r.notes ?? "",
  }));
  const guidelines: Guideline[] = (g.data ?? []).map((r) => ({
    society: r.society,
    region: r.region,
    color: r.color,
    items: r.items ?? [],
  }));
  const ddx: DDx[] = (x.data ?? []).map((r) => ({
    presentation: r.presentation,
    differentials: r.differentials ?? [],
    redFlags: r.red_flags ?? "",
  }));

  return { protocols, drugs, guidelines, ddx };
}

export function useToolsData() {
  const q = useQuery({
    queryKey: ["tools", "all"],
    queryFn: fetchAll,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const data = q.data ?? {
    protocols: STATIC_PROTOCOLS,
    drugs: STATIC_DRUGS,
    guidelines: STATIC_GUIDELINES,
    ddx: STATIC_DDX,
  };
  const source: "db" | "fallback" = q.data ? "db" : "fallback";
  return { ...data, source, isLoading: q.isLoading, error: q.error as Error | null };
}
