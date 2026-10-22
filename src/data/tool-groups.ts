// ทำเนียบเครื่องมือแยกตามกลุ่ม ใช้แสดงตาราง "ในกลุ่มนี้มีใครบ้าง" ในบทเรียน (<ToolTable group="..." />)
// เครื่องมือใหม่เกิดทุกปี: เพิ่มที่นี่ที่เดียว ทุกบทที่ใช้กลุ่มนี้อัปเดตตาม
// เนื้อหาบทสอน "กลุ่ม" (แก้ปัญหาอะไร เลือกยังไง) ส่วนรายชื่อสมาชิกเปลี่ยนได้ จึงแยกไว้เป็นข้อมูล

// team = ทีมใช้อยู่ (ลงมือในบท) · know = ควรรู้จัก เจอบ่อยในงานจริง · aware = รู้ว่ามี เจอแล้วจัดกลุ่มได้
export type ToolLevel = "team" | "know" | "aware";

export type Tool = {
  name: string;
  // หน้าเอกสารทางการที่ยืนยันข้อมูลในแถวนี้ได้ (ไม่ใช่แค่หน้าแรกของเว็บ)
  url: string;
  // ค่าคอลัมน์ detail ของกลุ่ม (เช่น engine, ชื่อ lock file)
  detail: string;
  summary: string;
  level: ToolLevel;
};

export type ToolGroup = {
  title: string;
  detailLabel: string;
  // วันที่เทียบกับเว็บทางการครั้งล่าสุด แสดงใต้ตาราง
  checkedAt: string;
  tools: Tool[];
};

