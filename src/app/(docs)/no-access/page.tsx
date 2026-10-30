import type { Metadata } from "next";
import Link from "next/link";
import { DocsBody, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";

export const metadata: Metadata = { title: "ไม่มีสิทธิ์" };

export default function NoAccessPage() {
  return (
    <DocsPage>
      <DocsTitle>บัญชีนี้ยังไม่มีสิทธิ์เปิดหน้านี้</DocsTitle>
      <DocsBody>
        <p>
          หน้านี้เปิดให้เฉพาะพี่เลี้ยง (role <strong>Dev</strong>) ถ้าคิดว่าควรเข้าได้ ให้ติดต่อพี่เลี้ยงเพื่อปรับสิทธิ์
        </p>
        <p>
          <Link href="/">← กลับหน้าแรก</Link>
        </p>
      </DocsBody>
    </DocsPage>
  );
}
