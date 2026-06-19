import { useMemo } from "react";
import { useKindergartenData } from "./useKindergartenData";
import { calculateAttendanceRate } from "@/lib/kindergarten/calculations";
import type { AttendanceEntry } from "@/lib/kindergarten/types";

export const useAttendance = () => {
  const { attendanceQuery } = useKindergartenData();

  const attendanceRate = useMemo(
    () => calculateAttendanceRate((attendanceQuery.data ?? []) as AttendanceEntry[]),
    [attendanceQuery.data],
  );

  return {
    ...attendanceQuery,
    attendanceRate,
  };
};
