import type { Metadata } from "next";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { MyQuestions } from "@/components/my-questions";
import { pageTitles } from "@/lib/page-titles";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "คำถามของฉัน" };

export default async function QuestionsPage() {
  await requirePageAccess("/questions");
  return (
    <DocsPage>
      <DocsTitle>💬 คำถามของฉัน</DocsTitle>
      <DocsDescription>คำถามที่ส่งถึงพี่เลี้ยงจากท้ายแต่ละบท เห็นกันแค่เรากับพี่เลี้ยง</DocsDescription>
      <DocsBody>
        <MyQuestions titles={pageTitles()} />
      </DocsBody>
    </DocsPage>
  );
}
