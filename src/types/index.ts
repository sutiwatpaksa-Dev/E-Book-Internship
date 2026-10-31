import type { CommentKind, CommentTemplate, Criterion, Scores } from "@/lib/rubric";
import type { RoundDef } from "@/lib/submission";
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
  // เจ้าของบัญชีกด "ลืมรหัสผ่าน" แล้วยังไม่มีใครออก PIN ให้
  resetRequestedAt: string | null;
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
} & Partial<MentorFields>;
// ช่องของพี่เลี้ยง (น้องในรุ่นที่พี่ดูแลเห็น ใช้กรอกเอกสารฝึกงาน) · schoolName/major ของพี่เลี้ยง = จบจากที่ไหน
export type MentorFields = {
  jobTitle: string | null;
  phone: string | null;
  email: string | null;
  expertise: string | null;
  lineId: string | null;
  instagram: string | null;
  facebook: string | null;
};
export type MentorContact = MentorFields & { username: string; fullName: string | null; nickname: string | null; schoolName: string | null; major: string | null };
export type Profile = ProfileFields & {
  username: string;
  role: Role;
  passwordSet: boolean;
  lastLoginAt: string | null;
  // รุ่นของน้อง (พี่เลี้ยงหรือน้องที่ยังไม่มีรุ่น = null)
  cohort: { name: string; startsOn: string; endsOn: string; endedAt: string | null; mentors: MentorContact[] } | null;
};

// รุ่นฝึกงาน (รูปร่างตรงกับ server/repositories/cohort.repository.ts) · วันที่เป็น YYYY-MM-DD
export type Cohort = {
  id: number;
  name: string;
  startsOn: string;
  endsOn: string;
  endedAt: string | null;
  internCount: number;
  mentorIds: number[];
  // สมัครเองด้วยรหัสรุ่น (ตัวรหัสไม่ส่งมา เห็นครั้งเดียวตอนสร้าง)
  hasInvite: boolean;
  signupOpen: boolean;
  signupUntil: string | null;
  seatLimit: number | null;
};
export type SignupSettings = Pick<Cohort, "signupOpen" | "signupUntil" | "seatLimit">;
// ข้อมูลที่หน้าสมัครส่ง (รหัสผ่านตรวจกติกาซ้ำที่ server)
export type RegisterInput = {
  code: string;
  username: string;
  password: string;
  fullName: string;
  nickname: string | null;
  schoolType: SchoolType;
  schoolName: string;
  major: string | null;
  eduLevel: EduLevel;
};
export type CohortInput = Pick<Cohort, "name" | "startsOn" | "endsOn">;

export type IssuedPin = { user: User; pin: string };
export type FileInfo = { size: number; updatedAt: string };

// โจทย์ฝึกงาน (รูปร่างตรงกับ server/db/schema.ts) · sections = หัวข้อกับเลขหน้าใน PDF ของโจทย์นั้น
export type AssignmentSection = { key: string; label: string; page: number };
export type Assignment = { slug: string; name: string; brief: string; sections: AssignmentSection[]; rounds: RoundDef[] };
// หลังบ้าน: + PDF ปัจจุบัน และรุ่นที่ใช้โจทย์นี้
export type AdminAssignment = Assignment & { id: number; pdf: FileInfo | null; cohortIds: number[]; criteria: Criterion[]; templates: CommentTemplate[] };
export type AssignmentInput = Pick<Assignment, "name" | "brief" | "sections" | "rounds"> & { criteria?: Criterion[]; templates?: CommentTemplate[] };

// เรื่องที่น้องคุยกับพี่เลี้ยง (รูปร่างตรงกับ server/routes/thread.routes.ts)
export type ThreadKind = "question" | "content_request" | "mentor_message";
// ประเภทที่น้องเปิดเองได้ (ข้อความจากพี่เลี้ยงเปิดได้เฉพาะฝั่งพี่เลี้ยง)
export type InternThreadKind = Exclude<ThreadKind, "mentor_message">;
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
export type Announcement = { id: number; body: string; audience: Audience; cohortId: number | null; startsAt: string; endsAt: string | null; author: string; createdAt: string };
export type AnnouncementInput = { body: string; audience: Audience; cohortId?: number | null; startsAt?: string; endsAt?: string | null };

export type CardOverride = { slug: string; hidden: boolean; title: string | null; minutes: number | null; topic: string | null };

export type Notification = { id: number; kind: string; title: string; link: string | null; readAt: string | null; createdAt: string };

// งานที่น้องส่ง (ลิงก์ repo + tag/commit บน GitHub) · verdict ว่าง = รอพี่เลี้ยงตรวจ
export type Submission = {
  id: number;
  assignment: string;
  assignmentName: string;
  round: string;
  roundLabel: string;
  repoUrl: string;
  ref: string;
  deployUrl: string | null;
  note: string;
  createdAt: string;
  verdict: "pass" | "revise" | null;
  review: string | null;
  reviewedAt: string | null;
  reviewer: string | null;
  // คะแนนรายข้อ ณ ตอนตรวจ · ว่าง = ตรวจแบบไม่ให้คะแนน
  scores: Scores | null;
};
export type MySubmissions = { assignments: { slug: string; name: string; rounds: RoundDef[] }[]; items: Submission[]; locked: boolean };
export type AdminSubmission = Submission & { userId: number; username: string; nickname: string | null; cohortId: number | null };
export type SubmitInput = { assignment: string; round: string; repoUrl: string; ref: string; deployUrl?: string; note: string };

// ความเห็นใต้งาน (เห็นเฉพาะน้องเจ้าของงานกับพี่เลี้ยง)
export type TaskComment = { id: number; kind: CommentKind; ref: string | null; body: string; createdAt: string; author: string; authorRole: Role };
export type CommentSend = { kind?: CommentKind; ref?: string; body: string };

// โพสต์งาน (ฟอร์มของพี่เลี้ยง) · day = วันทำงานที่ N ของรุ่น
export type PostSend = { label: string; what: string; day: number; deploy: boolean; body: string; links: { label: string; url: string }[] };
