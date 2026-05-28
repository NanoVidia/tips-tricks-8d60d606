export type KindergartenLocale = "ar" | "en";

export type ChildProfile = {
  id: string;
  name: string;
  age: number;
  guardianName: string;
  phone: string;
  allergies: string[];
};

export type AttendanceStatus = "present" | "absent";

export type AttendanceEntry = {
  childId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
};

export type ActivityCategory = "arts" | "sports" | "reading" | "music";

export type KindergartenActivity = {
  id: string;
  title: string;
  category: ActivityCategory;
  startsAt: string;
};

export const KINDERGARTEN_ROUTES = [
  "/kindergarten",
  "/kindergarten/children",
  "/kindergarten/attendance",
  "/kindergarten/activities",
  "/kindergarten/communication",
  "/kindergarten/reports",
  "/kindergarten/health",
  "/kindergarten/billing",
  "/kindergarten/media",
  "/kindergarten/settings",
] as const;

export const getKindergartenLocale = (): KindergartenLocale => {
  if (typeof document === "undefined") return "ar";
  return document.documentElement.lang?.toLowerCase().startsWith("en") ? "en" : "ar";
};
