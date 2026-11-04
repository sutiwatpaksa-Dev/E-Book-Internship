import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import type { ReactNode } from "react";
import { requirementUrl } from "@/api/files.api";
import type { Assignment } from "@/types";
import { MarkdownBody } from "./markdown-body";

// หน้าโจทย์ที่ไม่ใช่ STARTER: ข้อมูลมาจากหลังบ้าน (ชื่อ สรุป ภาพรวม Markdown พร้อมรูป หัวข้อ PDF) เนื้อหาเต็มอยู่ใน PDF ของโจทย์ (repo เปิดสาธารณะ จึงไม่เก็บโจทย์อื่นเป็น MDX)
// แผน 10 วัน คุณภาพ เกณฑ์ผ่านใช้ร่วมกันทุกโจทย์ ลิงก์ไปหน้ากลาง 3 หน้า
export function ProjectOverview({ assignment: a, top }: { assignment: Assignment; top: ReactNode }) {
  return (
    <DocsPage>
      <DocsTitle>{a.name}</DocsTitle>
      {a.brief && <DocsDescription>{a.brief}</DocsDescription>}
      {top}
      <DocsBody>
        {a.overview.trim() && <MarkdownBody md={a.overview} />}
        <h2>เอกสารโจทย์</h2>
        <p>
          <a href={requirementUrl(a.slug)} target="_blank" rel="noopener">
            เปิดเอกสารโจทย์ (PDF)
          </a>
        </p>
        {a.sections.length > 0 && (
          <ul>
            {a.sections.map((s) => (
              <li key={s.key}>
                <a href={`${requirementUrl(a.slug)}#page=${s.page}`} target="_blank" rel="noopener">
                  {s.label}
                </a>{" "}
                (หน้า {s.page})
              </li>
            ))}
          </ul>
        )}
        <h2>ใช้กับทุกโจทย์</h2>
        <p>ทุกโจทย์ใช้ stack แผน 10 วัน และเกณฑ์ผ่านแบบเดียวกัน 3 หน้านี้จึงใช้กับโจทย์ของคุณได้เลย</p>
        <ul>
          <li>
            <a href="/starter/timeline">แผน 10 วัน + รายการที่ต้องทำ</a>
          </li>
          <li>
            <a href="/starter/quality">คุณภาพที่ต้องได้</a>
          </li>
          <li>
            <a href="/starter/submission">การส่งงาน + เกณฑ์</a>
          </li>
        </ul>
        <p>
          ขั้นตอนและการ์ดใน <a href="/learn">เส้นทาง 7 ขั้น</a> ใช้กับโจทย์ของคุณได้ทั้งหมด
        </p>
      </DocsBody>
    </DocsPage>
  );
}
