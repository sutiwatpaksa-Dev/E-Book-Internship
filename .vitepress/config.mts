import { readFileSync } from "node:fs";
import { defineConfig } from "vitepress";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
const base = process.env.BASE_PATH ?? "/";
const siteUrl = "https://e-book-internship.vercel.app";

const chapters = [
  { text: "00 · ก่อนเริ่ม", link: "/00-start" },
  { text: "01 · Git", link: "/01-git" },
  { text: "02 · Docker vs VM", link: "/02-docker" },
  { text: "03 · Node vs Yarn vs Bun", link: "/03-node-yarn-bun" },
  { text: "04 · JavaScript vs TypeScript", link: "/04-typescript" },
  { text: "05 · HTTP & REST API", link: "/05-http-api" },
  { text: "06 · SQL vs NoSQL", link: "/06-sql-nosql" },
  { text: "07 · MySQL vs PostgreSQL", link: "/07-mysql-postgres" },
  { text: "08 · Drizzle vs Prisma vs Sequelize", link: "/08-orm" },
  { text: "09 · Debugging", link: "/09-debugging" },
  { text: "10 · Security พื้นฐาน", link: "/10-security" },
  { text: "11 · สร้างหน้าเว็บด้วย React", link: "/11-react" },
  { text: "12 · ตกแต่งเว็บทุกขนาดจอ (Tailwind)", link: "/12-tailwind" },
  { text: "13 · หลายหน้า + Google หาเจอ", link: "/13-router-seo" },
  { text: "14 · สร้าง API (Bun + Hono)", link: "/14-hono-api" },
  { text: "15 · ระบบ login หน้าจัดการร้าน", link: "/15-auth" },
  { text: "16 · ทำงานคู่กับ AI", link: "/16-ai-pairing" },
  { text: "17 · เน็ตเวิร์กพื้นฐาน", link: "/17-network" },
  { text: "18 · ชื่อเว็บ (Domain & DNS)", link: "/18-domain-dns" },
  { text: "19 · เช่าเครื่อง (VPS) + SSH", link: "/19-server" },
  { text: "20 · ขึ้นเว็บบนเครื่องเช่า", link: "/20-deploy-vps" },
  { text: "21 · ตรวจและขึ้นระบบอัตโนมัติ", link: "/21-cicd" },
  { text: "22 · บริการสำเร็จรูป (Vercel)", link: "/22-deploy-managed" },
  { text: "23 · เปิดใช้จริง + ดูแลระบบ", link: "/23-go-live" },
];

const starter = [
  { text: "Requirement + สรุปร้าน", link: "/starter/" },
  { text: "หน้าเว็บ + หน้าจัดการร้าน", link: "/starter/requirements" },
  { text: "ฐานข้อมูล + รายการ API", link: "/starter/database-api" },
  { text: "คุณภาพที่ต้องได้", link: "/starter/quality" },
  { text: "แผน 10 วัน", link: "/starter/timeline" },
  { text: "การส่งงาน + เกณฑ์", link: "/starter/submission" },
  { text: "เทียบกับเอกสารต้นฉบับ", link: "/starter/compare" },
];

