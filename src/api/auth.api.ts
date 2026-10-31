import type { RegisterInput, Role } from "@/types";
import { jsonBody, request } from "./client";

// mustSetPassword = เข้าด้วย PIN ชั่วคราว ต้องไปตั้งรหัสผ่านก่อน
type SessionInfo = { username: string; role: Role; mustSetPassword: boolean };

export const authApi = {
  login: (username: string, secret: string) => request<SessionInfo>("/auth/login", jsonBody("POST", { username, secret })),
  // ปุ่มสลับบัญชีทดสอบ (มีเฉพาะในเครื่อง · production ตอบ 404)
  devAccounts: () => request<{ username: string; role: Role }[]>("/auth/dev-accounts"),
  devSwitch: (username: string) => request<SessionInfo>("/auth/dev-switch", jsonBody("POST", { username })),
  logout: () => request<null>("/auth/logout", { method: "POST" }),
  me: () => request<SessionInfo>("/auth/me"),
  // current ใส่เฉพาะตอนเปลี่ยนรหัสผ่านเดิม (ครั้งแรกจาก PIN ไม่ต้อง)
  // สมัครด้วยรหัสรุ่น: เช็กรหัสก่อน (ได้ชื่อรุ่นกลับมาโชว์) แล้วค่อยส่งฟอร์มเต็ม สำเร็จแล้ว login ให้เลย
  checkInvite: (code: string) => request<{ name: string; startsOn: string; endsOn: string }>("/auth/register/check", jsonBody("POST", { code })),
  register: (input: RegisterInput) => request<SessionInfo>("/auth/register", jsonBody("POST", input)),
  // ลืมรหัสผ่าน: ได้ { ok: true } เสมอ ไม่ว่าชื่อนี้มีจริงไหม
  forgot: (username: string) => request<{ ok: true }>("/auth/forgot", jsonBody("POST", { username })),
  setPassword: (password: string, current?: string) => request<SessionInfo>("/auth/password", jsonBody("POST", { password, current })),
};
