import { BottomNav, BottomNavSpacer } from "@/components/section-links";
import { NavProvider } from "@/components/nav-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { extraLinks } from "@/data/roadmap";
import { buildNav } from "@/lib/nav-tree";
import { source } from "@/lib/source";
import { version } from "../../../package.json";

// หน้าที่ไม่ใช่เนื้อหาคู่มือ (เช่น /today): headbar + footer เหมือนกัน แต่ไม่มี sidebar สารบัญ
// ใช้ความกว้างเต็มจอจัดกล่องได้อิสระ ส่วนหน้าเนื้อหาอยู่ใน (docs) ซึ่งมี sidebar
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <NavProvider nav={buildNav(source.getPageTree(), extraLinks)} version={version}>
      <SiteHeader menu={false} />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter version={version} />
      <BottomNavSpacer />
      <BottomNav />
    </NavProvider>
  );
}
