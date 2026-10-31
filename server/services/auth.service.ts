import { hashPin } from "../lib/pin";
import { ipFailureRepository } from "../repositories/ip-failure.repository";
import { userRepository } from "../repositories/user.repository";
import { passwordProblem } from "../validators/auth.validator";
import { cohortRepository } from "../repositories/cohort.repository";
import { auditService } from "./audit.service";
import { notificationService } from "./notification.service";
import { userService } from "./user.service";

const USER_MAX_FAILS = 5;
const USER_LOCK_MS = 15 * 60 * 1000;
const IP_MAX_FAILS = 20;
const IP_WINDOW_MS = 15 * 60 * 1000;
// ขอรีเซ็ตได้ 5 ครั้งต่อชั่วโมงต่อ IP (นับทุกครั้ง ไม่ว่าชื่อมีจริงไหม) กันคนยิงชื่อมั่วจนพี่เลี้ยงโดนแจ้งเตือนรัว
const RESET_MAX = 5;
const RESET_WINDOW_MS = 60 * 60 * 1000;

// ใช้ตอนไม่พบ username: ยังเสียเวลา verify เท่าเดิม คนร้ายจับเวลาตอบไม่ได้ว่าชื่อไหนมีอยู่จริง
const DUMMY_HASH = await Bun.password.hash("000000");

// เช็กบัญชี Dev คนแรกครั้งเดียวต่อเครื่อง (ไม่ต้องถาม DB ทุกครั้งที่ login)
let firstDevChecked: Promise<void> | undefined;

