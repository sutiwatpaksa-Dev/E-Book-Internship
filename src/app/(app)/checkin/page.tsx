import type { Metadata } from "next";
import { TodayBoard } from "@/components/today-board";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "วันนี้ (เช็คอิน)" };

export default async function TodayPage() {
  await requirePageAccess("/checkin");
  return <TodayBoard />;
}
