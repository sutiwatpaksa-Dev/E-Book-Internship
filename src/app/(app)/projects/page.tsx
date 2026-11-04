import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { assignmentService } from "@server/services/assignment.service";
import { ProjectList } from "@/components/project-list";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "โจทย์ฝึกงาน" };
// ต้องตรวจ cookie ทุกครั้ง และรายการโจทย์ต่างกันตามรุ่นของคนที่ขอ
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await requirePageAccess("/projects");
  if (!session) redirect("/login?next=%2Fprojects");
  const list = await assignmentService.listFor({ id: session.userId, role: session.role });
  // รุ่นมีโจทย์เดียว = ไม่ต้องให้เลือก ข้ามไปหน้าโจทย์เลย (น้องไม่เจอหน้าเพิ่ม) · พี่เลี้ยงเห็นรายการเสมอ
  if (session.role === "intern" && list.length === 1) redirect(`/projects/${list[0].slug}`);
  return <ProjectList list={list.map(({ slug, name, brief }) => ({ slug, name, brief }))} intern={session.role === "intern"} />;
}
