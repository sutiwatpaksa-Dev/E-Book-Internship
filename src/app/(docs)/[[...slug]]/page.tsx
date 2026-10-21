import { DocPage, docMetadata } from "@/components/doc-page";
import { isLocked } from "@/lib/page-access";
import { source } from "@/lib/source";

// หน้าที่เปิดให้ทุกคน: สร้างเป็นไฟล์ static ตอน build เสิร์ฟเร็วและไม่เปลืองเครื่อง
// หน้าที่ล็อก (/starter) อยู่อีก route หนึ่ง เพราะต้องสร้างใหม่ทุกครั้งตาม cookie ของคนที่ขอ
type Props = { params: Promise<{ slug?: string[] }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return source
    .getPages()
    .filter((page) => !isLocked(page.url))
    .map((page) => ({ slug: page.slugs }));
}

export default async function Page({ params }: Props) {
  return <DocPage slugs={(await params).slug} />;
}

export async function generateMetadata({ params }: Props) {
  return docMetadata((await params).slug);
}
