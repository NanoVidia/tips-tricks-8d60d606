// Fetches surgeries from the database with a static fallback bank.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { surgeries as STATIC_SURGERIES, type Surgery, type SurgeryCategory } from "@/data/surgeriesData";

type DbRow = {
  external_id: string | null;
  category: string;
  name_en: string;
  difficulty: number;
  description: string | null;
  steps: unknown;
  mcqs: unknown;
  video_id: string | null;
  pearls: string[];
  references_list: string[];
};

function rowToSurgery(r: DbRow): Surgery {
  const blob = (r.steps ?? {}) as Record<string, unknown>;
  const refs = (r.references_list ?? []).map((s) => {
    const [label, url] = s.split("|");
    return { label: label ?? s, url: url ?? "#" };
  });
  return {
    id: r.external_id ?? crypto.randomUUID(),
    name: r.name_en,
    category: r.category as SurgeryCategory,
    approach: (blob.approach as string[]) ?? [],
    duration: (blob.duration as string) ?? "",
    difficulty: (r.difficulty as 1 | 2 | 3 | 4 | 5) ?? 3,
    summary: r.description ?? (blob.summary as string) ?? "",
    indications: (blob.indications as string[]) ?? [],
    contraindications: (blob.contraindications as string[]) ?? [],
    preOp: (blob.preOp as string[]) ?? [],
    steps: (blob.steps as string[]) ?? [],
    complications: (blob.complications as string[]) ?? [],
    postOp: (blob.postOp as string[]) ?? [],
    pearls: r.pearls ?? [],
    videoId: r.video_id ?? "",
    videoTitle: (blob.videoTitle as string) ?? "",
    videoChannel: (blob.videoChannel as string) ?? "",
    references: refs,
    mcqs: (r.mcqs as Surgery["mcqs"]) ?? [],
  };
}

async function fetchAllSurgeries(): Promise<Surgery[]> {
  const { data, error } = await supabase
    .from("surgeries")
    .select("external_id, category, name_en, difficulty, description, steps, mcqs, video_id, pearls, references_list")
    .eq("active", true)
    .order("display_order", { ascending: true })
    .limit(500);
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("empty");
  return (data as DbRow[]).map(rowToSurgery);
}

export function useAllSurgeries() {
  const q = useQuery({
    queryKey: ["surgeries", "all"],
    queryFn: fetchAllSurgeries,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const surgeries: Surgery[] = q.data ?? STATIC_SURGERIES;
  const source: "db" | "fallback" = q.data ? "db" : "fallback";

  return { surgeries, source, isLoading: q.isLoading, error: q.error as Error | null };
}
