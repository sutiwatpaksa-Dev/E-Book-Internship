import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RequirementViewer } from "@/components/requirement-viewer";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
      {children}
      {/* อยู่ใน layout จึงเปิดค้างไว้ได้ขณะเปลี่ยนหน้า STARTER */}
      <RequirementViewer />
    </DocsLayout>
  );
}
