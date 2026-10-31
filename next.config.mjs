import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      // ลิงก์ PDF เดิม (v1.6.x) ยังใช้ได้ ไฟล์ย้ายไปอยู่หลัง login แล้ว
      { source: "/docs/starter-requirement.pdf", destination: "/api/files/requirement.pdf", permanent: false },
      { source: "/dev", destination: "/dev/admin", permanent: false },
      // หน้าแรกของน้องเปลี่ยนจาก /today เป็น /dashboard (v2.2.0) · bookmark เดิมยังเปิดได้
      { source: "/today", destination: "/dashboard", permanent: true },
      // slug การ์ดที่เปลี่ยนชื่อ (v2.1.18) · bookmark เดิมยังเปิดได้ ข้อมูลใน DB ย้ายด้วย migration 0013
      // permanent = 308: browser และ search engine จำที่อยู่ใหม่ไปเลย (ไม่เปลี่ยนกลับแน่นอน)
      ...Object.entries({
        "read-requirement": "reading-requirements",
        "fetch-data": "data-fetching",
        "unit-test": "unit-testing",
        "deploy-online": "vps-deployment",
      }).map(([from, to]) => ({ source: `/learn/cards/${from}`, destination: `/learn/cards/${to}`, permanent: true })),
      // หน้า / ตัดสินใน src/app/page.tsx (ต้องอ่าน cookie ว่า login อยู่ไหม ซึ่ง redirects ตรงนี้ทำไม่ได้)
    ];
  },
};

export default withMDX(config);
