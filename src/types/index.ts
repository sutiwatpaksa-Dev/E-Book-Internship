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
