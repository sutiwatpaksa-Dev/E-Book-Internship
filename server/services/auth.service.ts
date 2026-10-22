import { ipFailureRepository } from "../repositories/ip-failure.repository";
import { userRepository } from "../repositories/user.repository";
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
  async login(username: string, pin: string, ip: string, now = new Date()) {
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
    const valid = await Bun.password.verify(pin, user?.secretHash ?? DUMMY_HASH);

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
    return { id: user.id, username: user.username, role: user.role };
  },

  // บัญชียังใช้ได้อยู่ไหม (API เช็กทุกครั้ง ปิดบัญชีแล้วใช้ API ไม่ได้ทันที)
  async activeUser(id: number) {
    const u = await userRepository.findById(id);
    return u && !u.disabled ? { id: u.id, username: u.username, role: u.role } : null;
  },
};
