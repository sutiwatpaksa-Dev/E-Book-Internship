import type { Metadata } from "next";
import { DocsBody, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { AdminPanel } from "@/components/admin-panel";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "จัดการบัญชี" };

export default async function AdminPage() {
  // หน้านี้ไม่มีความลับในตัว (ข้อมูลมาจาก API ที่ตรวจสิทธิ์อีกชั้น) แต่ไม่ควรให้คนนอกเห็นหน้าตาเครื่องมือ
  await requirePageAccess("/dev/admin");
  return (
    <DocsPage full>
      <DocsTitle>⚙️ จัดการบัญชี</DocsTitle>
      <DocsBody>
        <p>สำหรับพี่เลี้ยง (role <strong>Dev</strong>) เพิ่มบัญชีน้อง ออก PIN ใหม่ ปลดล็อก ปิดบัญชี และอัปโหลดไฟล์ Requirement</p>
        <ul>
          <li>
            <strong>PIN แสดงครั้งเดียว</strong> ตอนสร้างหรือออกใหม่ ระบบเก็บแค่ hash จึงดูย้อนหลังไม่ได้ ถ้าน้องลืมให้กด "ออก PIN ใหม่"
          </li>
          <li>
            <strong>กรอก PIN ผิด 5 ครั้ง</strong> บัญชีจะล็อก 15 นาที กดปลดล็อกได้ทันทีที่นี่
          </li>
          <li>
            <strong>ปิดบัญชีแล้ว</strong> น้องเรียก API (เช่นเปิด PDF) ไม่ได้ทันที แต่หน้า STARTER จะเปิดได้จนบัตรผ่านหมดอายุ (ไม่เกิน 12 ชั่วโมง)
          </li>
        </ul>
        <AdminPanel />
      </DocsBody>
    </DocsPage>
  );
}
