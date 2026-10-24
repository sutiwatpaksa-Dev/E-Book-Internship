import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { cardByUrl } from "@/data/learn";
import { requiredLinks } from "@/data/roadmap";
import { source } from "@/lib/source";
import { AskQuestion } from "./ask-question";
import { CardHeader, CardPager } from "./card-header";
import { MarkDoneButton } from "./mark-done-button";
import { getMDXComponents } from "./mdx";

// วางหน้าเนื้อหาหนึ่งหน้าจากไฟล์ .mdx (ใช้ทั้งหน้าทั่วไปและหน้าที่ล็อก)
export function DocPage({ slugs }: { slugs: string[] | undefined }) {
  const page = source.getPage(slugs);
  if (!page) notFound();

  const MDX = page.data.body;
  // การ์ดของโครงใหม่ (/learn/cards/*): หัวการ์ดบอกตำแหน่งและเวลาอ่าน ปุ่ม "เข้าใจแล้ว" และปุ่มการ์ดก่อน/ถัดไปท้ายหน้า
  const card = cardByUrl(page.url);
  return (
    <DocsPage toc={page.data.toc} full={page.data.full} breadcrumb={{ enabled: !card }}>
      {!page.data.hideTitle && <DocsTitle>{page.data.title}</DocsTitle>}
      {page.data.description && <DocsDescription>{page.data.description}</DocsDescription>}
      {/* เฉพาะบทหลักที่นับในความคืบหน้า (บทเสริมและหน้าอ้างอิงไม่มีปุ่มนี้) */}
      {requiredLinks.includes(page.url) && <MarkDoneButton link={page.url} />}
      {card && <CardHeader card={card} />}
      {card && <MarkDoneButton link={page.url} label="เข้าใจการ์ดนี้แล้ว" />}
      <DocsBody>
        <MDX components={getMDXComponents()} />
        {card && <CardPager card={card} />}
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
