import type { Metadata } from "next";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { ProfilePanel } from "@/components/profile-panel";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "โปรไฟล์ของฉัน" };

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const session = await requirePageAccess("/profile");
  const tab = (await searchParams).tab === "password" ? "password" : "info";
  return (
    <DocsPage>
      <DocsTitle>โปรไฟล์ของฉัน</DocsTitle>
      <DocsDescription>
        {session?.role === "dev" ? "ข้อมูลที่น้องในรุ่นของพี่ใช้ติดต่อและกรอกเอกสารฝึกงาน (ชื่อผู้ดูแล ตำแหน่ง เบอร์โทร) และเปลี่ยนรหัสผ่าน" : "ข้อมูลนี้พี่เลี้ยงเห็น ใช้รู้ว่าเรามาจากไหน เรียนสายอะไร · ไม่ต้องกรอกเบอร์โทรหรืออีเมล"}
      </DocsDescription>
      <DocsBody>
        <ProfilePanel initialTab={tab} />
      </DocsBody>
    </DocsPage>
  );
}
