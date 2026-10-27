import { todayTH } from "../../src/lib/cohort";
import { hashInvite } from "../lib/invite";
import { hashPin } from "../lib/pin";
import { cohortRepository } from "../repositories/cohort.repository";
import { ipFailureRepository } from "../repositories/ip-failure.repository";
import { userRepository } from "../repositories/user.repository";
import { passwordProblem } from "../validators/auth.validator";
import type { RegisterInput } from "../validators/register.validator";
import { auditService } from "./audit.service";

// ใส่รหัสรุ่นผิดได้ 10 ครั้งต่อชั่วโมงต่อ IP: คนพิมพ์ผิดจริงไม่ถึง แต่คนสุ่มเดาต้องใช้เวลาเป็นล้านปี
// ใช้ตารางนับเดียวกับ login แต่คนละกุญแจ (นำหน้าด้วย "register:") ผิดที่หนึ่งไม่ไปล็อกอีกที่
const MAX_FAILS = 10;
const WINDOW_MS = 60 * 60 * 1000;

// หารุ่นจากรหัส แล้วตรวจว่ายังรับอยู่ไหม · ใช้ทั้งตอนเช็กรหัส (ขั้นแรกของหน้าสมัคร) และตอนสมัครจริง
async function openCohort(code: string, ip: string, now: Date) {
  const key = `register:${ip}`;
  const windowStartAfter = new Date(now.getTime() - WINDOW_MS);
  const row = await ipFailureRepository.find(key);
  if (row && row.windowStart >= windowStartAfter && row.count >= MAX_FAILS) throw new Error("TOO_MANY_CODES");

  const c = await cohortRepository.findByInviteHash(hashInvite(code));
  if (!c) {
    await ipFailureRepository.increment(key, now, windowStartAfter);
    throw new Error("BAD_INVITE");
  }
  if (c.endedAt || !c.signupOpen || (c.signupUntil && todayTH(now) > c.signupUntil)) throw new Error("SIGNUP_CLOSED");
  // นับที่นั่งก่อนสร้างบัญชี: ถ้าสองคนกดพร้อมกันตอนเหลือที่สุดท้าย อาจเกินได้ 1 คน
  // ยอมรับได้สำหรับรุ่นฝึกงาน (พี่เลี้ยงย้ายออกได้) ดีกว่าล็อกตารางทุกครั้งที่มีคนสมัคร
  if (c.seatLimit && (await cohortRepository.internCount(c.id)) >= c.seatLimit) throw new Error("COHORT_FULL");
  return c;
}

export const registerService = {
  // ขั้นแรก: รหัสถูกไหม ถ้าถูกบอกชื่อรุ่นกับช่วงวัน น้องจะได้มั่นใจว่าสมัครถูกรุ่นก่อนกรอกต่อ
  async check(code: string, ip: string, now = new Date()) {
    const c = await openCohort(code, ip, now);
    return { name: c.name, startsOn: c.startsOn, endsOn: c.endsOn };
  },

  // สมัครจริง: ตรวจรหัสซ้ำ (หน้าเว็บอาจเปิดค้างจนรุ่นปิดรับไปแล้ว) แล้วสร้างบัญชีน้องในรุ่นนั้น
  // ตั้งรหัสผ่านเองตั้งแต่แรก จึงไม่ต้องผ่าน PIN ชั่วคราว (secretKind = password)
  async register(input: RegisterInput, ip: string, now = new Date()) {
    const c = await openCohort(input.code, ip, now);
    const problem = passwordProblem(input.password, input.username);
    if (problem) throw Object.assign(new Error("WEAK_PASSWORD"), { detail: problem });
    const { code: _code, password, ...profile } = input;
    const user = await userRepository.create({
      ...profile,
      role: "intern",
      cohortId: c.id,
      secretHash: await hashPin(password),
      secretKind: "password",
      lastLoginAt: now,
    });
    if (!user) throw new Error("USERNAME_TAKEN");
    await auditService.log(user.id, "user.register", user.username, c.name);
    return { id: user.id, username: user.username, role: user.role, ver: 0, tmp: false };
  },
};
