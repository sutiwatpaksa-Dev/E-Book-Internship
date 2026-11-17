import type { Metadata } from "next";
import { LeaveBoard } from "@/components/leave-board";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "ส่งใบลา / แจ้งมาสาย" };

export default async function LeavePage() {
  // /checkin/leave อยู่ใต้กฎของ /checkin (เฉพาะน้อง)
  await requirePageAccess("/checkin/leave");
  return <LeaveBoard />;
}
