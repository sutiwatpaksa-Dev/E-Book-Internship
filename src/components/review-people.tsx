"use client";

import { ArrowRightLeft, ChevronLeft, ChevronRight, Code, FolderGit2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useReviewPage } from "@/hooks/use-review";
import type { AdminState } from "@/hooks/use-admin";
import { thDateTime } from "@/lib/date-format";
import { percentOf } from "@/lib/rubric";
import { countOfStatus, offsetOf, pagesOf, rangeText, REVIEW_PAGE_SIZE, REVIEW_SORTS, SORT_LABEL, STATUS_LABEL, visibleStatuses, type ReviewSort, type ReviewUrl } from "@/lib/review-url";
import { repoShort, treeUrl } from "@/lib/submission";
import type { ReviewItem, ReviewPost } from "@/types";
import { SubmissionCard } from "./admin-submissions";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { inputClass } from "./field";
import { SkeletonList } from "./skeleton";
import { VerdictBadge } from "./status-badge";

// ชั้น "คน" ของหน้าตรวจงาน: ตารางน้องที่ส่งงานนี้ (ครั้งล่าสุดของแต่ละคน) กรอง/ค้น/เรียง/แบ่งหน้าที่ server
// กด "ตรวจ" = แถวกางฟอร์มตรวจเดิมออกใต้แถว · ตรวจเสร็จแถวนั้นออกจากแท็บ "รอตรวจ" เอง

const tab = "min-h-11";

