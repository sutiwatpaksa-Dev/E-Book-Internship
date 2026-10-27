// คำอ่านง่ายของรหัสใน server/services/audit.service.ts (รหัสที่ไม่รู้จักแสดงตามเดิม)
export const AUDIT_LABEL: Record<string, string> = {
  "user.create": "สร้างบัญชี",
  "user.reset_pin": "ออก PIN ใหม่",
  "user.disable": "ปิดบัญชี",
  "user.enable": "เปิดบัญชี",
  "user.unlock": "ปลดล็อก",
  "user.role": "เปลี่ยนบทบาท",
  "file.requirement": "อัปโหลดไฟล์",
  "thread.status": "เปลี่ยนสถานะเรื่อง",
  "card.create": "สร้างการ์ด",
  "card.update": "แก้การ์ด",
  "card.publish": "เผยแพร่การ์ด",
  "card.unpublish": "ถอนการ์ดเป็นร่าง",
  "card.delete": "ลบการ์ด",
  "card.override": "ปรับการ์ดในระบบ",
  "note.create": "เพิ่มโน้ต",
  "note.update": "แก้โน้ต",
  "note.delete": "ลบโน้ต",
  "announcement.create": "ประกาศ",
  "announcement.end": "ปิดประกาศ",
};

// กลุ่มของรหัส ใช้กรองในหน้าบันทึก: ดูจากคำหน้าจุด (user.create → user → บัญชี)
export const AUDIT_GROUPS = [
  { id: "user", label: "บัญชี", prefixes: ["user"] },
  { id: "content", label: "เนื้อหา", prefixes: ["card", "note", "announcement"] },
  { id: "thread", label: "แชท", prefixes: ["thread"] },
  { id: "file", label: "ไฟล์", prefixes: ["file"] },
] as const;

export type AuditGroup = (typeof AUDIT_GROUPS)[number]["id"];

export const auditGroupOf = (action: string): AuditGroup | null => AUDIT_GROUPS.find((g) => (g.prefixes as readonly string[]).includes(action.split(".")[0]))?.id ?? null;
