// Fetches MCQs from the database with a local fallback bank.
// If loading fails, the hook returns the embedded question bank.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ALL_MCQS, type MCQ } from "@/data/mcqBank";
import type { ExamId, Topic, Difficulty } from "@/data/examsData";

type DbRow = {
  external_id: string | null;
  topic: string;
  difficulty: string;
  exams: string[];
  stem: string;
  options: string[];
  answer_index: number;
  explanation: string;
  reference: string | null;
};

function rowToMCQ(r: DbRow): MCQ {
  return {
    id: r.external_id ?? crypto.randomUUID(),
    topic: r.topic as Topic,
    difficulty: r.difficulty as Difficulty,
    exams: (r.exams ?? []) as ExamId[],
    stem: r.stem,
    options: r.options ?? [],
    answerIndex: r.answer_index,
    explanation: r.explanation,
    reference: r.reference ?? "",
  };
}

async function fetchAllMcqs(): Promise<MCQ[]> {
  const { data, error } = await supabase
    .from("mcq_questions")
    .select("external_id, topic, difficulty, exams, stem, options, answer_index, explanation, reference")
    .eq("active", true)
    .limit(2000);
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("empty");
  return (data as DbRow[]).map(rowToMCQ);
}

/** Returns all available questions and reports whether data came from the database or fallback bank. */
export function useAllMcqs() {
  const q = useQuery({
    queryKey: ["mcq_questions", "all"],
    queryFn: fetchAllMcqs,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const mcqs: MCQ[] = q.data ?? ALL_MCQS;
  const source: "db" | "fallback" = q.data ? "db" : "fallback";

  return { mcqs, source, isLoading: q.isLoading, error: q.error as Error | null };
}

/** Filters any MCQ list using the same rules as the original filterMCQs helper. */
export function filterMcqList(
  pool: MCQ[],
  opts: { examId?: ExamId; topic?: Topic | "All"; difficulty?: Difficulty | "All" },
): MCQ[] {
  return pool.filter((q) => {
    if (opts.examId && q.exams.length > 0 && !q.exams.includes(opts.examId)) {
      return q.exams.length === 0;
    }
    if (opts.topic && opts.topic !== "All" && q.topic !== opts.topic) return false;
    if (opts.difficulty && opts.difficulty !== "All" && q.difficulty !== opts.difficulty) return false;
    return true;
  });
}
