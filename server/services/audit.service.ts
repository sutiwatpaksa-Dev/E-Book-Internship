import { auditRepository } from "../repositories/audit.repository";

// ชื่อการกระทำเป็นรหัสคงที่ หน้าเว็บแปลเป็นภาษาคนเอง (เปลี่ยนคำที่แสดงได้โดยไม่ต้องแก้ข้อมูลเก่า)
export type AuditAction =
  | "user.create"
  | "user.reset_pin"
  | "user.disable"
  | "user.enable"
  | "user.unlock"
  | "user.role"
  | "file.requirement"
  | "thread.status";

const LIMIT = 200;

export const auditService = {
  log: (actorId: number, action: AuditAction, target: string, detail?: string) => auditRepository.add({ actorId, action, target, detail }),
  latest: () => auditRepository.latest(LIMIT),
};
