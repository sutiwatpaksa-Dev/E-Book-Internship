import { NavProvider } from "@/components/nav-provider";
import { BottomNav, BottomNavSpacer } from "@/components/section-links";
import { SiteDocsLayout } from "@/components/site-docs-layout";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { extraLinks } from "@/data/roadmap";
import { buildNav } from "@/lib/nav-tree";
import { source } from "@/lib/source";
import { version } from "../../../package.json";

// หน้างานของน้อง (/dashboard, /work): ใช้โครงเดียวกับหน้าคู่มือ (headbar → sidebar | เนื้อหา → footer)
// เมนูซ้ายเหมือนกันทุกหน้า กดไปมาแล้วโครงไม่กระโดด · ไม่มีสารบัญขวา เนื้อหาจึงได้ความกว้างเต็มคอลัมน์
export default function Layout({ children }: { children: React.ReactNode }) {
  const tree = source.getPageTree();
  return (
    <NavProvider nav={buildNav(tree, extraLinks)} version={version}>
      <SiteHeader />
      <SiteDocsLayout tree={tree}>
        <main id="main-content" tabIndex={-1} className="flex min-w-0 flex-col outline-none [grid-area:main]">
          {children}
        </main>
      </SiteDocsLayout>
      <SiteFooter version={version} />
      <BottomNavSpacer />
      <BottomNav />
    </NavProvider>
  );
}