// กฎของการ login อยู่ที่นี่ทั้งหมด ไม่รู้จัก HTTP (ส่งผลเป็นรหัส ให้ routes แปลงเป็น status เอง)
export const authService = {
  async login(username: string, secret: string, ip: string, now = new Date()) {
    firstDevChecked ??= userService.ensureFirstDev().catch((e) => {
      firstDevChecked = undefined; // ล้มให้ลองใหม่รอบหน้า
      throw e;
    });
    await firstDevChecked;
    const windowStartAfter = new Date(now.getTime() - IP_WINDOW_MS);
    const ipRow = await ipFailureRepository.find(ip);
    if (ipRow && ipRow.windowStart >= windowStartAfter && ipRow.count >= IP_MAX_FAILS) {
      throw new Error("TOO_MANY_ATTEMPTS");
    }

    const user = await userRepository.findByUsername(username);
    const locked = !!user?.lockedUntil && user.lockedUntil > now;
    const valid = await Bun.password.verify(secret, user?.secretHash ?? DUMMY_HASH);

    if (!user || user.disabled || locked || !valid) {
      await ipFailureRepository.increment(ip, now, windowStartAfter);
      if (user && !locked && !valid) {
        const fails = user.failedCount + 1;
        await userRepository.update(
          user.id,
          fails >= USER_MAX_FAILS ? { failedCount: 0, lockedUntil: new Date(now.getTime() + USER_LOCK_MS) } : { failedCount: fails },
        );
      }
      // รหัสเดียวกันทุกกรณี ไม่บอกว่าผิดที่ชื่อ ผิดที่ PIN หรือถูกล็อก
      throw new Error("INVALID_LOGIN");
    }

    // PIN ที่ออกใหม่หมดอายุแล้ว: บอกตรงๆ ได้ เพราะคนที่เห็นข้อความนี้ต้องรู้ PIN ที่ถูกอยู่แล้ว
    if (user.secretKind === "pin" && user.pinExpiresAt && user.pinExpiresAt < now) throw new Error("PIN_EXPIRED");
    await userRepository.update(user.id, { failedCount: 0, lockedUntil: null, lastLoginAt: now });
    // tmp: เข้าด้วย PIN ชั่วคราว → บัตรนี้ใช้ได้แค่ตั้งรหัสผ่าน (ด่านหน้าเว็บและ API ตรวจทั้งคู่)
    return { id: user.id, username: user.username, role: user.role, ver: user.sessionVersion, tmp: user.secretKind === "pin" };
  },

  // สลับบัญชีในเครื่อง (route ตรวจ devSwitchAllowed ก่อนเรียก: ไม่ใช่ production + ฐานและเว็บอยู่ในเครื่อง) · ไม่ตรวจรหัสผ่าน
  // รายการให้เลือกมีแค่บัญชีตัวอย่าง demo.* แต่สลับกลับบัญชีเดิมของตัวเองในฐานเครื่องได้ (หน้าเว็บจำชื่อไว้ให้)
  devAccounts: () => userRepository.demoAccounts(),
  async devSwitch(username: string) {
    const user = await userRepository.findByUsername(username);
    if (!user || user.disabled) throw new Error("NOT_FOUND");
    return { id: user.id, username: user.username, role: user.role, ver: user.sessionVersion, tmp: false };
  },

  // บัญชียังใช้ได้อยู่ไหม (API เช็กทุกครั้ง ปิดบัญชีแล้วใช้ API ไม่ได้ทันที)
  // ver ไม่ตรง = บัตรรุ่นเก่า (เปลี่ยนรหัสผ่านหรือออก PIN ใหม่ไปแล้ว) ถือว่าไม่ได้ login
  ping: (userId: number) => userRepository.touchSeen(userId),

  async activeUser(id: number, ver?: number) {
    const u = await userRepository.findById(id);
    if (!u || u.disabled || (ver !== undefined && ver !== u.sessionVersion)) return null;
    return { id: u.id, username: u.username, role: u.role, superAdmin: u.role === "dev" && u.superAdmin, mustSetPassword: u.secretKind === "pin" };
  },

  // ตั้งรหัสผ่านเอง: ครั้งแรก (จาก PIN ชั่วคราว) ไม่ต้องใส่รหัสเดิม เพราะเพิ่งพิสูจน์ด้วย PIN มาแล้ว
  // เปลี่ยนรหัสผ่านทีหลัง ต้องใส่รหัสเดิมเสมอ กันคนที่ยืมเครื่องที่ login ค้างไว้มาเปลี่ยนแทน
  // เสร็จแล้ว +1 เลขรอบ: บัตรของเครื่องอื่นใช้ไม่ได้ทันที (routes ออกบัตรใหม่ให้เครื่องนี้)
  async setPassword(id: number, current: string | undefined, password: string) {
    const u = await userRepository.findById(id);
    if (!u || u.disabled) throw new Error("NOT_FOUND");
    if (u.secretKind === "password" && !(await Bun.password.verify(current ?? "", u.secretHash))) throw new Error("WRONG_PASSWORD");
    const problem = passwordProblem(password, u.username);
    if (problem) throw Object.assign(new Error("WEAK_PASSWORD"), { detail: problem });
    if (await Bun.password.verify(password, u.secretHash)) throw new Error("SAME_PASSWORD");
    const ver = u.sessionVersion + 1;
    await userRepository.update(id, { secretHash: await hashPin(password), secretKind: "password", sessionVersion: ver, failedCount: 0, lockedUntil: null, pinExpiresAt: null, resetRequestedAt: null });
    await auditService.log(id, "user.password", u.username);
    return { id: u.id, username: u.username, role: u.role, ver, tmp: false };
  },

  // ลืมรหัสผ่าน: ไม่ส่งอะไรทางอีเมล (ระบบไม่มีอีเมลน้อง) แต่ขึ้นเป็นงานให้พี่เลี้ยงออก PIN ใหม่
  // ตอบเหมือนกันทุกกรณี (มีชื่อนี้ / ไม่มี / ปิดบัญชี / ขอซ้ำ) คนนอกจึงใช้หน้านี้เดาว่าชื่อไหนมีจริงไม่ได้
  async requestReset(username: string, ip: string, now = new Date()) {
    const key = `reset:${ip}`;
    const windowStartAfter = new Date(now.getTime() - RESET_WINDOW_MS);
    const row = await ipFailureRepository.find(key);
    if (row && row.windowStart >= windowStartAfter && row.count >= RESET_MAX) throw new Error("TOO_MANY_RESETS");
    await ipFailureRepository.increment(key, now, windowStartAfter);

    const u = await userRepository.findByUsername(username);
    // ขอซ้ำภายใน 30 นาที: ไม่แจ้งพี่เลี้ยงซ้ำ (งานเดิมยังค้างอยู่ในหลังบ้าน)
    const recent = !!u?.resetRequestedAt && now.getTime() - u.resetRequestedAt.getTime() < RESET_WINDOW_MS / 2;
    if (!u || u.disabled || recent) return;
    await userRepository.update(u.id, { resetRequestedAt: now });
    await auditService.log(u.id, "user.reset_request", u.username);
    // ผู้รับ: บัญชีพี่เลี้ยง → Super admin (คนเดียวที่ออก PIN ให้พี่เลี้ยงได้) · น้อง → พี่เลี้ยงประจำรุ่น ถ้าไม่มีก็พี่เลี้ยงทุกคน
    const to =
      u.role === "dev"
        ? await userRepository.activeSuperAdminIds()
        : (u.cohortId && (await cohortRepository.mentorIdsOf(u.cohortId)).length ? await cohortRepository.mentorIdsOf(u.cohortId) : await userRepository.activeIdsByRole(["dev"]));
    await notificationService.toUsers(to.filter((id) => id !== u.id), { kind: "reset_request", title: `${u.nickname || u.username} ขอรีเซ็ตรหัสผ่าน`, link: "/dev/admin?tab=users" });
  },
};
