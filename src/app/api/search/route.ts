import { createSearchAPI } from "fumadocs-core/search/server";
import { isLocked } from "@/lib/page-access";
import { source } from "@/lib/source";

// ดัชนีค้นหาเปิดให้ทุกคนโหลด จึงไม่ใส่หน้าที่ต้อง login ไม่งั้นเนื้อหาที่ล็อกจะหลุดออกไปทางช่องค้นหา
export const { GET } = createSearchAPI("advanced", {
  indexes: source
    .getPages()
    .filter((page) => !isLocked(page.url))
    .map((page) => ({
      id: page.url,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      structuredData: page.data.structuredData,
    })),
});
