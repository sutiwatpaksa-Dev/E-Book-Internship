import type { Metadata } from "next";
import { PostFeed } from "@/components/post-feed";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "งานและประกาศ" };

export default async function FeedPage() {
  await requirePageAccess("/feed");
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">งานและประกาศ</h1>
        <p className="text-fd-muted-foreground">งานที่ต้องส่ง ประกาศ และแหล่งเรียนรู้จากพี่เลี้ยง เฉพาะของรุ่นเรา · กด &quot;รับทราบ&quot; ให้พี่เลี้ยงรู้ว่าเห็นแล้ว</p>
      </header>
      <PostFeed />
    </div>
  );
}
