import type { AdminAssignment, AssignmentInput, AuditEntry, BulkResult, Cohort, CohortInput, SignupSettings, FileInfo, IssuedPin, ProgressEntry, Role, ThreadDetail, ThreadStatus, ThreadSummary, User } from "@/types";
import { jsonBody, request } from "./client";

export const adminApi = {
  listUsers: () => request<User[]>("/admin/users"),
  me: () => request<{ id: number; superAdmin: boolean }>("/admin/me"),
  createUser: (username: string, role: Role, cohortId: number | null) => request<IssuedPin>("/admin/users", jsonBody("POST", { username, role, cohortId })),
  createMany: (usernames: string[], role: Role, cohortId: number | null) => request<BulkResult[]>("/admin/users", jsonBody("POST", { usernames, role, cohortId })),
  // { userId: บทที่ผ่าน } ของทุกบัญชี
  progress: () => request<Record<number, ProgressEntry[]>>("/admin/progress"),
  audit: () => request<AuditEntry[]>("/admin/audit"),
  resetPin: (id: number) => request<IssuedPin>(`/admin/users/${id}/pins`, { method: "POST" }),
  updateUser: (id: number, changes: { role?: Role; disabled?: boolean; unlock?: true }) =>
    request<User>(`/admin/users/${id}`, jsonBody("PATCH", changes)),
  listAssignments: () => request<AdminAssignment[]>("/admin/assignments"),
  createAssignment: (slug: string, input: AssignmentInput) => request<{ id: number }>("/admin/assignments", jsonBody("POST", { slug, ...input })),
  updateAssignment: (id: number, input: AssignmentInput) => request<null>(`/admin/assignments/${id}`, jsonBody("PUT", input)),
  uploadAssignmentPdf: (id: number, file: File) =>
    request<FileInfo>(`/admin/assignments/${id}/pdf`, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file }),
  setCohortAssignments: (id: number, assignmentIds: number[]) => request<null>(`/admin/cohorts/${id}/assignments`, jsonBody("PUT", { assignmentIds })),
  listThreads: () => request<ThreadSummary[]>("/admin/threads"),
  unreadThreads: () => request<{ count: number }>("/admin/threads/unread-count"),
  getThread: (id: number) => request<ThreadDetail>(`/admin/threads/${id}`),
  replyThread: (id: number, body: string) => request<null>(`/admin/threads/${id}/messages`, jsonBody("POST", { body })),
  listCohorts: () => request<Cohort[]>("/admin/cohorts"),
  createCohort: (input: CohortInput) => request<{ id: number }>("/admin/cohorts", jsonBody("POST", input)),
  updateCohort: (id: number, input: CohortInput) => request<null>(`/admin/cohorts/${id}`, jsonBody("PUT", input)),
  setCohortEnded: (id: number, ended: boolean) => request<null>(`/admin/cohorts/${id}`, jsonBody("PATCH", { ended })),
  setCohortMentors: (id: number, userIds: number[]) => request<null>(`/admin/cohorts/${id}/mentors`, jsonBody("PUT", { userIds })),
  newInvite: (id: number) => request<{ code: string }>(`/admin/cohorts/${id}/invite`, { method: "POST" }),
  setSignup: (id: number, s: SignupSettings) => request<null>(`/admin/cohorts/${id}/signup`, jsonBody("PUT", s)),
  assignCohort: (userIds: number[], cohortId: number | null) => request<{ moved: number }>("/admin/users", jsonBody("PATCH", { userIds, cohortId })),
  setThreadStatus: (id: number, status: ThreadStatus, note?: string) => request<null>(`/admin/threads/${id}`, jsonBody("PATCH", { status, note })),
};
