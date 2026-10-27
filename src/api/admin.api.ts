import type { AuditEntry, BulkResult, Cohort, CohortInput, FileInfo, IssuedPin, ProgressEntry, Role, ThreadDetail, ThreadStatus, ThreadSummary, User } from "@/types";
import { jsonBody, request } from "./client";

export const adminApi = {
  listUsers: () => request<User[]>("/admin/users"),
  me: () => request<{ id: number; superAdmin: boolean }>("/admin/me"),
  createUser: (username: string, role: Role, cohortId: number | null) => request<IssuedPin>("/admin/users", jsonBody("POST", { username, role, cohortId })),
  createMany: (usernames: string[], role: Role, cohortId: number | null) => request<BulkResult[]>("/admin/users/bulk", jsonBody("POST", { usernames, role, cohortId })),
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
  listCohorts: () => request<Cohort[]>("/admin/cohorts"),
  createCohort: (input: CohortInput) => request<{ id: number }>("/admin/cohorts", jsonBody("POST", input)),
  updateCohort: (id: number, input: CohortInput) => request<null>(`/admin/cohorts/${id}`, jsonBody("PUT", input)),
  setCohortEnded: (id: number, ended: boolean) => request<null>(`/admin/cohorts/${id}/${ended ? "end" : "reopen"}`, { method: "POST" }),
  setCohortMentors: (id: number, userIds: number[]) => request<null>(`/admin/cohorts/${id}/mentors`, jsonBody("PUT", { userIds })),
  assignCohort: (userIds: number[], cohortId: number | null) => request<{ moved: number }>("/admin/cohorts/assign", jsonBody("POST", { userIds, cohortId })),
  setThreadStatus: (id: number, status: ThreadStatus, note?: string) => request<null>(`/admin/threads/${id}`, jsonBody("PATCH", { status, note })),
};
