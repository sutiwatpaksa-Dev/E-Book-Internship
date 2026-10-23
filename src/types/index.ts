// type ที่หน้าเว็บใช้ร่วมกัน (รูปร่างตรงกับที่ API ใน server/ ตอบกลับ)
export type Role = "intern" | "dev";

export type User = {
  id: number;
  username: string;
  role: Role;
  disabled: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
};

export type IssuedPin = { user: User; pin: string };
export type FileInfo = { size: number; updatedAt: string };

// เรื่องที่น้องคุยกับพี่เลี้ยง (รูปร่างตรงกับ server/routes/thread.routes.ts)
export type ThreadKind = "question" | "content_request";
export type ThreadStatus = "waiting" | "answered" | "closed" | "new" | "accepted" | "in_progress" | "done" | "declined";

export type ThreadSummary = {
  id: number;
  kind: ThreadKind;
  subject: string;
  pageUrl: string | null;
  status: ThreadStatus;
  lastMessageAt: string;
  createdAt: string;
  // อีกฝั่งพิมพ์มาแล้วเรายังไม่ได้เปิดอ่าน
  unread: boolean;
  // ชื่อน้องเจ้าของเรื่อง (มีเฉพาะฝั่งพี่เลี้ยง)
  owner?: string;
};

export type ThreadMessage = {
  id: number;
  body: string;
  // true = บรรทัดที่ระบบบันทึกเอง เช่น "เปลี่ยนสถานะเป็น กำลังทำ"
  isSystem: boolean;
  createdAt: string;
  author: string;
  authorRole: Role;
};

export type ThreadDetail = {
  thread: Omit<ThreadSummary, "unread" | "owner" | "lastMessageAt">;
  messages: ThreadMessage[];
};

export type NewThread = { kind: ThreadKind; subject: string; body: string; pageUrl?: string };
