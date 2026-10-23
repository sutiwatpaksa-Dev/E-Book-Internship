"use client";

import type { AdminState } from "@/hooks/use-admin";
import { STATUS_LABEL, STATUSES_OF, timeAgo } from "@/lib/thread-labels";
import type { AdminNav } from "./admin-panel";

// บอร์ดคำขอเนื้อหา: เห็นทุกคำขอเรียงตามขั้น ใช้วางแผนว่าจะเขียนบทไหนก่อน
// ย้ายขั้นทำในแชท (กดการ์ด) เพื่อให้ทุกการเปลี่ยนสถานะมีบรรทัดแจ้งน้องเสมอ
export function AdminRequests({ admin, nav }: { admin: AdminState; nav: AdminNav }) {
  const requests = admin.threads.filter((t) => t.kind === "content_request");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-fd-muted-foreground">กดการ์ดเพื่อเปิดแชท ตอบน้องและเลื่อนขั้นที่หัวเรื่อง · ขั้น &quot;ไม่ทำ&quot; ต้องบอกเหตุผลเสมอ</p>
      {/* จอแคบ: เลื่อนซ้าย-ขวาดูทีละคอลัมน์ · จอกว้าง: 5 คอลัมน์เต็มความกว้าง */}
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0 xl:grid xl:grid-cols-5 xl:gap-2 xl:overflow-visible">
        {STATUSES_OF.content_request.map((status) => {
          const cards = requests.filter((t) => t.status === status);
          return (
            <section key={status} aria-label={STATUS_LABEL[status]} className="flex w-60 shrink-0 snap-start flex-col gap-2 rounded-xl bg-fd-muted/60 p-2 xl:w-auto xl:min-w-0">
              <h2 className="flex items-center justify-between px-1 text-sm font-semibold">
                {STATUS_LABEL[status]}
                <span className="text-fd-muted-foreground tabular-nums">{cards.length}</span>
              </h2>
              {cards.length === 0 && <p className="px-1 py-3 text-center text-xs text-fd-muted-foreground">–</p>}
              {cards.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => nav.openThread(t.id)}
                  className="flex flex-col gap-1 rounded-lg border border-fd-border bg-fd-card p-2.5 text-start text-sm shadow-sm hover:border-fd-primary"
                >
                  <span className={`line-clamp-2 ${t.unread ? "font-bold" : "font-medium"}`}>
                    {t.unread && <span className="me-1.5 inline-block size-2 rounded-full bg-orange-500" aria-label="ยังไม่อ่าน" />}
                    {t.subject}
                  </span>
                  <span className="text-xs text-fd-muted-foreground">
                    {t.owner} · ขอเมื่อ {timeAgo(t.createdAt)}
                  </span>
                </button>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
