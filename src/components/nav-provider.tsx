"use client";

import { createContext, use, type ReactNode } from "react";
import type { NavModel } from "@/lib/nav-tree";

// โครงเมนูสร้างครั้งเดียวฝั่ง server (layout) แล้วส่งลงมาให้ headbar, sidebar และลิ้นชักมือถือใช้ร่วมกัน
type Site = { nav: NavModel; version: string };
const SiteContext = createContext<Site | null>(null);

export function NavProvider({ nav, version, children }: Site & { children: ReactNode }) {
  return <SiteContext value={{ nav, version }}>{children}</SiteContext>;
}

export function useSite() {
  const site = use(SiteContext);
  if (!site) throw new Error("useSite() ต้องใช้ภายใต้ <NavProvider>");
  return site;
}
