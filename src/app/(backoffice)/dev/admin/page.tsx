import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin-panel";
import { pageTitles } from "@/lib/page-titles";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "หลังบ้านพี่เลี้ยง" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; t?: string; note?: string }> }) {
  // หน้านี้ไม่มีความลับในตัว (ข้อมูลมาจาก API ที่ตรวจสิทธิ์อีกชั้น) แต่ไม่ควรให้คนนอกเห็นหน้าตาเครื่องมือ
  await requirePageAccess("/dev/admin");
  const { tab, t, note } = await searchParams;
  // ?t= มาจากลิงก์ในแจ้งเตือน (เปิดเรื่องนั้นในแชท) · ?note= มาจากปุ่ม "เพิ่มโน้ตหน้านี้" ท้ายบทเรียน
  const threadId = Number(t);
  // key: กดลิงก์แจ้งเตือนขณะอยู่หน้านี้แล้ว Next ไม่สร้าง component ใหม่ ค่าเริ่มต้นใน useState จะไม่เปลี่ยนตาม URL จึงบังคับสร้างใหม่
  return <AdminPanel key={`${tab}-${t}-${note}`} titles={pageTitles()} initialTab={tab} initialThread={Number.isInteger(threadId) && threadId > 0 ? threadId : null} initialNote={note} />;
}
