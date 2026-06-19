import type { AttendanceEntry, ChildProfile } from "./types";

export const calculateAttendanceRate = (entries: AttendanceEntry[]) => {
  if (!entries.length) return 0;
  const present = entries.filter((entry) => entry.status === "present").length;
  return Math.round((present / entries.length) * 100);
};

export const calculateAverageAge = (children: ChildProfile[]) => {
  if (!children.length) return 0;
  const totalAge = children.reduce((sum, child) => sum + child.age, 0);
  return Number((totalAge / children.length).toFixed(1));
};
