// ทำเนียบเครื่องมือแยกตามกลุ่ม ใช้แสดงตาราง "ในกลุ่มนี้มีใครบ้าง" ในบทเรียน (<ToolTable group="..." />)
// เครื่องมือใหม่เกิดทุกปี: เพิ่มที่นี่ที่เดียว ทุกบทที่ใช้กลุ่มนี้อัปเดตตาม
// เนื้อหาบทสอน "กลุ่ม" (แก้ปัญหาอะไร เลือกยังไง) ส่วนรายชื่อสมาชิกเปลี่ยนได้ จึงแยกไว้เป็นข้อมูล

// team = ทีมใช้อยู่ (ลงมือในบท) · know = ควรรู้จัก เจอบ่อยในงานจริง · aware = รู้ว่ามี เจอแล้วจัดกลุ่มได้
export type ToolLevel = "team" | "know" | "aware";

export type Tool = {
  name: string;
  url: string;
  // ค่าคอลัมน์ detail ของกลุ่ม (เช่น engine, ชื่อ lock file)
  detail: string;
  summary: string;
  level: ToolLevel;
};

export type ToolGroup = {
  title: string;
  detailLabel: string;
  tools: Tool[];
};

export const toolGroups = {
  "js-runtime": {
    title: "Runtime ของ JavaScript",
    detailLabel: "Engine",
    tools: [
      { name: "Bun", url: "https://bun.sh", detail: "JavaScriptCore", level: "team", summary: "server และเครื่องมือ dev · เร็ว รัน TypeScript ได้ทันที มีตัวจัดการ library และ test ในตัว" },
      { name: "Node.js", url: "https://nodejs.org", detail: "V8", level: "know", summary: "server และเครื่องมือ dev · เกิดปี 2009 มาตรฐานของวงการ package แทบทุกตัวรองรับ" },
      { name: "Browser (Chrome, Safari, Firefox)", url: "https://developer.mozilla.org/docs/Web/JavaScript", detail: "V8, JavaScriptCore, SpiderMonkey", level: "know", summary: "หน้าเว็บฝั่งผู้ใช้ · มีในทุกเครื่อง แต่ถูกจำกัดสิทธิ์ (อ่านไฟล์ในเครื่องเองไม่ได้)" },
      { name: "Deno", url: "https://deno.com", detail: "V8", level: "know", summary: "server และ script · สร้างโดยคนที่สร้าง Node ปิดสิทธิ์เข้าถึงไฟล์/เน็ตเป็นค่าเริ่มต้น" },
      { name: "Cloudflare Workers (workerd)", url: "https://developers.cloudflare.com/workers/", detail: "V8", level: "aware", summary: "รันโค้ดบนเครื่องของผู้ให้บริการที่อยู่ใกล้ผู้ใช้ (edge) · เริ่มทำงานเร็วมาก แต่ API น้อยกว่า Node" },
      { name: "Hermes", url: "https://github.com/facebook/hermes", detail: "Hermes", level: "aware", summary: "รัน JavaScript ในแอปมือถือที่เขียนด้วย React Native" },
      { name: "QuickJS", url: "https://bellard.org/quickjs/", detail: "QuickJS", level: "aware", summary: "engine ขนาดเล็ก ใช้ฝังในโปรแกรมอื่นหรืออุปกรณ์ที่ทรัพยากรน้อย" },
    ],
  },
  "js-package-manager": {
    title: "Package Manager ของ JavaScript",
    detailLabel: "lock file",
    tools: [
      { name: "Bun", url: "https://bun.sh/docs/cli/install", detail: "bun.lock", level: "team", summary: "มาพร้อม runtime Bun · ติดตั้งเร็วมาก" },
      { name: "npm", url: "https://docs.npmjs.com", detail: "package-lock.json", level: "know", summary: "ติดมากับ Node ทุกเครื่อง · ตัวอย่างในเน็ตส่วนใหญ่ใช้ตัวนี้" },
      { name: "pnpm", url: "https://pnpm.io", detail: "pnpm-lock.yaml", level: "know", summary: "ประหยัดดิสก์ เก็บ package ไว้ที่เดียวแล้วลิงก์มาใช้ · นิยมในโปรเจกต์ใหญ่ที่มีหลายแพ็กเกจในที่เดียว (monorepo)" },
      { name: "Yarn (v2 ขึ้นไป)", url: "https://yarnpkg.com", detail: "yarn.lock", level: "aware", summary: "มีโหมด Plug'n'Play ที่ไม่สร้าง node_modules · ใช้คู่กับ Node" },
      { name: "Yarn Classic (v1)", url: "https://classic.yarnpkg.com", detail: "yarn.lock", level: "aware", summary: "รุ่นเก่าที่ยังเจอในโปรเจกต์เดิม หยุดพัฒนาฟีเจอร์ใหม่แล้ว" },
      { name: "Deno", url: "https://docs.deno.com/runtime/fundamentals/modules/", detail: "deno.lock", level: "aware", summary: "มาพร้อม runtime Deno · ดึงได้ทั้งจาก npm และ JSR" },
    ],
  },
  "js-registry": {
    title: "Registry (คลังที่เก็บ package)",
    detailLabel: "ใครใช้",
    tools: [
      { name: "npm registry", url: "https://www.npmjs.com", detail: "ทุกตัวในตารางบน", level: "know", summary: "คลังกลางของ JavaScript มีหลายล้าน package ค่าเริ่มต้นของแทบทุกเครื่องมือ" },
      { name: "JSR", url: "https://jsr.io", detail: "Deno, npm, pnpm, Bun ผ่านตัวช่วย", level: "aware", summary: "คลังรุ่นใหม่ที่รับ TypeScript โดยตรง" },
      { name: "GitHub Packages", url: "https://docs.github.com/packages", detail: "ตั้งค่าใน .npmrc", level: "aware", summary: "เก็บ package ส่วนตัวของบริษัทไว้คู่กับ repo" },
      { name: "Registry ส่วนตัว (เช่น Verdaccio)", url: "https://verdaccio.org", detail: "ตั้งค่าใน .npmrc", level: "aware", summary: "บริษัทตั้งคลังเอง ใช้ในเครือข่ายภายในหรือเก็บสำเนาไว้กันคลังกลางล่ม" },
    ],
  },
} satisfies Record<string, ToolGroup>;

export type ToolGroupId = keyof typeof toolGroups;
