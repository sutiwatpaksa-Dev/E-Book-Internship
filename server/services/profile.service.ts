import { userRepository } from "../repositories/user.repository";
import type { ProfileInput } from "../validators/profile.validator";

// โปรไฟล์ของตัวเองเท่านั้น (id มาจากบัตรผ่าน ไม่รับจากคำขอ) จึงแก้ของคนอื่นไม่ได้
// ส่งออกเฉพาะช่องโปรไฟล์ ไม่ส่งข้อมูลบัญชีอื่น (เช่นจำนวนครั้งที่ใส่ผิด)
const pick = (u: { fullName: string | null; nickname: string | null; schoolType: string | null; schoolName: string | null; major: string | null; eduLevel: string | null }) => ({
  fullName: u.fullName,
  nickname: u.nickname,
  schoolType: u.schoolType,
  schoolName: u.schoolName,
  major: u.major,
  eduLevel: u.eduLevel,
});

export const profileService = {
  async get(id: number) {
    const u = await userRepository.findById(id);
    if (!u) throw new Error("NOT_FOUND");
    return { username: u.username, role: u.role, passwordSet: u.secretKind === "password", ...pick(u) };
  },
  async update(id: number, input: ProfileInput) {
    const u = await userRepository.update(id, input);
    if (!u) throw new Error("NOT_FOUND");
    return pick(u);
  },
};
