import { notFound, redirect } from "next/navigation";
import { DEFAULT_ASSIGNMENT } from "@server/lib/assignment-access";
import { assignmentService } from "@server/services/assignment.service";
import { DocPage, docMetadata } from "@/components/doc-page";
import { ProjectOverview } from "@/components/project-overview";
import { ProjectStatusBar } from "@/components/project-status-bar";
import { requirePageAccess } from "@/lib/require-page-access";

// หน้าโจทย์ 1 ชิ้น: แถบสถานะ + ปุ่มลัดอยู่บนสุด เนื้อยาวอยู่ข้างล่าง
// STARTER ใช้เนื้อหาเต็มจาก content/docs/starter · โจทย์อื่นใช้เทมเพลตจากข้อมูลหลังบ้าน
// ขอโจทย์ที่ไม่มีหรือเป็นของรุ่นอื่น = 404 เหมือนกัน (ไม่บอกว่าโจทย์นั้นมีอยู่จริง)
type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const session = await requirePageAccess(`/projects/${slug}`);
  if (!session) redirect(`/login?next=${encodeURIComponent(`/projects/${slug}`)}`);
  const list = await assignmentService.listFor({ id: session.userId, role: session.role });
  const assignment = list.find((a) => a.slug === slug);
  if (!assignment) notFound();
  const top = <ProjectStatusBar slug={slug} />;
  if (slug === DEFAULT_ASSIGNMENT) return <DocPage slugs={["starter"]} top={top} />;
  return <ProjectOverview assignment={assignment} top={top} />;
}

export async function generateMetadata({ params }: Props) {
  return (await params).slug === DEFAULT_ASSIGNMENT ? docMetadata(["starter"]) : { title: "โจทย์ฝึกงาน" };
}
