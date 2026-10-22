import { NavProvider } from "@/components/nav-provider";
import { RequirementViewer } from "@/components/requirement-viewer";
import { SiteDocsLayout } from "@/components/site-docs-layout";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { extraLinks } from "@/data/roadmap";
import { buildNav } from "@/lib/nav-tree";
import { source } from "@/lib/source";
import { version } from "../../../package.json";

// โครงหน้าคู่มือ: headbar บนสุด → (sidebar | เนื้อหา | สารบัญขวา) → footer
// เมนูทั้งหมดสร้างจาก content/docs/meta.json ครั้งเดียวตอน build แล้วแชร์ให้ทุกชิ้นผ่าน NavProvider
export default function Layout({ children }: { children: React.ReactNode }) {
  const tree = source.getPageTree();
  return (
    <NavProvider nav={buildNav(tree, extraLinks)} version={version}>
      <SiteHeader />
      <SiteDocsLayout tree={tree}>
        {children}
        {/* อยู่ใน layout จึงเปิดค้างไว้ได้ขณะเปลี่ยนหน้า STARTER */}
        <RequirementViewer />
      </SiteDocsLayout>
      <SiteFooter version={version} />
    </NavProvider>
  );
}
