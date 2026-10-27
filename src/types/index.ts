// type ที่หน้าเว็บใช้ร่วมกัน (รูปร่างตรงกับที่ API ใน server/ ตอบกลับ)
export type Role = "intern" | "dev";

export type User = {
  id: number;
  username: string;
  role: Role;
  // พี่เลี้ยงที่จัดการบัญชีพี่เลี้ยงคนอื่นได้ (มีความหมายเฉพาะ role dev)
  superAdmin: boolean;
  disabled: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  // รุ่นของน้อง · null = พี่เลี้ยง หรือบัญชีที่ยังไม่ได้อยู่รุ่นไหน
  cohortId: number | null;
  // pin = ยังไม่ได้ตั้งรหัสผ่านเอง
  secretKind: "pin" | "password";
} & ProfileFields;

export type SchoolType = "university" | "vocational" | "other";
export type EduLevel = "pvc" | "pvs" | "bachelor" | "other";
// โปรไฟล์ที่เจ้าของบัญชีกรอกเอง ว่างได้ทุกช่อง
export type ProfileFields = {
  fullName: string | null;
  nickname: string | null;
  schoolType: SchoolType | null;
  schoolName: string | null;
  major: string | null;
  eduLevel: EduLevel | null;
};
export type Profile = ProfileFields & { username: string; role: Role; passwordSet: boolean };

// รุ่นฝึกงาน (รูปร่างตรงกับ server/repositories/cohort.repository.ts) · วันที่เป็น YYYY-MM-DD
export type Cohort = {
  id: number;
  name: string;
  startsOn: string;
  endsOn: string;
  endedAt: string | null;
  internCount: number;
  mentorIds: number[];
};
export type CohortInput = Pick<Cohort, "name" | "startsOn" | "endsOn">;

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

// บทที่ผ่านแล้ว (รูปร่างตรงกับ server/routes/progress.routes.ts)
export type ProgressEntry = { link: string; doneAt: string };

// หลังบ้าน: บันทึกการกระทำ และผลการสร้างบัญชีทีละหลายคน
export type AuditEntry = { id: number; actor: string; action: string; target: string; detail: string | null; createdAt: string };
export type BulkResult = { username: string; pin: string } | { username: string; error: string };

// ---- เนื้อหาที่พี่เลี้ยงเพิ่มจากหลังบ้าน (รูปร่างตรงกับ server/routes/content.routes.ts และ admin-content.routes.ts) ----
export type CardStatus = "draft" | "published";

export type MentorCardSummary = {
  id: number;
  slug: string;
  title: string;
  step: string;
  topic: string;
  minutes: number;
  needs: string[];
  status: CardStatus;
  author: string;
  publishedAt: string | null;
  updatedAt: string;
};
export type MentorCard = MentorCardSummary & { body: string };
// ข้อมูลที่ส่งตอนสร้าง/แก้การ์ด (slug ส่งเฉพาะตอนสร้าง)
export type MentorCardInput = Pick<MentorCard, "slug" | "title" | "step" | "topic" | "minutes" | "needs" | "body">;

export type PageNote = { id: number; pageUrl: string; body: string; visible: boolean; author: string; updatedAt: string };
export type PageNoteInput = Pick<PageNote, "pageUrl" | "body" | "visible">;

export type Audience = "intern" | "dev" | "all";
export type Announcement = { id: number; body: string; audience: Audience; startsAt: string; endsAt: string | null; author: string; createdAt: string };
export type AnnouncementInput = { body: string; audience: Audience; startsAt?: string; endsAt?: string | null };

export type CardOverride = { slug: string; hidden: boolean; title: string | null; minutes: number | null; topic: string | null };

export type Notification = { id: number; kind: string; title: string; link: string | null; readAt: string | null; createdAt: string };