export function ReviewPeople({ admin, url, post, onUrl, onChanged }: { admin: AdminState; url: ReviewUrl; post: ReviewPost; onUrl: (patch: Partial<ReviewUrl>, replace?: boolean) => void; onChanged: () => void }) {
  const page = useReviewPage({
    cohort: url.cohort ?? undefined,
    assignment: post.assignment,
    round: post.round,
    status: url.status,
    sort: url.sort,
    q: url.q || undefined,
    offset: offsetOf(url.page),
    limit: REVIEW_PAGE_SIZE,
  });
  const { data, error, loading } = page;

  // ช่องค้นหา: พิมพ์ค้างได้ ส่งขึ้น URL หลังหยุดพิมพ์ 300ms (replace: ไม่เพิ่มประวัติทุกตัวอักษร)
  const [qInput, setQInput] = useState(url.q);
  const pushed = useRef(url.q);
  useEffect(() => {
    if (url.q !== pushed.current) setQInput(url.q); // URL เปลี่ยนจากข้างนอก (ปุ่ม Back, ล้างตัวกรอง)
    pushed.current = url.q;
  }, [url.q]);
  useEffect(() => {
    const next = qInput.trim();
    if (next === url.q) return;
    const t = setTimeout(() => {
      pushed.current = next;
      onUrl({ q: next, page: 1 }, true);
    }, 300);
    return () => clearTimeout(t);
    // onUrl เปลี่ยนทุก render (ปิดทับ url ล่าสุดเอง) ไม่ใส่ใน deps เพื่อไม่ให้นับเวลาใหม่ทุกครั้งที่ render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput, url.q]);

  // แถวที่กางอยู่ (กางทีละแถว) · เปลี่ยนแท็บ/หน้า/คำค้น = พับ
  const [openId, setOpenId] = useState<number | null>(null);
  useEffect(() => setOpenId(null), [url.status, url.sort, url.q, url.page, post.assignment, post.round]);

  // ตรวจแถวสุดท้ายของหน้าท้ายสุดแล้วหน้านั้นว่าง = ถอยไปหน้าสุดท้ายที่มี (ไม่ค้างหน้าว่าง)
  const pages = data ? pagesOf(data.total) : 1;
  useEffect(() => {
    if (data && data.items.length === 0 && data.total > 0 && url.page > pages) onUrl({ page: pages }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, pages, url.page]);

  const counts = { waiting: data?.waiting ?? post.waiting, reviewed: data?.reviewed ?? post.reviewed };
  // หน้าที่ "แถวตรงหน้า" เป็นของจริง (ตอนกำลังโหลดหน้าใหม่ แถวยังเป็นของหน้าเก่า ป้ายต้องไม่นำหน้าแถว)
  const shownPage = data ? Math.floor(data.offset / data.limit) + 1 : url.page;
  // มียอดรวมแต่ไม่มีแถว = ข้อมูลของหน้าที่เลยหน้าสุดท้าย (ลิงก์เก่า/พิมพ์เอง) กำลังเด้งไปหน้าสุดท้าย ไม่ใช่ "ว่าง" จริง
  // ไม่เทียบกับ url.page: หลังเด้งแล้ว URL ถูกแล้วแต่ข้อมูลที่ถืออยู่ยังเป็นผลว่างของหน้าเก่าจนกว่าหน้าใหม่จะโหลดเสร็จ
  const pastEnd = !!data && data.items.length === 0 && data.total > 0;
  // เลื่อนด้วยคีย์บอร์ด: activeId = แถวที่เลือกอยู่ (J ลง · K ขึ้น · Enter กาง/พับ · Esc พับ)
  const [activeId, setActiveId] = useState<number | null>(null);
  useEffect(() => setActiveId(null), [url.status, url.sort, url.q, url.page, post.assignment, post.round]);
  const items = data?.items;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const stateRef = useRef({ activeId, openId });
  stateRef.current = { activeId, openId };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      // พิมพ์อยู่ในช่องกรอก/เลือกอยู่ที่ปุ่ม = ไม่แย่งคีย์ (Esc ยังใช้พับฟอร์มได้จากในช่องกรอก)
      const typing = !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
      const list = itemsRef.current;
      if (!list?.length) return;
      const { activeId: a, openId: o } = stateRef.current;
      if (e.key === "Escape") {
        if (o !== null) setOpenId(null);
        return;
      }
      if (typing) return;
      const at = list.findIndex((x) => x.id === (a ?? o));
      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        const next = list[Math.min(list.length - 1, Math.max(0, at < 0 ? 0 : at + (e.key === "j" ? 1 : -1)))];
        setActiveId(next.id);
      } else if (e.key === "Enter" && at >= 0 && el?.tagName !== "BUTTON" && el?.tagName !== "A") {
        e.preventDefault();
        setOpenId(o === list[at].id ? null : list[at].id);
        setActiveId(list[at].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const id = openId ?? activeId;
    if (id !== null) document.getElementById(`review-row-${id}`)?.scrollIntoView({ block: "nearest" });
  }, [openId, activeId]);

  // บันทึกแล้วเปิดคนถัดไปให้เลย: แท็บ "รอตรวจ" แถวที่ตรวจเสร็จจะหายไป คนถัดไปเลื่อนขึ้นมาอยู่ตำแหน่งเดิม
  // แท็บอื่นแถวยังอยู่ จึงเปิดแถวถัดไปตามลำดับ · ไม่มีคนถัดไป = พับ
  const reopenAt = useRef<number | null>(null);
  useEffect(() => {
    if (reopenAt.current === null || loading || !items) return;
    const next = items[reopenAt.current];
    reopenAt.current = null;
    setOpenId(next?.id ?? null);
    setActiveId(next?.id ?? null);
  }, [items, loading]);
  const done = () => {
    const at = items?.findIndex((x) => x.id === openId) ?? -1;
    if (at >= 0 && items) {
      if (url.status === "waiting") reopenAt.current = at;
      else {
        const next = items[at + 1];
        setOpenId(next?.id ?? null);
        setActiveId(next?.id ?? null);
      }
    } else setOpenId(null);
    if (url.status === "waiting") setOpenId(null);
    page.reload();
    onChanged();
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="แสดง" className="flex flex-wrap gap-2">
        {visibleStatuses(counts, url.status).map((s) => (
          <Button key={s} variant={url.status === s ? "primary" : "ghost"} aria-pressed={url.status === s} onClick={() => onUrl({ status: s, page: 1 })} className={tab}>
            {STATUS_LABEL[s]} ({countOfStatus(counts, s)})
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">ค้นหาน้องด้วยชื่อผู้ใช้หรือชื่อเล่น</span>
          <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground" />
          <input type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} maxLength={60} placeholder="ค้นชื่อผู้ใช้หรือชื่อเล่น" className={`${inputClass} min-h-11 w-full ps-9`} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-fd-muted-foreground">เรียง</span>
          <select value={url.sort} onChange={(e) => onUrl({ sort: e.target.value as ReviewSort, page: 1 })} className={`${inputClass} min-h-11`}>
            {REVIEW_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="hidden text-xs text-fd-muted-foreground sm:block">
        คีย์ลัด: <kbd className="rounded border border-fd-border px-1">J</kbd> <kbd className="rounded border border-fd-border px-1">K</kbd> เลื่อนลง/ขึ้น · <kbd className="rounded border border-fd-border px-1">Enter</kbd> เปิดฟอร์มตรวจ · <kbd className="rounded border border-fd-border px-1">Ctrl</kbd>+<kbd className="rounded border border-fd-border px-1">Enter</kbd> บันทึกแล้วเปิดคนถัดไป · <kbd className="rounded border border-fd-border px-1">Esc</kbd> ปิด
      </p>

      {error && !data ? (
        <div className="flex flex-col items-start gap-2">
          <ErrorText>{error}</ErrorText>
          <Button variant="ghost" onClick={page.reload} className={tab}>
            ลองใหม่
          </Button>
        </div>
      ) : !data || pastEnd ? (
        <SkeletonList rows={5} label="กำลังโหลดรายชื่อ" />
      ) : data.items.length === 0 ? (
        <Empty url={url} counts={counts} onUrl={onUrl} clearSearch={() => (setQInput(""), onUrl({ q: "", page: 1 }))} />
      ) : (
        <>
          {/* relative: ข้อความ sr-only (position absolute) ในหัวตารางต้องถูกกล่องเลื่อนตัดด้วย ไม่งั้นดันให้ทั้งหน้าเลื่อนแนวนอนบนมือถือ */}
          <div aria-busy={loading} className={`relative overflow-x-auto rounded-xl border border-fd-border ${loading ? "opacity-60" : ""}`}>
            <table className="w-full text-sm">
              <caption className="sr-only">
                น้องที่ส่ง {post.roundLabel} · {STATUS_LABEL[url.status]} · {rangeText(data.total, shownPage)}
              </caption>
              <thead>
                <tr className="text-start text-fd-muted-foreground">
                  <th scope="col" className="px-3 py-2 text-start font-medium">น้อง</th>
                  <th scope="col" className="hidden px-3 py-2 text-start font-medium sm:table-cell">ส่งเมื่อ</th>
                  <th scope="col" className="px-3 py-2 text-start font-medium">ผลตรวจ</th>
                  <th scope="col" className="hidden px-3 py-2 text-start font-medium sm:table-cell">
                    <span className="sr-only">โค้ด</span>
                  </th>
                  <th scope="col" className="px-3 py-2 text-start font-medium">
                    <span className="sr-only">ตรวจ</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((s) => (
                  <Row key={s.id} admin={admin} s={s} open={openId === s.id} active={activeId === s.id} onToggle={() => setOpenId(openId === s.id ? null : s.id)} onReviewed={done} />
                ))}
              </tbody>
            </table>
          </div>

          <nav aria-label="เปลี่ยนหน้า" className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-fd-muted-foreground" role="status">
              {rangeText(data.total, shownPage)}
            </span>
            {pages > 1 && (
              <span className="flex items-center gap-2">
                <Button variant="ghost" disabled={url.page <= 1} onClick={() => onUrl({ page: url.page - 1 })} className="min-h-11">
                  <ChevronLeft aria-hidden className="size-4" /> ก่อนหน้า
                </Button>
                <span className="tabular-nums">
                  หน้า {url.page} / {pages}
                </span>
                <Button variant="ghost" disabled={url.page >= pages} onClick={() => onUrl({ page: url.page + 1 })} className="min-h-11">
                  ถัดไป <ChevronRight aria-hidden className="size-4" />
                </Button>
              </span>
            )}
          </nav>
        </>
      )}
    </div>
  );
}

function Row({ admin, s, open, active, onToggle, onReviewed }: { admin: AdminState; s: ReviewItem; open: boolean; active: boolean; onToggle: () => void; onReviewed: () => void }) {
  const name = s.nickname ? `${s.username} (${s.nickname})` : s.username;
  return (
    <>
      <tr id={`review-row-${s.id}`} aria-current={active ? "true" : undefined} className={`border-t border-fd-border align-middle ${active ? "bg-fd-primary/10 outline outline-2 -outline-offset-2 outline-fd-primary" : ""}`}>
        <td className="break-words px-3 py-2 font-medium">
          {name}
          {/* จอแคบ: วันที่ย้ายมาอยู่ใต้ชื่อ เพื่อให้ปุ่ม "ตรวจ" อยู่ในจอโดยไม่ต้องเลื่อนตาราง */}
          <span className="block text-xs font-normal text-fd-muted-foreground sm:hidden">{thDateTime(s.createdAt)}</span>
          {/* เปลี่ยน repo จากครั้งก่อน: ป้ายมีข้อความ+ไอคอน (ไม่ใช้สีอย่างเดียว) และบอก repo เดิมให้เห็นเลยไม่ต้องเอาเมาส์ชี้ */}
          {s.prevRepoUrl && (
            <span className="mt-1 block text-xs font-normal text-amber-900 dark:text-amber-200">
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 font-medium dark:bg-amber-950">
                <ArrowRightLeft aria-hidden className="size-3" /> เปลี่ยน repo จากครั้งก่อน
              </span>{" "}
              <span className="break-all text-fd-muted-foreground">เดิม {repoShort(s.prevRepoUrl)} → ใหม่ {repoShort(s.repoUrl)}</span>
            </span>
          )}
        </td>
        <td className="hidden whitespace-nowrap px-3 py-2 text-fd-muted-foreground sm:table-cell">{thDateTime(s.createdAt)}</td>
        <td className="px-3 py-2">
          <span className="flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={s.verdict} />
            {s.scores && <span className="tabular-nums text-fd-muted-foreground">{percentOf(s.scores)}%</span>}
          </span>
        </td>
        <td className="hidden px-3 py-2 sm:table-cell">
          <a
            href={treeUrl(s.repoUrl, s.ref)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`เปิดโค้ดของ ${name} บน GitHub (แท็บใหม่)`}
            className="inline-flex size-11 items-center justify-center rounded-lg text-fd-primary hover:bg-fd-accent"
          >
            <Code aria-hidden className="size-4" />
          </a>
        </td>
        <td className="px-3 py-2 text-end">
          <Button variant={open ? "ghost" : "primary"} aria-expanded={open} aria-label={`${open ? "ปิด" : s.reviewedAt ? "แก้ผลตรวจ" : "ตรวจงาน"} ${name}`} onClick={onToggle} className="min-h-11 whitespace-nowrap">
            {open ? "ปิด" : s.reviewedAt ? "แก้ผลตรวจ" : "ตรวจ"}
          </Button>
        </td>
      </tr>
      {open && (
        <tr className="bg-fd-muted/30">
          <td colSpan={5} className="p-2 sm:p-3">
            <SubmissionCard admin={admin} s={s} startOpen onReviewed={onReviewed} />
          </td>
        </tr>
      )}
    </>
  );
}

// ว่างได้ 3 แบบ ต้องบอกต่างกันและมีทางไปต่อ: ค้นแล้วไม่เจอ · แท็บนี้หมดแล้ว · ยังไม่มีใครส่ง
function Empty({ url, counts, onUrl, clearSearch }: { url: ReviewUrl; counts: { waiting: number; reviewed: number }; onUrl: (patch: Partial<ReviewUrl>, replace?: boolean) => void; clearSearch: () => void }) {
  if (url.q)
    return (
      <EmptyState icon={Search} title={`ไม่พบ "${url.q}"`} action={<Button variant="ghost" onClick={clearSearch} className="min-h-11">ล้างคำค้น</Button>}>
        ลองพิมพ์ชื่อผู้ใช้หรือชื่อเล่นให้สั้นลง หรือดูแท็บอื่น (ตอนนี้ดูแท็บ "{STATUS_LABEL[url.status]}")
      </EmptyState>
    );
  const all = counts.waiting + counts.reviewed;
  if (all === 0)
    return (
      <EmptyState icon={FolderGit2} title="ยังไม่มีใครส่งงานนี้">
        น้องส่งงานได้ที่หน้า "งานที่ต้องส่ง" แล้วจะขึ้นที่นี่พร้อมแจ้งเตือน
      </EmptyState>
    );
  if (url.status === "waiting")
    return (
      <EmptyState icon={FolderGit2} title="ตรวจครบแล้ว ไม่มีงานรอตรวจ" action={<Button variant="ghost" onClick={() => onUrl({ status: "reviewed", page: 1 })} className="min-h-11">ดูที่ตรวจแล้ว ({counts.reviewed})</Button>}>
        ถ้ามีน้องส่งซ้ำ จะกลับมาอยู่ในแท็บ "รอตรวจ" เอง
      </EmptyState>
    );
  return (
    <EmptyState icon={FolderGit2} title="ไม่มีรายการในแท็บนี้" action={<Button variant="ghost" onClick={() => onUrl({ status: "all", page: 1 })} className="min-h-11">ดูทั้งหมด ({all})</Button>}>
      เปลี่ยนไปดูแท็บอื่นเพื่อดูงานที่ส่งมา
    </EmptyState>
  );
}
