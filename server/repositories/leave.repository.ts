import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../db/client";
import { leaveRequests, users, type LeaveKind, type LeaveStatus } from "../db/schema";

export const leaveRepository = {
  async add(v: { userId: number; workDate: string; kind: LeaveKind; reason: string }) {
    const [row] = await db.insert(leaveRequests).values(v).returning({ id: leaveRequests.id });
    return row.id;
  },
  find: async (id: number) => (await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)))[0],
  // ใบที่ยังมีผลอยู่ของวันนั้น (รออนุมัติหรืออนุมัติแล้ว) ใช้กันขอซ้ำ
  activeOf: (userId: number, workDate: string, kind: LeaveKind) =>
    db
      .select({ id: leaveRequests.id })
      .from(leaveRequests)
      .where(and(eq(leaveRequests.userId, userId), eq(leaveRequests.workDate, workDate), eq(leaveRequests.kind, kind), inArray(leaveRequests.status, ["pending", "approved"]))),
  mine: (userId: number, limit: number) => db.select().from(leaveRequests).where(eq(leaveRequests.userId, userId)).orderBy(desc(leaveRequests.workDate), desc(leaveRequests.id)).limit(limit),
  async remove(id: number) {
    await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
  },
  // อนุมัติ/ไม่อนุมัติ: ทำได้เฉพาะใบที่ยังรออนุมัติ (กันสองพี่เลี้ยงกดพร้อมกันแล้วทับกัน) · คืน true ถ้าเปลี่ยนจริง
  async decide(id: number, v: { status: Exclude<LeaveStatus, "pending">; decidedBy: number; note: string | null }) {
    const rows = await db
      .update(leaveRequests)
      .set({ status: v.status, decidedBy: v.decidedBy, decidedAt: new Date(), decisionNote: v.note })
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.status, "pending")))
      .returning({ id: leaveRequests.id });
    return rows.length > 0;
  },
  // ใบที่อนุมัติแล้วของน้องคนหนึ่งในช่วงวันที่ (ใช้คิดสถานะรายวัน)
  approvedOfUser: (userId: number, from: string, to: string) =>
    db
      .select({ workDate: leaveRequests.workDate, kind: leaveRequests.kind, reason: leaveRequests.reason })
      .from(leaveRequests)
      .where(and(eq(leaveRequests.userId, userId), eq(leaveRequests.status, "approved"), gte(leaveRequests.workDate, from), lte(leaveRequests.workDate, to))),
  // ใบที่อนุมัติแล้วของน้องทั้งรุ่นในช่วงวันที่
  approvedOfCohort: (cohortId: number, from: string, to: string) =>
    db
      .select({ userId: leaveRequests.userId, workDate: leaveRequests.workDate, kind: leaveRequests.kind })
      .from(leaveRequests)
      .innerJoin(users, eq(users.id, leaveRequests.userId))
      .where(and(eq(users.cohortId, cohortId), eq(leaveRequests.status, "approved"), gte(leaveRequests.workDate, from), lte(leaveRequests.workDate, to))),
  // หลังบ้าน: ใบของน้องในรุ่น (ใหม่สุดก่อน) · status ว่าง = ทุกสถานะ
  ofCohort: (cohortId: number, status: LeaveStatus | null, limit: number) =>
    db
      .select({ leave: leaveRequests, name: users.fullName, nickname: users.nickname, username: users.username })
      .from(leaveRequests)
      .innerJoin(users, eq(users.id, leaveRequests.userId))
      .where(and(eq(users.cohortId, cohortId), status ? eq(leaveRequests.status, status) : undefined))
      .orderBy(desc(leaveRequests.workDate), desc(leaveRequests.id))
      .limit(limit),
  // จำนวนใบรออนุมัติของรุ่นที่ระบุ (ไม่ระบุ = ทุกรุ่น) ไว้ขึ้นตัวเลขบนเมนู
  async pendingCount(cohortIds?: number[]) {
    const rows = await db
      .select({ id: leaveRequests.id, cohortId: users.cohortId })
      .from(leaveRequests)
      .innerJoin(users, eq(users.id, leaveRequests.userId))
      .where(eq(leaveRequests.status, "pending"));
    return rows.filter((r) => !cohortIds || (r.cohortId !== null && cohortIds.includes(r.cohortId))).length;
  },
  async cohortOfLeave(id: number) {
    const [row] = await db.select({ cohortId: users.cohortId, userId: leaveRequests.userId }).from(leaveRequests).innerJoin(users, eq(users.id, leaveRequests.userId)).where(eq(leaveRequests.id, id));
    return row;
  },
};
