import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { cardByUrl, steps, stepUrl } from "@/data/learn";
import { requiredLinks } from "@/data/roadmap";
import { source } from "@/lib/source";
import { AskQuestion } from "./ask-question";
import { CardDone } from "./card-done";
import { CardHeader } from "./card-header";
import { CardPager } from "./card-pager";
import { MarkDoneButton } from "./mark-done-button";
import { getMDXComponents } from "./mdx";
import { PageNotes } from "./page-notes";
import { StepHeader, StepPager } from "./step-frame";

// หน้าในหมวดโจทย์ (/starter และหน้าย่อย)
const isProjectPage = (url: string) => url === "/starter" || url.startsWith("/starter/");

// วางหน้าเนื้อหาหนึ่งหน้าจากไฟล์ .mdx (ใช้ทั้งหน้าทั่วไปและหน้าที่ล็อก)
// top = ชิ้นที่วางใต้หัวเรื่อง (แถบสถานะของหน้าโจทย์)
export function DocPage({ slugs, top }: { slugs: string[] | undefined; top?: ReactNode }) {
  const page = source.getPage(slugs);
  if (!page) notFound();

  const MDX = page.data.body;
  // การ์ดของโครงใหม่ (/learn/cards/*): หัวการ์ดบอกตำแหน่งและเวลาอ่าน ปุ่ม "เข้าใจแล้ว" และปุ่มการ์ดก่อน/ถัดไปท้ายหน้า
  const card = cardByUrl(page.url);
  // หน้าขั้นของโครงใหม่ (/learn/coding ฯลฯ): หัวบอกขั้นที่เท่าไรและต้องได้อะไร ท้ายหน้ามีขั้นก่อน/ถัดไป
  const step = steps.find((s) => stepUrl(s.slug) === page.url) ?? null;
  return (
    // แถบ "ในบทนี้" ที่ติดด้านบนบนมือถือ: มีประโยชน์เฉพาะหน้ายาวที่มีหลายหัวข้อ หน้าที่มีไม่ถึง 3 หัวข้อไม่ต้องกินพื้นที่จอ
    <DocsPage toc={page.data.toc} full={page.data.full} breadcrumb={{ enabled: !card }} tableOfContentPopover={{ enabled: page.data.toc.length >= 3 }}>
      {!page.data.hideTitle && <DocsTitle>{page.data.title}</DocsTitle>}
      {page.data.description && <DocsDescription>{page.data.description}</DocsDescription>}
      {top}
      {/* เฉพาะบทหลักที่นับในความคืบหน้า (บทเสริมและหน้าอ้างอิงไม่มีปุ่มนี้) · หน้าโจทย์ไม่มี: ผ่านหรือไม่ดูจากผลตรวจของพี่เลี้ยง ไม่ใช่การติ๊กเอง */}
      {requiredLinks.includes(page.url) && !isProjectPage(page.url) && <MarkDoneButton link={page.url} />}
      {card && <CardHeader card={card} />}
      {step && <StepHeader step={step} />}
      <DocsBody>
        <MDX components={getMDXComponents()} />
        {page.url !== "/" && <PageNotes pageUrl={page.url} />}
        {card && <CardDone link={page.url} title={card.title} />}
        {card && <CardPager card={card} />}
        {step && <StepPager step={step} />}
      </DocsBody>
      {/* หน้าแรกเป็นแผนที่ ไม่ใช่บทเรียน จึงไม่มีกล่องถาม */}
      {page.url !== "/" && <AskQuestion pageUrl={page.url} />}
    </DocsPage>
  );
}

export function docMetadata(slugs: string[] | undefined) {
  const page = source.getPage(slugs);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
