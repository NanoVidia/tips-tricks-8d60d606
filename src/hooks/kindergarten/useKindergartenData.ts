import { useQuery } from "@tanstack/react-query";
import {
  fetchKindergartenAttendance,
  fetchKindergartenChildren,
  kindergartenQueryKeys,
} from "@/lib/kindergarten/supabaseQueries";

export const useKindergartenData = () => {
  const childrenQuery = useQuery({
    queryKey: kindergartenQueryKeys.children,
    queryFn: fetchKindergartenChildren,
  });

  const attendanceQuery = useQuery({
    queryKey: kindergartenQueryKeys.attendance,
    queryFn: fetchKindergartenAttendance,
  });

  return {
    childrenQuery,
    attendanceQuery,
  };
};
