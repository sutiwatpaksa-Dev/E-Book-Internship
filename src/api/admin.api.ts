import type { AuditEntry, BulkResult, FileInfo, IssuedPin, ProgressEntry, Role, ThreadDetail, ThreadStatus, ThreadSummary, User } from "@/types";
import { jsonBody, request } from "./client";

export const adminApi = {
  listUsers: () => request<User[]>("/admin/users"),
  createUser: (username: string, role: Role) => request<IssuedPin>("/admin/users", jsonBody("POST", { username, role })),
  createMany: (usernames: string[], role: Role) => request<BulkResult[]>("/admin/users/bulk", jsonBody("POST", { usernames, role })),
  // { userId: บทที่ผ่าน } ของทุกบัญชี
  progress: () => request<Record<number, ProgressEntry[]>>("/admin/progress"),
  audit: () => request<AuditEntry[]>("/admin/audit"),
  resetPin: (id: number) => request<IssuedPin>(`/admin/users/${id}/reset-pin`, { method: "POST" }),
  updateUser: (id: number, changes: { role?: Role; disabled?: boolean; unlock?: true }) =>
    request<User>(`/admin/users/${id}`, jsonBody("PATCH", changes)),
  getRequirementInfo: () => request<FileInfo | null>("/admin/requirement"),
  uploadRequirement: (file: File) =>
    request<FileInfo>("/admin/requirement", { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file }),
  listThreads: () => request<ThreadSummary[]>("/admin/threads"),
  unreadThreads: () => request<{ count: number }>("/admin/threads/unread"),
  getThread: (id: number) => request<ThreadDetail>(`/admin/threads/${id}`),
  replyThread: (id: number, body: string) => request<null>(`/admin/threads/${id}/messages`, jsonBody("POST", { body })),
  setThreadStatus: (id: number, status: ThreadStatus, note?: string) => request<null>(`/admin/threads/${id}`, jsonBody("PATCH", { status, note })),
};
