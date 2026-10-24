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
      // หน้าแรกคือ "วันนี้" (ทำต่อจากที่ค้าง) · ไม่ permanent เผื่อเปลี่ยนใจ เบราว์เซอร์จะได้ไม่จำไว้
      { source: "/", destination: "/today", permanent: false },
    ];
  },
};

export default withMDX(config);
