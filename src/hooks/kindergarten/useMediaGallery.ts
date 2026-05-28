import { useQuery } from "@tanstack/react-query";
import { kindergartenQueryKeys } from "@/lib/kindergarten/supabaseQueries";

export const useMediaGallery = () =>
  useQuery({
    queryKey: kindergartenQueryKeys.media,
    queryFn: async () => [],
  });