export const toolGroups = {
  "js-runtime": {
    title: "Runtime ของ JavaScript",
    detailLabel: "Engine",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "Bun", url: "https://bun.com/docs/runtime/typescript", detail: "JavaScriptCore", level: "team", summary: "server และเครื่องมือ dev · รัน TypeScript ได้ทันที โปรแกรมเดียวมีทั้งตัวรัน ตัวจัดการ library ตัวเทสต์ และตัวรวมไฟล์" },
      { name: "Node.js", url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs", detail: "V8", level: "know", summary: "server และเครื่องมือ dev · เกิดปี 2009 เอา V8 ออกมารันนอก browser เป็นมาตรฐานของวงการ package แทบทุกตัวรองรับ" },
      { name: "Browser (Chrome, Safari, Firefox)", url: "https://developer.mozilla.org/docs/Web/JavaScript", detail: "V8, JavaScriptCore, SpiderMonkey", level: "know", summary: "หน้าเว็บฝั่งผู้ใช้ · มีในทุกเครื่อง แต่ถูกจำกัดสิทธิ์ (อ่านไฟล์ในเครื่องเองไม่ได้)" },
      { name: "Deno", url: "https://docs.deno.com/runtime/fundamentals/security/", detail: "V8", level: "aware", summary: "สร้างโดยคนที่สร้าง Node ปิดสิทธิ์เข้าถึงไฟล์/เน็ตเป็นค่าเริ่มต้น · ต.ค. 2569 ทีมย้ายไปอยู่กับ Cloudflare จะออกแค่รุ่นแก้บั๊กอีกราว 1 ปี (deno.com/blog/cloudflare)" },
      { name: "Cloudflare Workers (workerd)", url: "https://developers.cloudflare.com/workers/reference/how-workers-works/", detail: "V8 (isolate)", level: "aware", summary: "รันโค้ดบนเครื่องของผู้ให้บริการที่อยู่ใกล้ผู้ใช้ (edge) · เริ่มทำงานเร็วมาก ใช้ API ของ Node ได้บางส่วน (ต้องเปิด nodejs_compat)" },
      { name: "Hermes", url: "https://reactnative.dev/docs/hermes", detail: "Hermes", level: "aware", summary: "engine ที่ Meta สร้าง เป็นค่าเริ่มต้นของแอปมือถือที่เขียนด้วย React Native" },
      { name: "QuickJS", url: "https://bellard.org/quickjs/", detail: "QuickJS", level: "aware", summary: "engine ภาษา C ขนาดเล็ก ไม่พึ่งอะไรเพิ่ม ใช้ฝังในโปรแกรมอื่นหรืออุปกรณ์ที่ทรัพยากรน้อย" },
    ],
  },
  "js-package-manager": {
    title: "Package Manager ของ JavaScript",
    detailLabel: "lock file",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "Bun", url: "https://bun.com/docs/pm/cli/install", detail: "bun.lock", level: "team", summary: "มาพร้อม runtime Bun · ติดตั้งเร็วมาก (โปรเจกต์ที่สร้างก่อน Bun 1.2 อาจเห็น bun.lockb ซึ่งเป็นแบบไฟล์ binary)" },
      { name: "npm", url: "https://docs.npmjs.com/downloading-and-installing-node-js-and-npm", detail: "package-lock.json", level: "know", summary: "ติดตั้งมาพร้อม Node · ตัวอย่างในเน็ตส่วนใหญ่ใช้ตัวนี้" },
      { name: "pnpm", url: "https://pnpm.io/motivation", detail: "pnpm-lock.yaml", level: "know", summary: "ประหยัดดิสก์ เก็บ package ไว้ที่เดียวแล้วลิงก์มาใช้ · รองรับโปรเจกต์ที่มีหลายแพ็กเกจในที่เดียว (monorepo) ในตัว" },
      { name: "Yarn (v2 ขึ้นไป)", url: "https://yarnpkg.com/features/pnp", detail: "yarn.lock", level: "aware", summary: "รุ่นปัจจุบัน 4.x · ค่าเริ่มต้นเป็นโหมด Plug'n'Play ที่ไม่สร้าง node_modules · ใช้คู่กับ Node" },
      { name: "Yarn Classic (v1)", url: "https://yarnpkg.com/getting-started/qa", detail: "yarn.lock", level: "aware", summary: "รุ่นเก่าที่ยังเจอในโปรเจกต์เดิม ทีม Yarn ออกแค่รุ่นแก้ไขที่จำเป็น ไม่เพิ่มความสามารถใหม่" },
      { name: "Deno", url: "https://docs.deno.com/runtime/reference/cli/install/", detail: "deno.lock", level: "aware", summary: "มาพร้อม runtime Deno · ดึงได้ทั้งจาก npm และ JSR" },
    ],
  },
  "js-registry": {
    title: "Registry (คลังที่เก็บ package)",
    detailLabel: "ใช้กับอะไร",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "npm registry", url: "https://docs.npmjs.com/about-npm", detail: "ทุกตัวในตารางบน", level: "know", summary: "คลังกลางของ JavaScript ใหญ่ที่สุดในโลก ค่าเริ่มต้นของแทบทุกเครื่องมือ" },
      { name: "JSR", url: "https://jsr.io/docs/using-packages", detail: "Deno, pnpm, Yarn ในตัว · npm/Bun ผ่าน npx jsr", level: "aware", summary: "คลังรุ่นใหม่ รับโค้ด TypeScript โดยตรง ใช้ได้ทั้ง Node, Deno, Bun และ browser" },
      { name: "GitHub Packages", url: "https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry", detail: ".npmrc + token", level: "aware", summary: "เก็บ package ส่วนตัวของบริษัทไว้คู่กับ repo เผยแพร่ครั้งแรกเป็นแบบส่วนตัว" },
      { name: "Registry ส่วนตัว (เช่น Verdaccio)", url: "https://verdaccio.org/docs/what-is-verdaccio", detail: ".npmrc", level: "aware", summary: "บริษัทตั้งคลังเอง ใช้ในเครือข่ายภายใน และเก็บสำเนาของจากคลังกลางไว้ใช้ต่อ" },
    ],
  },
} satisfies Record<string, ToolGroup>;

export type ToolGroupId = keyof typeof toolGroups;
