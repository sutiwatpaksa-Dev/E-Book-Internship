import type { LeaveAdminRow, LeaveStatus } from "@/lib/attendance";
import { jsonBody, request } from "./client";

export const adminLeaveApi = {
  list: (cohortId: number, status: LeaveStatus | null) => request<LeaveAdminRow[]>(`/admin/leave?cohortId=${cohortId}${status ? `&status=${status}` : ""}`),
  pendingCount: (cohorts?: string) => request<{ count: number }>(`/admin/leave/pending-count${cohorts ? `?cohorts=${encodeURIComponent(cohorts)}` : ""}`),
  decide: (id: number, status: "approved" | "rejected", note: string) => request<null>(`/admin/leave/${id}`, jsonBody("PUT", { status, note })),
};
