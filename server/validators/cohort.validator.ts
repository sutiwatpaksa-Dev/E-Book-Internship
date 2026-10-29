import { z } from "zod";

const day = z.iso.date();

export const cohortSchema = z.object({
  name: z.string().trim().min(2).max(80),
  startsOn: day,
  endsOn: day,
});

export const cohortMentorsSchema = z.object({ userIds: z.array(z.number().int().positive()).max(50) });

// ตั้งค่ารับสมัคร: วันปิดรับ (null = ไม่กำหนด) และจำนวนที่ (null = ไม่จำกัด)
export const cohortSignupSchema = z.object({
  signupOpen: z.boolean(),
  signupUntil: day.nullable(),
  seatLimit: z.number().int().min(1).max(500).nullable(),
});

// null = เอาออกจากรุ่น (กลับไปอยู่ "ไม่มีรุ่น")
export const cohortEndedSchema = z.object({ ended: z.boolean() });

export const cohortAssignSchema = z.object({
  userIds: z.array(z.number().int().positive()).min(1).max(200),
  cohortId: z.number().int().positive().nullable(),
});
