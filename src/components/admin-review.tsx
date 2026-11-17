"use client";

import { ArrowLeft, FolderGit2, GraduationCap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { AdminState } from "@/hooks/use-admin";
import { useReviewSummary } from "@/hooks/use-review";
import { readReviewUrl, reviewHref, type ReviewUrl } from "@/lib/review-url";
import type { ReviewPost } from "@/types";
import { RepoList, useSubmissions } from "./admin-submissions";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { ErrorText } from "./error-text";
import { inputClass } from "./field";
import { ReviewPeople } from "./review-people";
import { ReviewPosts } from "./review-posts";
import { SkeletonList } from "./skeleton";

// หน้าตรวจงานแบบเจาะลง: รุ่น → งาน → คน (→ ตรวจ ในแถวของตาราง)
// ตำแหน่งทั้งหมดอยู่ใน URL (?tab=submissions&cohort=&assignment=&round=&status=&sort=&q=&page=) ดู src/lib/review-url.ts
// defaultCohort = รุ่นที่เปิดให้เมื่อ URL ไม่ระบุ · onChange = บอกหลังบ้านให้นับป้ายรอตรวจบนเมนูใหม่
export function AdminReview({ admin, defaultCohort, onChange, onGoBoard }: { admin: AdminState; defaultCohort: number | null; onChange: () => void; onGoBoard: () => void }) {
  const url = readReviewUrl(useSearchParams(), defaultCohort);
  // เปลี่ยนตำแหน่ง: อ่าน URL ล่าสุดตอนกดเอง (ไม่ใช้ค่าจาก render เก่า เพราะช่องค้นหาเรียกหลังหยุดพิมพ์ไปแล้ว)
  // push = ปุ่ม Back ย้อนได้ · replace = ตัวกรองที่ไม่ควรเพิ่มประวัติทุกครั้ง
  const go = (patch: Partial<ReviewUrl>, replace = false) => {
    const now = readReviewUrl(new URLSearchParams(window.location.search), defaultCohort);
    window.history[replace ? "replaceState" : "pushState"](null, "", reviewHref({ ...now, ...patch }));
    if (!replace) window.scrollTo({ top: 0 });
  };
  const summary = useReviewSummary(url.cohort);
  const postOf = (u: ReviewUrl) => summary.data?.posts.find((p) => p.assignment === u.assignment && p.round === u.round);
  const post = url.assignment ? postOf(url) : undefined;
  const open = (p: ReviewPost) => go({ assignment: p.assignment, round: p.round, status: "waiting", sort: "oldest", q: "", page: 1 });
  const hrefOf = (p: ReviewPost) => reviewHref({ ...url, assignment: p.assignment, round: p.round, status: "waiting", sort: "oldest", q: "", page: 1 });
  const changed = () => {
    summary.reload();
    onChange();
  };

  // รุ่นที่ยังฝึกอยู่ขึ้นก่อน (ใหม่สุดบน) รุ่นที่จบแล้วอยู่ท้ายและมีป้ายกำกับ
  const cohorts = [...admin.cohorts].sort((a, b) => Number(!!a.endedAt) - Number(!!b.endedAt) || b.id - a.id);

  return (
    <section aria-labelledby="review-h" className="flex max-w-4xl flex-col gap-4">
      <h2 id="review-h" className="sr-only">
        งานที่ส่งตรวจ
      </h2>

      {cohorts.length === 0 ? (
        <EmptyState icon={GraduationCap} title="ยังไม่มีรุ่นฝึกงาน">
          สร้างรุ่นที่แท็บ "รุ่นฝึกงาน" ก่อน แล้วโพสต์งานให้รุ่นนั้น น้องที่ส่งงานจะขึ้นที่นี่
        </EmptyState>
      ) : (
        <>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">รุ่น</span>
            <select
              value={url.cohort ?? ""}
              onChange={(e) => go({ cohort: Number(e.target.value), assignment: null, round: null, status: "waiting", sort: "oldest", q: "", page: 1 })}
              className={`${inputClass} min-h-11 max-w-full`}
            >
              {url.cohort === null && <option value="">เลือกรุ่น</option>}
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.endedAt ? " (จบแล้ว)" : ""}
                </option>
              ))}
            </select>
          </label>

          {url.cohort === null ? (
            <EmptyState icon={GraduationCap} title="เลือกรุ่นก่อน">
              เลือกรุ่นจากรายการด้านบนเพื่อดูงานที่ส่งตรวจ
            </EmptyState>
          ) : summary.error && !summary.data ? (
            <div className="flex flex-col items-start gap-2">
              <ErrorText>{summary.error}</ErrorText>
              <Button variant="ghost" onClick={summary.reload} className="min-h-11">
                ลองใหม่
              </Button>
            </div>
          ) : !summary.data ? (
            <SkeletonList rows={3} label="กำลังโหลดงานของรุ่น" />
          ) : url.assignment ? (
            post ? (
              <div className="flex flex-col gap-3">
                <nav aria-label="ตำแหน่ง" className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Button variant="ghost" onClick={() => go({ assignment: null, round: null })} className="min-h-11">
                    <ArrowLeft aria-hidden className="size-4" /> งานทั้งหมดของรุ่น
                  </Button>
                  <h3 className="text-base font-semibold break-words">
                    {post.roundLabel} <span className="font-normal text-fd-muted-foreground">· {post.assignmentName}</span>
                  </h3>
                </nav>
                <ReviewPeople admin={admin} url={url} post={post} onUrl={go} onChanged={changed} />
              </div>
            ) : (
              <EmptyState
                icon={FolderGit2}
                title="ไม่พบงานนี้ในรุ่นที่เลือก"
                action={
                  <Button variant="ghost" onClick={() => go({ assignment: null, round: null })} className="min-h-11">
                    กลับไปงานทั้งหมดของรุ่น
                  </Button>
                }
              >
                ลิงก์นี้อาจเป็นของรุ่นอื่น หรือโพสต์ถูกเก็บไปแล้ว
              </EmptyState>
            )
          ) : summary.data.posts.length === 0 ? (
            <EmptyState
              icon={FolderGit2}
              title="รุ่นนี้ยังไม่มีโพสต์งาน"
              action={
                <Button variant="ghost" onClick={onGoBoard} className="min-h-11">
                  ไปโพสต์งาน
                </Button>
              }
            >
              โพสต์งานให้รุ่นนี้ก่อน น้องจึงจะส่งงานและขึ้นให้ตรวจที่นี่ได้
            </EmptyState>
          ) : (
            <>
              <ReviewPosts posts={summary.data.posts} interns={summary.data.interns} hrefOf={hrefOf} onOpen={open} />
              <Repos admin={admin} cohort={url.cohort} />
            </>
          )}
        </>
      )}
    </section>
  );
}

// repo ของน้องทุกคนในรุ่นที่เลือก (ยังไม่ส่งลิงก์กี่คน) · ย้ายมาจากแท็บเดิม ใช้รายการงานที่ส่งชุดเดิม (ดึงล่าสุด 500 แถว)
function Repos({ admin, cohort }: { admin: AdminState; cohort: number }) {
  const { items } = useSubmissions();
  if (!items) return null;
  return <RepoList admin={admin} items={items} inScope={(id) => id === cohort} />;
}
