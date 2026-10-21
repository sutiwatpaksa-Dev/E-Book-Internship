import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import RequirementViewer from "./RequirementViewer.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  // แผง Requirement อยู่ใน layout จึงเปิดค้างไว้ได้ขณะเปลี่ยนหน้า
  Layout: () => h(DefaultTheme.Layout, null, { "layout-bottom": () => h(RequirementViewer) }),
};
