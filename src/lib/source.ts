import { loader, type LoaderPlugin } from "fumadocs-core/source";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { applyMdxPreset } from "fumadocs-mdx/config";
import { defineDocs } from "fumadocs-mdx/macro";
import remarkBreaks from "remark-breaks";
import { z } from "zod";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    // navTitle = ชื่อสั้นใน sidebar (title เต็มยาวเกินไปสำหรับแถบซ้าย)
    // hideTitle = ไม่แสดง title บนหน้า (หน้าแรกใช้โลโก้เป็นหัวเรื่องแทน)
    schema: pageSchema.extend({ navTitle: z.string().optional(), hideTitle: z.boolean().optional() }),
    // ขึ้นบรรทัดใหม่ในไฟล์ = ขึ้นบรรทัดใหม่บนหน้าเว็บ (บทสนทนาและกล่องข้อความเขียนไว้ทีละบรรทัด)
    mdxOptions: applyMdxPreset({ remarkPlugins: (v) => [...v, remarkBreaks] }),
  },
  meta: { schema: metaSchema },
});

const navTitle: LoaderPlugin = {
  transformPageTree: {
    file(node, filePath) {
      const file = filePath ? this.storage.read(filePath) : undefined;
      const short = file?.format === "page" ? (file.data as { navTitle?: string }).navTitle : undefined;
      return short ? { ...node, name: short } : node;
    },
  },
};

// เนื้อหาทั้งหมดอยู่ที่ root ของเว็บ (/01-git, /starter) URL เดิมจาก VitePress จึงใช้ต่อได้
export const source = loader({
  baseUrl: "/",
  source: docs.toFumadocsSource(),
  plugins: [navTitle],
});
