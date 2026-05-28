import { supabase } from "@/integrations/supabase/client";

export const kindergartenQueryKeys = {
  overview: ["kindergarten", "overview"] as const,
  children: ["kindergarten", "children"] as const,
  attendance: ["kindergarten", "attendance"] as const,
  activities: ["kindergarten", "activities"] as const,
  billing: ["kindergarten", "billing"] as const,
  media: ["kindergarten", "media"] as const,
};

export const fetchKindergartenChildren = async () => {
  await supabase.auth.getSession();
  return [];
};

export const fetchKindergartenAttendance = async () => {
  await supabase.auth.getSession();
  return [];
};
