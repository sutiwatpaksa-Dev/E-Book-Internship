import type { Metadata } from "next";
import { WorkBoard } from "@/components/work-board";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "กระดานงาน" };

export default async function WorkPage() {
  await requirePageAccess("/work");
  return <WorkBoard />;
}
