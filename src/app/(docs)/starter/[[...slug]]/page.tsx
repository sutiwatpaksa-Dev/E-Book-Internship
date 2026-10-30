import { canReadStarterPage } from "@server/lib/assignment-access";
import { assignmentService } from "@server/services/assignment.service";
import { AssignmentNotice } from "@/components/assignment-notice";
import { DocPage, docMetadata } from "@/components/doc-page";
import { requirePageAccess } from "@/lib/require-page-access";

// หน้า Mini Project STARTER: ต้อง login ตรวจสิทธิ์ฝั่ง server ทุกครั้งก่อนส่งเนื้อหา
// จึงไม่สร้างเป็นไฟล์ static (ไฟล์ static ใครขอก็ได้ ไม่มีโอกาสตรวจ cookie)
type Props = { params: Promise<{ slug?: string[] }> };

export const dynamic = "force-dynamic";

export default async function Page({ params }: Props) {
  const slugs = ["starter", ...((await params).slug ?? [])];
  const session = await requirePageAccess(`/${slugs.join("/")}`);
  // น้องรุ่นที่ไม่ได้ทำ STARTER: หน้าที่ใช้กับทุกโจทย์อ่านได้ตามเดิม หน้าที่เขียนจากร้านค้าเห็นโจทย์ของรุ่นตัวเองแทน
  // (พี่เลี้ยงเห็นทุกหน้า)
  if (session?.role === "intern") {
    const list = await assignmentService.listFor({ id: session.userId, role: "intern" });
    if (!canReadStarterPage(slugs[1] ?? "", list.map((a) => a.slug))) return <AssignmentNotice list={list} />;
  }
  return <DocPage slugs={slugs} />;
}

export async function generateMetadata({ params }: Props) {
  return docMetadata(["starter", ...((await params).slug ?? [])]);
}
