import { z } from "zod";

const day = z.iso.date();

export const cohortSchema = z.object({
  name: z.string().trim().min(2).max(80),
  startsOn: day,
  endsOn: day,
});

export const cohortMentorsSchema = z.object({ userIds: z.array(z.number().int().positive()).max(50) });

// null = เอาออกจากรุ่น (กลับไปอยู่ "ไม่มีรุ่น")
export const cohortAssignSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1).max(200),
  cohortId: z.number().int().positive().nullable(),
});
