import { z } from "zod";

// ขอลา/แจ้งสาย: เหตุผลบังคับ (พี่เลี้ยงต้องมีข้อมูลตัดสินใจ) · วันที่ต้องไม่ย้อนเกินกติกา ตรวจที่ service
export const leaveRequestSchema = z.object({
  workDate: z.iso.date(),
  kind: z.enum(["leave", "late"]),
  reason: z.string().trim().min(5).max(300),
});

// ไม่อนุมัติต้องบอกเหตุผล (น้องต้องรู้ว่าทำไม) · อนุมัติจะเขียนหรือไม่ก็ได้
export const leaveDecisionSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    note: z.string().trim().max(300).default(""),
  })
  .refine((v) => v.status === "approved" || v.note.length >= 3, { path: ["note"], message: "ไม่อนุมัติต้องเขียนเหตุผล" });
