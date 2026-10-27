import type { Metadata } from "next";
import { DocsBody, DocsPage } from "fumadocs-ui/layouts/docs/page";
import { AskQuestion } from "@/components/ask-question";
import { MentorCardView } from "@/components/mentor-card-view";
import { mentorCardUrl } from "@/data/learn";

export const metadata: Metadata = { title: "การ์ดจากพี่เลี้ยง" };

// การ์ดที่พี่เลี้ยงเขียนจากหลังบ้าน: เนื้อหาอยู่ใน DB ไม่ใช่ไฟล์ MDX จึงมี route ของตัวเอง
// route นี้เจาะจงกว่า (docs)/[[...slug]] Next จึงเลือกตัวนี้ก่อน · หน้านี้ไม่มีความลับในตัว เนื้อหาดึงผ่าน API ที่ตรวจ login อีกชั้น
export default async function MentorCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <DocsPage breadcrumb={{ enabled: false }}>
      <DocsBody>
        <MentorCardView slug={slug} />
      </DocsBody>
      <AskQuestion pageUrl={mentorCardUrl(slug)} />
    </DocsPage>
  );
}
