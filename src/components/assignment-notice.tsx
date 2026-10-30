import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { requirementUrl } from "@/api/files.api";
import type { Assignment } from "@/types";

// หน้า /starter สำหรับรุ่นที่ไม่ได้ทำโจทย์ STARTER: เนื้อหาในหน้าเหล่านี้เขียนจากโจทย์ร้านค้า
// แสดงให้รุ่นอื่นอ่านจะทำให้เข้าใจผิดว่าต้องทำร้านค้า จึงชี้ไปเอกสารโจทย์ของรุ่นตัวเองแทน
// (โจทย์อื่นเก็บใน DB ไม่ใช่ MDX เพราะ repo เปิดสาธารณะ)
export function AssignmentNotice({ list }: { list: Assignment[] }) {
  return (
    <DocsPage>
      <DocsTitle>โจทย์ฝึกงานของรุ่นคุณ</DocsTitle>
      <DocsDescription>หน้าสรุปในหมวดนี้เขียนสำหรับโจทย์ STARTER ซึ่งรุ่นของคุณไม่ได้ทำ อ่านโจทย์ของรุ่นตัวเองจากเอกสารด้านล่าง</DocsDescription>
      <DocsBody>
        {list.length === 0 ? (
          <p>รุ่นของคุณยังไม่มีโจทย์ ติดต่อพี่เลี้ยงประจำรุ่น</p>
        ) : (
          list.map((a) => (
            <section key={a.slug}>
              <h2>{a.name}</h2>
              {a.brief && <p>{a.brief}</p>}
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
            </section>
          ))
        )}
        <p>
          ทุกโจทย์ใช้ stack, แผน 10 วัน และเกณฑ์ผ่านแบบเดียวกัน ขั้นตอนและการ์ดใน <a href="/learn">เส้นทาง 7 ขั้น</a> ใช้กับโจทย์ของคุณได้ทั้งหมด
        </p>
      </DocsBody>
    </DocsPage>
  );
}
