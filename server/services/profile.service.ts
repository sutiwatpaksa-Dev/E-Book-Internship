import { cohortRepository } from "../repositories/cohort.repository";
import { userRepository } from "../repositories/user.repository";
import type { Role } from "../db/schema";
import { INTERN_FIELDS, MENTOR_FIELDS, type ProfileInput } from "../validators/profile.validator";

// โปรไฟล์ของตัวเองเท่านั้น (id มาจากบัตรผ่าน ไม่รับจากคำขอ) จึงแก้ของคนอื่นไม่ได้
// ส่งออกเฉพาะช่องโปรไฟล์ของ role นั้น ไม่ส่งข้อมูลบัญชีอื่น (เช่นจำนวนครั้งที่ใส่ผิด)
type Row = Record<(typeof INTERN_FIELDS | typeof MENTOR_FIELDS)[number], string | null> & { role: Role };
const fieldsOf = (role: Role) => (role === "dev" ? MENTOR_FIELDS : INTERN_FIELDS);
const pick = (u: Row) => Object.fromEntries(fieldsOf(u.role).map((k) => [k, u[k]]));

export const profileService = {
  async get(id: number) {
    const u = await userRepository.findById(id);
    if (!u) throw new Error("NOT_FOUND");
    // น้องที่อยู่ในรุ่น: ส่งรุ่นและพี่เลี้ยงประจำรุ่นไปด้วย (การ์ดสรุปข้างฟอร์ม) · พี่เลี้ยงไม่มีรุ่น ได้ null
    const c = u.role === "intern" && u.cohortId ? await cohortRepository.findById(u.cohortId) : undefined;
    const cohort = c ? { name: c.name, startsOn: c.startsOn, endsOn: c.endsOn, endedAt: c.endedAt, mentors: await cohortRepository.mentorsOf(c.id) } : null;
    return { username: u.username, role: u.role, passwordSet: u.secretKind === "password", lastLoginAt: u.lastLoginAt, cohort, ...pick(u) };
  },
  // เก็บเฉพาะช่องของ role ตัวเอง: น้องส่งช่องตำแหน่งงาน (jobTitle) มาก็ไม่ถูกเก็บ
  async update(id: number, role: Role, input: ProfileInput) {
    const allowed = Object.fromEntries(fieldsOf(role).filter((k) => k in input).map((k) => [k, input[k]]));
    // ไม่เหลือช่องให้เก็บ (ส่งมาแต่ช่องของ role อื่น) = ไม่ต้องเขียน DB · Drizzle โยน "No values to set" ถ้า set ว่าง
    if (Object.keys(allowed).length > 0 && !(await userRepository.update(id, allowed))) throw new Error("NOT_FOUND");
    // update คืนแค่คอลัมน์ที่หลังบ้านใช้ อ่านแถวเต็มใหม่เพื่อส่งช่องของพี่เลี้ยงกลับไปด้วย
    return pick((await userRepository.findById(id))!);
  },
};
