import type { Metadata } from "next";
import { HistoryBoard } from "@/components/history-board";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "ประวัติเข้างานของฉัน" };

export default async function HistoryPage() {
  // /checkin/history อยู่ใต้กฎของ /checkin (เฉพาะน้อง)
  await requirePageAccess("/checkin/history");
  return <HistoryBoard />;
}
