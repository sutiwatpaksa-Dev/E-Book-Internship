import type { Role } from "@/types";
import { jsonBody, request } from "./client";

// mustSetPassword = เข้าด้วย PIN ชั่วคราว ต้องไปตั้งรหัสผ่านก่อน
type SessionInfo = { username: string; role: Role; mustSetPassword: boolean };

export const authApi = {
  login: (username: string, secret: string) => request<SessionInfo>("/auth/login", jsonBody("POST", { username, secret })),
  logout: () => request<null>("/auth/logout", { method: "POST" }),
  me: () => request<SessionInfo>("/auth/me"),
  // current ใส่เฉพาะตอนเปลี่ยนรหัสผ่านเดิม (ครั้งแรกจาก PIN ไม่ต้อง)
  setPassword: (password: string, current?: string) => request<SessionInfo>("/auth/password", jsonBody("POST", { password, current })),
};
