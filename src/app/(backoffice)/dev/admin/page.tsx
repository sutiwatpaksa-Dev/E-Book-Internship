import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";
import { pageTitles } from "@/lib/page-titles";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "หลังบ้านพี่เลี้ยง" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  // หน้านี้ไม่มีความลับในตัว (ข้อมูลมาจาก API ที่ตรวจสิทธิ์อีกชั้น) แต่ไม่ควรให้คนนอกเห็นหน้าตาเครื่องมือ
  await requirePageAccess("/dev/admin");
  return <AdminPanel titles={pageTitles()} initialTab={(await searchParams).tab} />;
}
