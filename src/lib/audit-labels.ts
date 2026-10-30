// คำอ่านง่ายของรหัสใน server/services/audit.service.ts (รหัสที่ไม่รู้จักแสดงตามเดิม)
export const AUDIT_LABEL: Record<string, string> = {
  "user.create": "สร้างบัญชี",
  "user.reset_pin": "ออก PIN ใหม่",
  "user.password": "ตั้งรหัสผ่าน",
  "user.disable": "ปิดบัญชี",
  "user.enable": "เปิดบัญชี",
  "user.unlock": "ปลดล็อก",
  "user.role": "เปลี่ยนบทบาท",
  "file.requirement": "อัปโหลดไฟล์",
  "assignment.create": "สร้างโจทย์",
  "assignment.update": "แก้โจทย์",
  "assignment.pdf": "อัปโหลด PDF โจทย์",
  "cohort.assignments": "ตั้งโจทย์ของรุ่น",
  "submission.review": "ตรวจงานที่ส่ง",
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
  "cohort.create": "สร้างรุ่น",
  "cohort.update": "แก้ข้อมูลรุ่น",
  "cohort.end": "จบรุ่น",
  "cohort.reopen": "เปิดรุ่นกลับ",
  "cohort.mentors": "ตั้งพี่เลี้ยงประจำรุ่น",
  "cohort.assign": "ย้ายน้องเข้ารุ่น",
  "cohort.invite": "สร้างรหัสรุ่นใหม่",
  "cohort.signup": "ตั้งค่ารับสมัคร",
  "user.register": "สมัครด้วยรหัสรุ่น",
  "user.reset_request": "ขอรีเซ็ตรหัสผ่าน",
};

// กลุ่มของรหัส ใช้กรองในหน้าบันทึก: ดูจากคำหน้าจุด (user.create → user → บัญชี)
export const AUDIT_GROUPS = [
  { id: "user", label: "บัญชี", prefixes: ["user", "cohort"] },
  { id: "content", label: "เนื้อหา", prefixes: ["card", "note", "announcement"] },
  { id: "thread", label: "แชทและงานที่ส่ง", prefixes: ["thread", "submission"] },
  { id: "file", label: "ไฟล์", prefixes: ["file", "assignment"] },
] as const;

export type AuditGroup = (typeof AUDIT_GROUPS)[number]["id"];

export const auditGroupOf = (action: string): AuditGroup | null => AUDIT_GROUPS.find((g) => (g.prefixes as readonly string[]).includes(action.split(".")[0]))?.id ?? null;
