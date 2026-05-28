import { z } from "zod";

export const childProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  age: z.number().min(2).max(7),
  guardianName: z.string().min(2),
  phone: z.string().min(6),
  allergies: z.array(z.string()).default([]),
});

export const attendanceEntrySchema = z.object({
  childId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["present", "absent"]),
  note: z.string().optional(),
});

export const activitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  category: z.enum(["arts", "sports", "reading", "music"]),
  startsAt: z.string().min(1),
});
