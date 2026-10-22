"use client";

import type * as PageTree from "fumadocs-core/page-tree";
import { DocsLayout, type DocsSlots } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { useNavDrawer } from "@/hooks/use-nav-drawer";
import { SiteSidebar } from "./site-sidebar";

// ใช้โครงหน้าของ Fumadocs (grid + สารบัญขวา + ปุ่มบทก่อน/ถัดไป) แต่เปลี่ยน sidebar เป็นของเราเอง
// headbar ไม่ใช้ของ Fumadocs (nav.enabled: false) เพราะของเราอยู่บนสุดเต็มความกว้าง (site-header.tsx)
const sidebar: DocsSlots["sidebar"] = {
  provider: ({ children }) => children,
  root: SiteSidebar,
  trigger: (props) => {
    const { setOpen } = useNavDrawer();
    return <button type="button" {...props} onClick={() => setOpen(true)} />;
  },
  useSidebar: () => ({ collapsed: false, ...useNavDrawer() }),
};

export function SiteDocsLayout({ tree, children }: { tree: PageTree.Root; children: ReactNode }) {
  return (
    <DocsLayout tree={tree} nav={{ enabled: false }} themeSwitch={{ enabled: false }} searchToggle={{ enabled: false }} slots={{ sidebar }}>
      {children}
    </DocsLayout>
  );
}
