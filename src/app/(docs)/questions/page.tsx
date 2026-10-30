import type { Metadata } from "next";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { ChatPanel } from "@/components/chat-panel";
import { pageTitles } from "@/lib/page-titles";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "ข้อความถึงพี่เลี้ยง" };

type Props = { searchParams: Promise<{ t?: string; new?: string }> };

export default async function QuestionsPage({ searchParams }: Props) {
  await requirePageAccess("/questions");
  const q = await searchParams;
  const initialId = Number(q.t) || null;
  const initialNew = q.new === "content_request" || q.new === "question" ? q.new : null;
  return (
    <DocsPage full>
      <DocsTitle>ข้อความถึงพี่เลี้ยง</DocsTitle>
      <DocsDescription>ถามเรื่องที่ติด หรือขอเนื้อหาที่อยากเรียนเพิ่ม เห็นกันแค่เรากับพี่เลี้ยง</DocsDescription>
      <DocsBody>
        <ChatPanel side="intern" titles={pageTitles()} initialId={initialId} initialNew={initialNew} />
      </DocsBody>
    </DocsPage>
  );
}
