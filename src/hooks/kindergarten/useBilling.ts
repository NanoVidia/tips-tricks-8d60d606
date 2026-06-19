import { useQuery } from "@tanstack/react-query";
import { kindergartenQueryKeys } from "@/lib/kindergarten/supabaseQueries";

export const useBilling = () =>
  useQuery({
    queryKey: kindergartenQueryKeys.billing,
    queryFn: async () => [],
  });
