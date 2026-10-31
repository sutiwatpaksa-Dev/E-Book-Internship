import type { Metadata } from "next";
import { TaskPage } from "@/components/task-page";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "งาน" };

type Props = { params: Promise<{ assignment: string; round: string }> };

export default async function WorkTaskPage({ params }: Props) {
  const { assignment, round } = await params;
  await requirePageAccess(`/work/${assignment}/${round}`);
  return <TaskPage assignment={assignment} round={round} />;
}
