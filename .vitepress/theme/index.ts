import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Journey3D from "./components/Journey3D.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Journey3D", Journey3D);
  },
} satisfies Theme;
