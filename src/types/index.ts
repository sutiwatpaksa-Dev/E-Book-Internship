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

// คำถามที่น้องเห็น (ของตัวเองเท่านั้น) · answer = null คือรอตอบ
export type Question = {
  id: number;
  pageUrl: string;
  body: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
};
// ที่พี่เลี้ยงเห็นเพิ่ม: ใครถาม ใครตอบ
export type AdminQuestion = Question & { askedBy: string; answeredBy: string | null };
