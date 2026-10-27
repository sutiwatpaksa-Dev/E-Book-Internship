import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";

// แปลง Markdown ที่พี่เลี้ยงเขียนในหลังบ้านเป็น HTML
// micromark ไม่ยอมให้ HTML ดิบผ่าน (<script> กลายเป็นข้อความธรรมดา) และตัดลิงก์ javascript: ทิ้งให้เอง
// จึงเอาผลไปใส่หน้าเว็บได้โดยไม่ต้องกรองซ้ำ · gfm = ตาราง, ขีดฆ่า, checklist แบบ GitHub
export function renderMarkdown(md: string) {
  return micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
}
