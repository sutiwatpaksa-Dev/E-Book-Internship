import { DEFAULT_ASSIGNMENT } from "../lib/assignment-access";
import { hashInvite, newInviteCode } from "../lib/invite";
import { assignmentRepository } from "../repositories/assignment.repository";
import { cohortRepository, type CohortFields, type SignupFields } from "../repositories/cohort.repository";
import { userRepository } from "../repositories/user.repository";
import { auditService } from "./audit.service";

async function found(id: number) {
  const c = await cohortRepository.findById(id);
  if (!c) throw new Error("COHORT_NOT_FOUND");
  return c;
}

// วันที่มาเป็นข้อความ YYYY-MM-DD จึงเทียบเป็นข้อความได้ตรงๆ
function checkPeriod(f: CohortFields) {
  if (f.endsOn < f.startsOn) throw new Error("INVALID_PERIOD");
}

export const cohortService = {
  list: () => cohortRepository.list(),

  async create(devId: number, f: CohortFields) {
    checkPeriod(f);
    const c = await cohortRepository.create(f);
    // รุ่นใหม่ได้ STARTER ไว้ก่อน (เปลี่ยนหรือเพิ่มโจทย์ได้ในหน้ารุ่น) น้องที่สมัครเข้ามาจะได้ไม่เจอหน้าโจทย์ว่าง
    const starter = await assignmentRepository.findBySlug(DEFAULT_ASSIGNMENT);
    if (starter) await assignmentRepository.setForCohort(c.id, [starter.id]);
    await auditService.log(devId, "cohort.create", f.name, `${f.startsOn} – ${f.endsOn}`);
    return c;
  },
  async update(devId: number, id: number, f: CohortFields) {
    await found(id);
    checkPeriod(f);
    await cohortRepository.update(id, f);
    await auditService.log(devId, "cohort.update", f.name, `${f.startsOn} – ${f.endsOn}`);
  },
  // จบรุ่น / เปิดรุ่นกลับ: เก็บเป็นเวลา ไม่ลบอะไร ข้อมูลน้องและความคืบหน้าอยู่ครบ
  async setEnded(devId: number, id: number, ended: boolean) {
    const c = await found(id);
    await cohortRepository.update(id, { endedAt: ended ? new Date() : null });
    await auditService.log(devId, ended ? "cohort.end" : "cohort.reopen", c.name);
  },
  async setMentors(devId: number, id: number, userIds: number[]) {
    const c = await found(id);
    const devs = new Set(await userRepository.activeIdsByRole(["dev"]));
    if (userIds.some((u) => !devs.has(u))) throw new Error("NOT_A_MENTOR");
    await cohortRepository.setMentors(id, [...new Set(userIds)]);
    await auditService.log(devId, "cohort.mentors", c.name, `${userIds.length} คน`);
  },
  async assign(devId: number, userIds: number[], cohortId: number | null) {
    const c = cohortId === null ? null : await found(cohortId);
    const moved = await cohortRepository.assign([...new Set(userIds)], cohortId);
    await auditService.log(devId, "cohort.assign", c?.name ?? "ไม่มีรุ่น", moved.map((u) => u.username).join(", ") || "–");
    return { moved: moved.length };
  },
  endedFor: (userId: number) => cohortRepository.endedFor(userId),

  // สร้างรหัสรุ่นใหม่ (รหัสเดิมใช้ไม่ได้ทันที) และเปิดรับสมัครไปด้วย เพราะสร้างรหัสก็คือจะส่งให้น้องสมัคร
  // คืนรหัสจริงครั้งเดียว DB เก็บแค่ hash ทำหายก็สร้างใหม่ ไม่มีทางดูย้อนหลัง
  async newInvite(devId: number, id: number) {
    const c = await found(id);
    if (c.endedAt) throw new Error("SIGNUP_CLOSED");
    const code = newInviteCode();
    await cohortRepository.update(id, { inviteHash: hashInvite(code), signupOpen: true });
    await auditService.log(devId, "cohort.invite", c.name);
    return { code };
  },
  async setSignup(devId: number, id: number, f: SignupFields) {
    const c = await found(id);
    await cohortRepository.update(id, f);
    const detail = f.signupOpen ? `เปิด${f.signupUntil ? ` ถึง ${f.signupUntil}` : ""}${f.seatLimit ? ` · ${f.seatLimit} ที่` : ""}` : "ปิด";
    await auditService.log(devId, "cohort.signup", c.name, detail);
  },
};
