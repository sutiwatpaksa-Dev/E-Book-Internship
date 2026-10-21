import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { source } from "@/lib/source";
import { getMDXComponents } from "./mdx";

// วางหน้าเนื้อหาหนึ่งหน้าจากไฟล์ .mdx (ใช้ทั้งหน้าทั่วไปและหน้าที่ล็อก)
export function DocPage({ slugs }: { slugs: string[] | undefined }) {
  const page = source.getPage(slugs);
  if (!page) notFound();

  const MDX = page.data.body;
  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      {!page.data.hideTitle && <DocsTitle>{page.data.title}</DocsTitle>}
      {page.data.description && <DocsDescription>{page.data.description}</DocsDescription>}
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function docMetadata(slugs: string[] | undefined) {
  const page = source.getPage(slugs);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
