import { renderMarkdown } from "@/lib/markdown";

// แสดง Markdown ที่พี่เลี้ยงเขียนจากหลังบ้าน หน้าตาเดียวกับเนื้อหาการ์ดในโค้ด (คลาส prose ของ Fumadocs)
// ใช้ dangerouslySetInnerHTML ได้เพราะ renderMarkdown ไม่ปล่อย HTML ดิบและลิงก์ javascript: ผ่าน (มีเทสต์ใน lib/markdown.test.ts)
// กล่องโค้ด: การ์ดในโค้ดได้กรอบจาก CodeBlock ของ Fumadocs แต่ HTML ที่แปลงเองไม่ผ่าน component นั้น จึงใส่กรอบให้ตรงนี้
const codeBox = "[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-fd-border [&_pre]:bg-fd-secondary [&_pre]:p-4 [&_pre]:text-sm [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0";

// ขึ้นบรรทัดเดียวใน Markdown ปกติถูกยุบเป็นช่องว่าง แต่คนเขียนในหลังบ้านตั้งใจให้ขึ้นบรรทัดใหม่ (แบบคอมเมนต์ GitHub) จึงให้ <p> แสดงตามบรรทัดที่พิมพ์
const lineBreaks = "[&_p]:whitespace-pre-line";

// รูป (ภาพหน้าจอ): ไม่กว้างเกินคอลัมน์ ย่อสัดส่วนตามจอ มีกรอบ เพราะภาพพื้นขาวบนหน้าขาวจะไม่เห็นขอบ
const images = "[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-fd-border";

export function MarkdownBody({ md, className = "" }: { md: string; className?: string }) {
  return <div className={`prose max-w-none ${codeBox} ${lineBreaks} ${images} ${className}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(md) }} />;
}
