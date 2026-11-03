import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";

// แปลง Markdown ที่พี่เลี้ยงเขียนในหลังบ้านเป็น HTML
// micromark ไม่ยอมให้ HTML ดิบผ่าน (<script> กลายเป็นข้อความธรรมดา) และตัดลิงก์ javascript: ทิ้งให้เอง
// จึงเอาผลไปใส่หน้าเว็บได้โดยไม่ต้องกรองซ้ำ · gfm = ตาราง, ขีดฆ่า, checklist แบบ GitHub
// กล่องเตือนแบบ GitHub (> [!CAUTION] ...) · ป้ายเป็นคำไทยเสมอ ไม่ใช้สีอย่างเดียวบอกความสำคัญ
export const ALERTS = {
  CAUTION: "ต้องแก้ทันที",
  WARNING: "ควรระวัง",
  IMPORTANT: "สำคัญ",
  TIP: "เคล็ดลับ",
  NOTE: "หมายเหตุ",
} as const;

export function renderMarkdown(md: string) {
  const html = micromark(md, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  // micromark แปลง > [!X] เป็น <blockquote>\n<p>[!X] … ก่อน แล้วค่อยเปลี่ยนเป็นกล่องที่มีป้าย (ข้อความใน HTML ถูก escape แล้ว จึงไม่มีอะไรหลุดเข้ามา)
  return html.replace(/<blockquote>\n<p>\[!(CAUTION|WARNING|IMPORTANT|TIP|NOTE)\]\n?/g, (_, kind: keyof typeof ALERTS) =>
    `<blockquote class="md-alert md-alert-${kind.toLowerCase()}" role="note">\n<p class="md-alert-title">${ALERTS[kind]}</p>\n<p>`,
  );
}
