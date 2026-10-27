import { hashPin } from "../lib/pin";
import { ipFailureRepository } from "../repositories/ip-failure.repository";
import { userRepository } from "../repositories/user.repository";
import { passwordProblem } from "../validators/auth.validator";
import { auditService } from "./audit.service";
import { userService } from "./user.service";

const USER_MAX_FAILS = 5;
const USER_LOCK_MS = 15 * 60 * 1000;
const IP_MAX_FAILS = 20;
const IP_WINDOW_MS = 15 * 60 * 1000;

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

    await userRepository.update(user.id, { failedCount: 0, lockedUntil: null, lastLoginAt: now });
    // tmp: เข้าด้วย PIN ชั่วคราว → บัตรนี้ใช้ได้แค่ตั้งรหัสผ่าน (ด่านหน้าเว็บและ API ตรวจทั้งคู่)
    return { id: user.id, username: user.username, role: user.role, ver: user.sessionVersion, tmp: user.secretKind === "pin" };
  },

  // บัญชียังใช้ได้อยู่ไหม (API เช็กทุกครั้ง ปิดบัญชีแล้วใช้ API ไม่ได้ทันที)
  // ver ไม่ตรง = บัตรรุ่นเก่า (เปลี่ยนรหัสผ่านหรือออก PIN ใหม่ไปแล้ว) ถือว่าไม่ได้ login
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
    await userRepository.update(id, { secretHash: await hashPin(password), secretKind: "password", sessionVersion: ver, failedCount: 0, lockedUntil: null });
    await auditService.log(id, "user.password", u.username);
    return { id: u.id, username: u.username, role: u.role, ver, tmp: false };
  },
};
