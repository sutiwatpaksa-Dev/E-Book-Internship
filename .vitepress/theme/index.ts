import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import AdminPanel from "./components/admin-panel.vue";
import AuthNav from "./components/auth-nav.vue";
import LoginForm from "./components/login-form.vue";
import RequirementViewer from "./components/requirement-viewer.vue";
import { canSee, needsRole, readRoleHint } from "./lib/access";
import "./styles/custom.css";

export default {
  extends: DefaultTheme,
  // แผง Requirement อยู่ใน layout จึงเปิดค้างไว้ได้ขณะเปลี่ยนหน้า
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      "nav-bar-content-after": () => h(AuthNav),
      "layout-bottom": () => h(RequirementViewer),
    }),
  enhanceApp({ app, router }) {
    app.component("LoginForm", LoginForm);
    app.component("AdminPanel", AdminPanel);
    // กดลิงก์ไปหน้าที่ล็อกโดยยังไม่ได้ login: พาไปหน้า login เลย แทนที่จะโหลดไฟล์หน้าแล้วได้ 401
    router.onBeforeRouteChange = (to) => {
      const path = new URL(to, "http://x").pathname;
      const have = readRoleHint();
      if (typeof window === "undefined" || canSee(needsRole(path), have)) return;
      window.location.assign(`${have ? "/no-access" : "/login"}?next=${encodeURIComponent(path)}`);
      return false;
    };
  },
} satisfies Theme;
