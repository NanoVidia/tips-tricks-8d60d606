import { useQuery } from "@tanstack/react-query";
import { kindergartenQueryKeys } from "@/lib/kindergarten/supabaseQueries";

export const useActivities = () =>
  useQuery({
    queryKey: kindergartenQueryKeys.activities,
    queryFn: async () => [],
  });
