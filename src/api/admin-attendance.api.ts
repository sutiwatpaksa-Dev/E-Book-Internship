import type { DayView, HolidayRow, RulesView } from "@/lib/attendance";
import { jsonBody, request } from "./client";

export type EditTimeInput = { userId: number; workDate: string; checkIn: string; checkOut: string | null; reason: string };

export type NewRuleInput = { cohortId: number; effectiveFrom: string; workStart: string; workEnd: string; lateGraceMinutes: number };

export const adminAttendanceApi = {
  day: (cohortId: number, date: string) => request<DayView>(`/admin/attendance/day?cohortId=${cohortId}&date=${date}`),
  editTime: (input: EditTimeInput) => request<null>("/admin/attendance/records", jsonBody("PUT", input)),
  holidays: (cohortId: number) => request<HolidayRow[]>(`/admin/attendance/holidays?cohortId=${cohortId}`),
  addHoliday: (cohortId: number, date: string, note: string) => request<null>("/admin/attendance/holidays", jsonBody("POST", { cohortId, date, note })),
  removeHoliday: (id: number) => request<null>(`/admin/attendance/holidays/${id}`, { method: "DELETE" }),
  rules: (cohortId: number) => request<RulesView>(`/admin/attendance/rules?cohortId=${cohortId}`),
  addRule: (input: NewRuleInput) => request<null>("/admin/attendance/rules", jsonBody("POST", input)),
  removeRule: (id: number) => request<null>(`/admin/attendance/rules/${id}`, { method: "DELETE" }),
};
