import type { HistoryView, TodayView } from "@/lib/attendance";
import { request } from "./client";

// เช็คอินไม่ส่งเวลาไปเลย (ไม่มี body): server ใช้เวลาของตัวเอง เครื่องน้องแก้เวลาแล้วก็ไม่มีผล
export const attendanceApi = {
  history: (month: string) => request<HistoryView>(`/attendance/history?month=${month}`),
  today: () => request<TodayView>("/attendance/today"),
  checkIn: () => request<TodayView>("/attendance/check-in", { method: "POST" }),
  checkOut: () => request<TodayView>("/attendance/check-out", { method: "POST" }),
};
