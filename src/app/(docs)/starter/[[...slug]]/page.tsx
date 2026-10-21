import { DocPage, docMetadata } from "@/components/doc-page";
import { requirePageAccess } from "@/lib/require-page-access";

// หน้า Mini Project STARTER: ต้อง login ตรวจสิทธิ์ฝั่ง server ทุกครั้งก่อนส่งเนื้อหา
// จึงไม่สร้างเป็นไฟล์ static (ไฟล์ static ใครขอก็ได้ ไม่มีโอกาสตรวจ cookie)
type Props = { params: Promise<{ slug?: string[] }> };

export const dynamic = "force-dynamic";

export default async function Page({ params }: Props) {
  const slugs = ["starter", ...((await params).slug ?? [])];
  await requirePageAccess(`/${slugs.join("/")}`);
  return <DocPage slugs={slugs} />;
}

export async function generateMetadata({ params }: Props) {
  return docMetadata(["starter", ...((await params).slug ?? [])]);
}