export default defineConfig({
  lang: "th-TH",
  title: "คู่มือฝึกงาน Blicktech",
  description: "Basic Dev Fundamentals สำหรับน้องฝึกงาน บริษัท บลิคซ์เทค คอนซัลแทนท์ จำกัด",
  // Vercel เสิร์ฟที่ root ถ้าย้ายไปอยู่ใต้ path ย่อย ให้ตั้ง BASE_PATH เช่น /handbook/
  base,
  rewrites: { "README.md": "index.md" },
  srcExclude: ["node_modules/**", "MAINTAINING.md", "Handoff*.md"],
  // ลิงก์ localhost ในบทเรียนตั้งใจให้เปิดบนเครื่องน้องเอง
  ignoreDeadLinks: "localhostLinks",
  cleanUrls: true,
  // ขึ้นบรรทัดใหม่ในไฟล์ = ขึ้นบรรทัดใหม่บนหน้าเว็บ (บทสนทนาและกล่องข้อความเขียนไว้ทีละบรรทัด)
  markdown: { breaks: true },
  lastUpdated: true,
  // ตอนพัฒนาในเครื่อง ส่ง /api ไปที่ API (bun run api:dev) บน Vercel ใช้ rewrites ใน vercel.json แทน
  vite: { server: { proxy: { "/api": "http://localhost:3001" } } },
  head: [
    ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: `${base}brand/favicon-32.png` }],
    ["link", { rel: "icon", type: "image/png", sizes: "64x64", href: `${base}brand/favicon-64.png` }],
    ["link", { rel: "apple-touch-icon", href: `${base}brand/apple-touch-icon.png` }],
    // ภาพตัวอย่างตอนแชร์ลิงก์ (LINE, Facebook, Slack) ต้องเป็น URL เต็ม
    ["meta", { property: "og:image", content: `${siteUrl}/brand/og.png` }],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap",
      },
    ],
  ],
  themeConfig: {
    logo: { light: "/brand/mark.png", dark: "/brand/mark-dark.png", alt: "Blicktech" },
    siteTitle: "คู่มือฝึกงาน",
    nav: [
      { text: "เริ่มอ่าน", link: "/00-start" },
      { text: "Mini Project", link: "/starter/" },
      { text: "Deploy", link: "/17-network" },
      { text: "ศัพท์", link: "/glossary" },
      { text: "Cheat Sheet", link: "/cheat-sheet" },
      { text: `v${version}`, link: "/changelog" },
    ],
    sidebar: [
      { text: "🏠 หน้าแรก", link: "/" },
      { text: "ด่าน 1 · เตรียมตัว", items: chapters.slice(0, 3) },
      { text: "ด่าน 2 · ภาษาและ API", items: chapters.slice(3, 6) },
      { text: "ด่าน 3 · ข้อมูล", items: chapters.slice(6, 9) },
      { text: "ด่าน 4 · มืออาชีพ", items: chapters.slice(9, 11) },
      {
        text: "ด่าน 5 · สร้างเว็บ Fullstack",
        items: [...chapters.slice(11, 17), { text: "บทเสริม · ภาษาและคำสั่งที่ใช้เขียน React", link: "/react-language" }, { text: "บทเสริม · จัดโครงสร้างโปรเจกต์", link: "/project-structure" }],
      },
      { text: "ด่าน 6 · Mini Project: เว็บไซต์ STARTER", items: starter },
      { text: "ด่าน 7 · ขึ้นเว็บจริง", items: chapters.slice(17, 24) },
      { text: "📖 ศัพท์ที่ต้องรู้", link: "/glossary" },
      { text: "📋 Cheat Sheet", link: "/cheat-sheet" },
      { text: "📝 มีอะไรใหม่", link: "/changelog" },
    ],
    outline: { level: [2, 3], label: "ในบทนี้" },
    docFooter: { prev: "บทก่อนหน้า", next: "บทถัดไป" },
    lastUpdated: { text: "อัปเดตล่าสุด" },
    darkModeSwitchLabel: "ธีม",
    sidebarMenuLabel: "สารบัญ",
    returnToTopLabel: "กลับขึ้นด้านบน",
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "ค้นหา", buttonAriaLabel: "ค้นหา" },
          modal: {
            noResultsText: "ไม่พบผลลัพธ์",
            resetButtonTitle: "ล้าง",
            footer: { selectText: "เลือก", navigateText: "เลื่อน", closeText: "ปิด" },
          },
        },
      },
    },
    footer: {
      message: `สำหรับน้องฝึกงาน บริษัท บลิคซ์เทค คอนซัลแทนท์ จำกัด · เวอร์ชัน ${version}`,
    },
  },
});
