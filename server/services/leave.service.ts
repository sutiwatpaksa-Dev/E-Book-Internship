import { earliestLeaveDate, isWeekend, type LeaveAdminRow, type LeaveRow } from "../../src/lib/attendance";
import { cohortStatus, todayTH } from "../../src/lib/cohort";
import type { LeaveKind, LeaveStatus } from "../db/schema";
import { attendanceRepository } from "../repositories/attendance.repository";
import { cohortRepository } from "../repositories/cohort.repository";
import { leaveRepository } from "../repositories/leave.repository";
import { userRepository } from "../repositories/user.repository";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";

const KIND_TH: Record<LeaveKind, string> = { leave: "ลา", late: "แจ้งมาสาย" };
const ASK_TH: Record<LeaveKind, string> = { leave: "ขอลา", late: "แจ้งมาสาย" };
const LIST_LIMIT = 200;

type Row = { id: number; workDate: string; kind: LeaveKind; reason: string; status: LeaveStatus; decisionNote: string | null; createdAt: Date };
const toRow = (r: Row): LeaveRow => ({ id: r.id, workDate: r.workDate, kind: r.kind, reason: r.reason, status: r.status, decisionNote: r.decisionNote, createdAt: r.createdAt.toISOString() });

// ใบลา/แจ้งสาย: น้องขอ พี่เลี้ยงอนุมัติ · เฉพาะใบที่อนุมัติแล้วมีผลต่อสถานะรายวัน (ลา = ไม่นับว่าไม่มีเช็คอิน, แจ้งสาย = ไม่นับว่าเข้างานหลังเวลา)
export const leaveService = {
  // ขอได้ล่วงหน้าไม่จำกัด และย้อนหลังไม่เกิน 3 วันทำการ · เกินกว่านั้นให้บอกพี่เลี้ยง แล้วพี่เลี้ยงแก้เวลาให้ (มีเหตุผล + audit)
  async request(userId: number, input: { workDate: string; kind: LeaveKind; reason: string }) {
    const user = await userRepository.findById(userId);
    const cohort = user?.cohortId ? await cohortRepository.findById(user.cohortId) : undefined;
    if (!user || !cohort) throw new Error("NO_COHORT");
    const today = todayTH();
    const status = cohortStatus({ startsOn: cohort.startsOn, endsOn: cohort.endsOn, endedAt: cohort.endedAt ? cohort.endedAt.toISOString() : null }, today);
    if (status === "ended" || status === "overdue") throw new Error("COHORT_NOT_ACTIVE");
    if (input.workDate < cohort.startsOn || input.workDate > cohort.endsOn) throw new Error("DATE_OUT_OF_RANGE");
    if (input.workDate < earliestLeaveDate(today)) throw new Error("LEAVE_TOO_OLD");
    if (isWeekend(input.workDate) || (await attendanceRepository.isHoliday(cohort.id, input.workDate))) throw new Error("NOT_WORKDAY");
    // ลาทั้งวันแต่วันนั้นเช็คอินไปแล้ว = ไม่มีความหมาย ให้บอกพี่เลี้ยงแทน (แจ้งสายย้อนหลังหลังเช็คอินแล้วขอได้)
    if (input.kind === "leave" && (await attendanceRepository.findByDate(userId, input.workDate))) throw new Error("LEAVE_HAS_CHECKIN");
    if ((await leaveRepository.activeOf(userId, input.workDate, input.kind)).length > 0) throw new Error("LEAVE_EXISTS");

    await leaveRepository.add({ userId, ...input });
    await notificationService.toMentorsOf(userId, { kind: "leave", title: `${user.nickname || user.username} ${ASK_TH[input.kind]} วันที่ ${input.workDate}`, link: "/dev/admin?tab=leave" });
  },

  async mine(userId: number): Promise<LeaveRow[]> {
    return (await leaveRepository.mine(userId, 50)).map(toRow);
  },

  // ถอนใบที่ยังรออนุมัติของตัวเอง (ตัดสินแล้วแก้ไม่ได้ ให้บอกพี่เลี้ยง)
  async withdraw(userId: number, id: number) {
    const row = await leaveRepository.find(id);
    if (!row || row.userId !== userId) throw new Error("LEAVE_NOT_FOUND");
    if (row.status !== "pending") throw new Error("LEAVE_DECIDED");
    await leaveRepository.remove(id);
  },

  // ---- พี่เลี้ยง ----
  async list(cohortId: number, status: LeaveStatus | null): Promise<LeaveAdminRow[]> {
    const rows = await leaveRepository.ofCohort(cohortId, status, LIST_LIMIT);
    return rows.map((r) => ({ ...toRow(r.leave), userId: r.leave.userId, name: r.name || r.nickname || r.username }));
  },

  pendingCount: (cohortIds?: number[]) => leaveRepository.pendingCount(cohortIds),

  // อนุมัติ/ไม่อนุมัติ · ไม่อนุมัติต้องมีเหตุผล (ตรวจที่ validator) · ใบที่ตัดสินแล้วแก้ซ้ำไม่ได้
  async decide(actorId: number, id: number, input: { status: "approved" | "rejected"; note: string }) {
    const row = await leaveRepository.find(id);
    if (!row) throw new Error("LEAVE_NOT_FOUND");
    if (!(await leaveRepository.decide(id, { status: input.status, decidedBy: actorId, note: input.note || null }))) throw new Error("LEAVE_DECIDED");
    const user = await userRepository.findById(row.userId);
    const verdict = input.status === "approved" ? "อนุมัติ" : "ไม่อนุมัติ";
    await auditService.log(actorId, "leave.decide", `${user?.username ?? row.userId} ${row.workDate}`, `${KIND_TH[row.kind]} · ${verdict}${input.note ? ` · ${input.note}` : ""}`);
    await notificationService.toUser(row.userId, { kind: "leave", title: `${KIND_TH[row.kind]}วันที่ ${row.workDate}: พี่เลี้ยง${verdict}${input.note ? ` (${input.note})` : ""}`, link: "/checkin/leave" });
  },
};
