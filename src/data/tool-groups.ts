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
  "ts-type-checker": {
    title: "Type Checker (ตรวจ type ก่อนรัน)",
    detailLabel: "คำสั่งตรวจ",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "TypeScript 7 (tsc)", url: "https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/", detail: "tsc --noEmit", level: "team", summary: "ตัวตรวจมาตรฐานของ TypeScript · รุ่น 7 (ก.ค. 2569) เขียนใหม่ด้วยภาษา Go build เร็วขึ้นราว 8–12 เท่า ตรวจหลายส่วนพร้อมกัน ติดตั้งและสั่งงานเหมือนเดิม" },
      { name: "bun check", url: "https://bun.com/docs/runtime/check", detail: "bun check", level: "know", summary: "มากับ Bun อ่าน tsconfig.json เดียวกันและรายงาน error แบบเดียวกับ tsc ของ TypeScript 7 · ตรวจอย่างเดียว ไม่เขียนไฟล์ · ถ้า package.json มี script ชื่อ check จะรัน script นั้นแทน" },
      { name: "TypeScript 6 (tsc6)", url: "https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/", detail: "tsc6", level: "aware", summary: "รุ่นสุดท้ายที่เขียนด้วย TypeScript เอง · TS 7.0 ยังไม่มี API ให้โปรแกรมอื่นเรียก เครื่องมือที่ฝัง TypeScript ไว้ (เช่น Vue, Svelte, Astro, MDX) จึงยังใช้รุ่น 6 อยู่ ติดตั้งคู่กันได้ผ่าน @typescript/typescript6" },
      { name: "deno check", url: "https://docs.deno.com/runtime/fundamentals/typescript/", detail: "deno check main.ts", level: "aware", summary: "มากับ Deno · deno run ไม่ตรวจ type เป็นค่าเริ่มต้น ต้องสั่ง deno check หรือใส่ --check เอง" },
      { name: "JSDoc + // @ts-check", url: "https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html", detail: "// @ts-check", level: "aware", summary: "ให้ TypeScript ตรวจไฟล์ .js ได้โดยเขียน type เป็นคอมเมนต์ JSDoc ไม่ต้องเปลี่ยนนามสกุลไฟล์ · ทางเดินสำหรับโปรเจกต์ JavaScript เดิม" },
      { name: "Flow", url: "https://flow.org/en/docs/getting-started/", detail: "flow", level: "aware", summary: "ตัวตรวจ type ของ Meta เป็นภาษาแยกจาก TypeScript (หน้าตาคล้าย) ต้องใช้ Babel หรือ flow-remove-types ลบ type ก่อนรัน" },
    ],
  },
  "ts-transpiler": {
    title: "ตัวแปลง TS → JS (ลบ type ก่อนรัน)",
    detailLabel: "ตรวจ type ให้ไหม",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "Bun", url: "https://bun.com/docs/runtime/typescript", detail: "ไม่ตรวจ", level: "team", summary: "รัน .ts ได้ทันที รองรับ import ที่ลงท้าย .ts · bun init สร้าง tsconfig.json ที่แนะนำให้" },
      { name: "tsx", url: "https://tsx.hirok.io/typescript", detail: "ไม่ตรวจ", level: "know", summary: "รันไฟล์ .ts บน Node ได้ทันที เหมาะตอน dev · เอกสารบอกเองว่าไม่ตรวจ type แนะนำให้รัน tsc --noEmit แยก (เช่น ก่อน commit และใน CI)" },
      { name: "Node.js (type stripping)", url: "https://nodejs.org/api/typescript.html", detail: "ไม่ตรวจ", level: "know", summary: "ตั้งแต่ v22.18 / v23.6 รัน .ts ได้เลยโดยแทน type ด้วยช่องว่าง (stable ตั้งแต่ v24.12 / v25.2) · ไม่อ่าน tsconfig.json ไม่รองรับ enum และ import ต้องลงท้าย .ts" },
      { name: "tsc (สร้างไฟล์ .js)", url: "https://www.typescriptlang.org/tsconfig/#noEmit", detail: "ตรวจ ✅", level: "know", summary: "ตัวเดียวในกลุ่มที่ตรวจ type ไปพร้อมกับแปลง เขียน .js ลง outDir · ถ้าตั้ง noEmit จะตรวจอย่างเดียว แล้วปล่อยให้เครื่องมืออื่นแปลงแทน" },
      { name: "Vite (Oxc)", url: "https://vite.dev/guide/features#typescript", detail: "ไม่ตรวจ", level: "aware", summary: "เครื่องมือ dev/build ของงานหน้าเว็บ ใช้ Oxc Transformer ลบ type ให้ · เอกสารย้ำว่าทำแค่แปลง ไม่ตรวจ type" },
      { name: "SWC (ใน Next.js)", url: "https://nextjs.org/docs/architecture/nextjs-compiler", detail: "ไม่ตรวจ", level: "aware", summary: "ตัวแปลงภาษา Rust ที่ Next.js ใช้แปลงและย่อโค้ดแทน Babel · Next.js สั่ง tsc ตรวจ type แยกอีกขั้นตอน next build" },
      { name: "esbuild", url: "https://esbuild.github.io/content-types/#typescript", detail: "ไม่ตรวจ", level: "aware", summary: "ตัวรวมไฟล์ (bundler) ที่แปลงแต่ละไฟล์แยกกัน เอกสารแนะนำให้เปิด isolatedModules และรัน tsc --noEmit คู่กันเพื่อตรวจ type" },
      { name: "Babel (@babel/preset-typescript)", url: "https://babeljs.io/docs/babel-plugin-transform-typescript", detail: "ไม่ตรวจ", level: "aware", summary: "ตัวแปลง JavaScript รุ่นเก่าแก่ ลบ type ทิ้งอย่างเดียว เอกสารเตือนว่าโค้ดที่ type ผิดก็ยังแปลงผ่าน" },
    ],
  },
  "ts-validator": {
    title: "Schema Validator (ตรวจข้อมูลตอนรัน)",
    detailLabel: "หน้าตา schema",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "Zod", url: "https://zod.dev/", detail: "z.object({ ... })", level: "team", summary: "รุ่นปัจจุบัน 4 · ออกแบบมาเพื่อ TypeScript ได้ type จาก schema ไม่ต้องเขียนซ้ำ ไม่มี dependency · มีรุ่นเล็ก Zod Mini สำหรับงานที่ห่วงขนาดไฟล์" },
      { name: "Valibot", url: "https://valibot.dev/guides/introduction/", detail: "v.object({ ... })", level: "know", summary: "แยกเป็นฟังก์ชันเล็กๆ ให้ bundler ตัดส่วนที่ไม่ใช้ทิ้ง เอกสารอ้างว่าเล็กกว่า Zod ได้ถึง 95% · ได้แรงบันดาลใจจาก Zod และมีคู่มือย้ายมาจาก Zod" },
      { name: "ArkType", url: "https://arktype.io/docs/intro/your-first-type", detail: "type({ a: \"number\" })", level: "aware", summary: "เขียน schema เป็นข้อความหน้าตาเหมือน type ของ TypeScript · ได้ type ผ่าน .infer และตรวจผลด้วย instanceof type.errors" },
      { name: "TypeBox", url: "https://github.com/sinclairzx81/typebox", detail: "Type.Object({ ... })", level: "aware", summary: "schema ที่สร้างออกมาเป็น JSON Schema มาตรฐาน และได้ type ของ TS ด้วย Static · เอา schema ไปใช้ต่อกับเครื่องมือที่อ่าน JSON Schema ได้" },
      { name: "Yup", url: "https://github.com/jquense/yup", detail: "object({ ... })", level: "aware", summary: "ตัวสร้าง schema สำหรับแปลงและตรวจค่าตอนรัน ได้ type จาก schema ด้วย InferType" },
    ],
  },
  "api-style": {
    title: "รูปแบบ API",
    detailLabel: "ส่งข้อมูลแบบไหน",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "REST", url: "https://developer.mozilla.org/en-US/docs/Glossary/REST", detail: "HTTP + JSON (ส่วนใหญ่)", level: "team", summary: "มอง URL เป็นสิ่งของ ใช้ method ของ HTTP เป็นคำกริยา และบอกผลด้วย status code · เป็นแนวทางออกแบบ ไม่ใช่โปรแกรมให้ติดตั้ง อะไรที่พูด HTTP ได้ก็เรียกได้" },
      { name: "GraphQL", url: "https://graphql.org/learn/serving-over-http/", detail: "POST ไปที่ URL เดียว (มักเป็น /graphql)", level: "know", summary: "client เขียน query บอกเองว่าอยากได้ช่องไหน มี schema กำหนดชนิดข้อมูล · error บางแบบยังได้ status 2xx ต้องอ่านช่อง errors ในคำตอบ" },
      { name: "gRPC", url: "https://grpc.io/docs/what-is-grpc/introduction/", detail: "Protocol Buffers (ไฟล์ .proto)", level: "aware", summary: "เขียนสัญญาของ service ไว้ในไฟล์ .proto แล้วสร้างโค้ด client และ server ให้หลายภาษา · ฝั่ง server กับ client เป็นคนละภาษากันได้" },
      { name: "tRPC", url: "https://trpc.io/docs", detail: "type ของ TypeScript (ไม่มี schema แยก)", level: "aware", summary: "เรียกฟังก์ชันฝั่ง server ได้เหมือนฟังก์ชันในโค้ดตัวเอง type ตรงกันสองฝั่งโดยไม่ต้อง generate โค้ด · ทำมาสำหรับโปรเจกต์ที่เป็น TypeScript ทั้งหน้าบ้านและหลังบ้าน" },
      { name: "JSON-RPC", url: "https://www.jsonrpc.org/specification", detail: "JSON { method, params, id }", level: "aware", summary: "สเปก RPC ขนาดเล็ก ส่งชื่อคำสั่งกับค่าเป็น JSON · ไม่ผูกกับ HTTP ใช้ผ่าน socket หรือช่องทางอื่นก็ได้" },
      { name: "WebSocket", url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API", detail: "ws:// / wss:// (สองทาง)", level: "know", summary: "เปิดสายค้างไว้ คุยได้ทั้งสองทาง server ส่งข้อความหา browser ได้เองโดยไม่ต้องรอให้ถาม · เหมาะกับแชตหรือเกมหลายผู้เล่น" },
      { name: "Server-Sent Events (SSE)", url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events", detail: "text/event-stream (ทางเดียว)", level: "know", summary: "server ทยอยส่งข้อมูลมาทางเดียวบน HTTP ปกติ ฝั่ง browser ใช้ EventSource และต่อใหม่ให้เองเมื่อหลุด · บน HTTP/1.1 เปิดได้ราว 6 สายต่อโดเมน" },
      { name: "SOAP", url: "https://www.w3.org/TR/soap12-part1/", detail: "XML (มีซอง envelope)", level: "aware", summary: "มาตรฐาน W3C (รุ่น 1.2 ปี 2007) ส่งข้อความเป็น XML ห่อในซอง · เจอได้ตอนต้องต่อกับระบบรุ่นเก่า" },
    ],
  },
  "api-client": {
    title: "เครื่องมือเรียก/ทดสอบ API",
    detailLabel: "ใช้ผ่าน",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "curl", url: "https://curl.se/docs/manpage.html", detail: "Terminal", level: "team", summary: "ส่ง request จากบรรทัดคำสั่ง ใช้ได้แม้บน server ที่ไม่มีหน้าจอ · -i ดู header, -v ดูทุกขั้น, --json ใส่ header JSON ให้เอง" },
      { name: "REST Client (VS Code)", url: "https://marketplace.visualstudio.com/items?itemName=humao.rest-client", detail: "ไฟล์ .http / .rest", level: "team", summary: "เขียน request เป็นข้อความในไฟล์ กด Send Request แล้วดูผลข้างๆ · คั่นหลาย request ด้วย ### ตั้งตัวแปรได้ ไฟล์เก็บใน Git ได้" },
      { name: "DevTools ของ browser (Network)", url: "https://developer.chrome.com/docs/devtools/network/reference", detail: "browser (F12)", level: "know", summary: "ดู request ทุกตัวที่หน้าเว็บส่งจริง ทั้ง headers, response, เวลา · คลิกขวา Copy as cURL หรือ Copy as fetch เอาไปยิงซ้ำได้" },
      { name: "Postman", url: "https://learning.postman.com/docs/sending-requests/create-requests/request-basics/", detail: "แอป desktop / เว็บ / CLI", level: "know", summary: "รวม request เป็น collection แชร์ใน workspace ของทีม · ส่งได้ทั้ง HTTP, GraphQL, gRPC, WebSocket, Socket.IO, MQTT" },
      { name: "Bruno", url: "https://docs.usebruno.com/introduction/what-is-bruno", detail: "แอป desktop / CLI", level: "know", summary: "ทำงาน offline ไม่ต้องมีบัญชี cloud · collection เป็นไฟล์ข้อความในโฟลเดอร์ เก็บใน Git และรีวิวการเปลี่ยนแปลงได้เหมือนโค้ด" },
      { name: "Hoppscotch", url: "https://docs.hoppscotch.io/documentation/getting-started/introduction", detail: "เว็บ / desktop / CLI", level: "aware", summary: "open source เปิดในเบราว์เซอร์ใช้ได้ทันทีไม่ต้องติดตั้ง · ตั้งบน server ของทีมเองได้ (self-host)" },
      { name: "Thunder Client", url: "https://www.thunderclient.com/", detail: "extension ใน VS Code / JetBrains", level: "aware", summary: "หน้าจอแบบคลิกคล้าย Postman แต่อยู่ใน editor · เก็บ request ในเครื่อง และซิงก์ collection ผ่าน Git ได้" },
    ],
  },
  "api-framework": {
    title: "Framework ฝั่ง server (JS/TS)",
    detailLabel: "รันบน",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "Hono", url: "https://hono.dev/docs/", detail: "Bun, Node, Deno, Cloudflare Workers …", level: "team", summary: "สร้างบน Web Standards โค้ดชุดเดียวย้าย runtime ได้ · ไม่มี dependency · มีโหมด RPC ให้ client ได้ type จาก server" },
      { name: "Express", url: "https://expressjs.com/en/guide/migrating-5.html", detail: "Node.js 18+ (v5)", level: "know", summary: "บทที่ 5 ใช้ฝึก และงานเก่าของทีมยังใช้อยู่ ตัวอย่างในเน็ตเยอะที่สุด · v5 ส่ง error จาก async handler ไปหา error handler ให้เอง และ req.body เป็น undefined ถ้าไม่ได้อ่าน body" },
      { name: "NestJS", url: "https://docs.nestjs.com/", detail: "Node.js (ข้างในใช้ Express หรือ Fastify)", level: "know", summary: "โครงใหญ่ได้แรงบันดาลใจจาก Angular แบ่งโค้ดเป็น module / controller / provider · ค่าเริ่มต้นรันบน Express เปลี่ยนเป็น Fastify ได้" },
      { name: "Fastify", url: "https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/", detail: "Node.js", level: "aware", summary: "ใช้ JSON Schema ตรวจ request และแปลง response เป็น JSON โดย compile schema เป็นฟังก์ชันเพื่อความเร็ว" },
      { name: "Elysia", url: "https://elysiajs.com/at-glance.html", detail: "Bun (หลัก), Node, Deno, Cloudflare Workers", level: "aware", summary: "ปรับมาให้เร็วที่สุดบน Bun แต่ไม่จำกัดแค่ Bun · client Eden ได้ type จาก server โดยไม่ต้อง generate · ใช้ Zod ได้ผ่าน Standard Schema" },
      { name: "Koa", url: "https://koajs.com/", detail: "Node.js 18+", level: "aware", summary: "ทีมที่สร้าง Express ทำต่อ ใช้ async function แทน callback · แกนกลางไม่มี middleware ติดมา เลือกใส่เอง" },
    ],
  },
  "orm-driver": {
    title: "Driver (ต่อฐานข้อมูลโดยตรง)",
    detailLabel: "ฐานข้อมูล",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "pg (node-postgres)", url: "https://node-postgres.com/features/queries", detail: "PostgreSQL", level: "team", summary: "มี connection pool ในตัว ส่งค่าแยกจากคำสั่งด้วย $1, $2 · Drizzle ในบทนี้และเว็บคู่มือนี้ใช้ตัวนี้อยู่ข้างใต้" },
      { name: "Bun SQL (Bun.sql)", url: "https://bun.com/docs/runtime/sql", detail: "PostgreSQL, MySQL, MariaDB, SQLite", level: "know", summary: "มาในตัว Bun ไม่ต้องติดตั้งเพิ่ม เขียน SQL ใน template string ค่าที่แทรกด้วย ${} ถูกส่งเป็น parameter ให้เอง มี pool ในตัว" },
      { name: "postgres.js", url: "https://github.com/porsager/postgres", detail: "PostgreSQL", level: "know", summary: "เขียน SQL ใน template string แบบ sql`...` ค่าที่แทรกถูกแยกเป็น parameter ให้เอง ใช้ได้ทั้ง Node, Deno, Bun และ Cloudflare" },
      { name: "mysql2", url: "https://sidorares.github.io/node-mysql2/docs", detail: "MySQL", level: "know", summary: "ตัวต่อ MySQL ของ Node มี Promise API (mysql2/promise) และ prepared statement ผ่าน execute()" },
    ],
  },
  "orm-query-builder": {
    title: "Query Builder",
    detailLabel: "ได้ type ของตารางจาก",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "Drizzle (แบบ db.select())", url: "https://orm.drizzle.team/docs/select", detail: "schema ในไฟล์ .ts", level: "team", summary: "Drizzle มีทั้งระดับ query builder และ ORM ในตัวเดียว ส่วน db.select().from() หน้าตาเหมือน SQL แทบทุกคำ ได้ผลเป็นแถวแบน" },
      { name: "Kysely", url: "https://kysely.dev/docs/generating-types", detail: "interface ที่เขียนเอง หรือสร้างจาก DB (kysely-codegen)", level: "know", summary: "ประกอบ SQL ด้วยฟังก์ชันชื่อเดียวกับ SQL (selectFrom, where) TS เติมชื่อตาราง/คอลัมน์ให้ · มี Migrator ให้เขียน migration up/down เอง ไม่สร้างจาก schema" },
      { name: "Knex", url: "https://knexjs.org/guide/", detail: "ประกาศเอง (type แบบ best-effort)", level: "aware", summary: "รุ่นพี่ที่ Kysely ได้แรงบันดาลใจ รองรับหลายฐานข้อมูล มี migration และ seed ในตัว · มักเจอในโปรเจกต์ JavaScript ที่เขียนมานาน" },
    ],
  },
  "orm-orm": {
    title: "ORM",
    detailLabel: "ประกาศตารางที่",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "Drizzle ORM", url: "https://orm.drizzle.team/docs/overview", detail: "ไฟล์ .ts (pgTable)", level: "team", summary: "ใกล้ SQL ที่สุดในกลุ่ม ไม่มี dependency เพิ่ม มีทั้ง query แบบ SQL และแบบดึงข้อมูลซ้อน (db.query) · รุ่นนิ่ง 0.45 ส่วน 1.0 ยังเป็น RC" },
      { name: "Prisma ORM", url: "https://www.prisma.io/docs/orm/release-status", detail: "schema.prisma (ภาษาของ Prisma)", level: "know", summary: "เริ่มง่าย เอกสารดี มี Prisma Studio ดูข้อมูลผ่านเว็บ · รุ่น 7 ใช้ PrismaClient + driver adapter · รุ่น 8 (RC) เปลี่ยน API และคำสั่งเกือบหมด" },
      { name: "TypeORM", url: "https://typeorm.io/docs/getting-started/", detail: "class + decorator (@Entity, @Column)", level: "know", summary: "ประกาศตารางด้วย class เลือกได้ทั้งแบบ Active Record และ Data Mapper รองรับฐานข้อมูลหลายค่าย · ออกรุ่น 1.0 แล้วในปี 2569" },
      { name: "Sequelize", url: "https://sequelize.org/docs/v6/", detail: "Model.init() / class extends Model", level: "know", summary: "ORM แบบ promise ของ Node ที่อยู่มานาน รองรับหลายฐานข้อมูล · รุ่นนิ่งคือ v6 ส่วน v7 ยังเป็น alpha · มักเจอในระบบเก่า" },
      { name: "MikroORM", url: "https://mikro-orm.io/docs/quick-start", detail: "defineEntity หรือ decorator", level: "aware", summary: "ใช้แนวคิด Unit of Work: แก้ object หลายตัวแล้วสั่ง flush() ทีเดียว ORM คิดเองว่าต้อง insert หรือ update อะไร · รุ่นปัจจุบัน 7.x" },
    ],
  },
  "orm-migration": {
    title: "Migration Tool",
    detailLabel: "ได้ไฟล์ migration จาก",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "Drizzle Kit", url: "https://orm.drizzle.team/docs/migrations", detail: "เทียบ schema.ts แล้วสร้าง SQL ให้", level: "team", summary: "generate สร้างไฟล์ .sql ให้อ่านก่อน migrate รันจริง · จดประวัติในตาราง drizzle.__drizzle_migrations · ไม่มีคำสั่งย้อน migration ที่รันแล้ว" },
      { name: "Prisma Migrate", url: "https://www.prisma.io/docs/orm/v7/prisma-migrate/understanding-prisma-migrate/migration-histories", detail: "เทียบ schema.prisma แล้วสร้าง SQL ให้", level: "know", summary: "รุ่น 7: migrate dev ตอนพัฒนา, migrate deploy บน production · จดใน _prisma_migrations ถ้าไฟล์ที่รันแล้วถูกแก้จะ error/เตือน · รุ่น 8 (RC) เปลี่ยนเป็น migration plan / db migrate" },
      { name: "Flyway", url: "https://documentation.red-gate.com/fd/migrations-271585107.html", detail: "เขียน SQL เอง (V1__ชื่อ.sql)", level: "aware", summary: "รันไฟล์ SQL ตามเลขเวอร์ชัน จดลงตารางประวัติใน DB (flyway_schema_history) · ไม่ผูกกับภาษาหรือ ORM เพราะไฟล์เป็น SQL ล้วน" },
      { name: "dbmate", url: "https://github.com/amacneil/dbmate", detail: "เขียน SQL เอง (-- migrate:up / -- migrate:down)", level: "aware", summary: "โปรแกรมเล็กๆ ไม่ผูกกับภาษาไหน ไฟล์เดียวมีทั้งขาไปและขากลับ จดเวอร์ชันในตาราง schema_migrations" },
      { name: "Knex / Kysely / sequelize-cli", url: "https://knexjs.org/guide/migrations.html", detail: "เขียนฟังก์ชัน up / down เอง", level: "aware", summary: "migration ที่มากับ query builder (Knex, Kysely) และ Sequelize เขียนโค้ดเปลี่ยนโครงสร้างเองทั้งขาไปและขากลับ (Knex จดใน knex_migrations, Sequelize จดใน SequelizeMeta)" },
    ],
  },
  "db-relational": {
    title: "Relational Database (SQL)",
    detailLabel: "รันแบบไหน",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "PostgreSQL", url: "https://www.postgresql.org/about/", detail: "server", level: "team", summary: "ฐานข้อมูลหลักของทีม (ใช้ผ่าน Drizzle) · open source พัฒนามาเกือบ 40 ปี กฎเข้ม มีของเสริมเยอะ เช่น JSONB, ค้นข้อความในตัว, extension อย่าง pgvector" },
      { name: "MySQL", url: "https://dev.mysql.com/doc/refman/8.4/en/what-is-mysql.html", detail: "server", level: "know", summary: "open source ที่ Oracle พัฒนาและดูแล เจอบ่อยในเว็บและโปรเจกต์เดิม · เทียบกับ PostgreSQL ทีละเรื่องในบทที่ 7" },
      { name: "SQLite", url: "https://www.sqlite.org/about.html", detail: "ไฟล์เดียว ฝังในแอป", level: "know", summary: "ไม่มี server แยก ทั้งฐานข้อมูลอยู่ในไฟล์เดียวที่แอปเปิดเอง · ใช้ในแอปมือถือ โปรแกรมบนเครื่อง และงานทดลอง เป็นฐานข้อมูลที่ถูกติดตั้งใช้งานมากที่สุดในโลก" },
      { name: "MariaDB", url: "https://mariadb.org/about/", detail: "server", level: "aware", summary: "แยกสายมาจาก MySQL โดยทีมผู้สร้าง MySQL ชุดเดิม ใช้แทน MySQL ได้แทบทันที · open source (GPLv2)" },
      { name: "Microsoft SQL Server", url: "https://learn.microsoft.com/en-us/sql/sql-server/what-is-sql-server", detail: "server", level: "aware", summary: "ของ Microsoft ใช้ภาษา SQL สำเนียง T-SQL · ติดตั้งได้ทั้ง Windows, Linux และใน container" },
      { name: "Oracle AI Database", url: "https://docs.oracle.com/en/database/oracle/oracle-database/26/cncpt/introduction-to-oracle-database.html", detail: "server", level: "aware", summary: "ฐานข้อมูลเชิงพาณิชย์ของ Oracle (เดิมชื่อ Oracle Database รุ่นล่าสุด 26ai) รวมหลายรูปแบบข้อมูลไว้ในตัวเดียว ทั้งตาราง เอกสาร graph และข้อมูลแผนที่" },
      { name: "CockroachDB", url: "https://www.cockroachlabs.com/docs/stable/frequently-asked-questions", detail: "หลายเครื่อง (distributed SQL)", level: "aware", summary: "SQL ที่กระจายข้อมูลไปหลายเครื่องให้เอง เพิ่มเครื่องเพื่อขยายได้ · คุยด้วยโปรโตคอลแบบ PostgreSQL ใช้ syntax ส่วนใหญ่ได้แต่ไม่ครบ · ตั้งแต่รุ่น 24.3 ไม่ใช่ open source แล้ว" },
    ],
  },
  "db-nosql": {
    title: "NoSQL",
    detailLabel: "ตระกูล",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "MongoDB", url: "https://www.mongodb.com/docs/manual/core/document/", detail: "Document", level: "know", summary: "document database ที่เจอบ่อยที่สุด เก็บเป็น BSON (JSON แบบ binary) · มี transaction หลายเอกสาร (ตั้งแต่ 4.0) และตั้งกฎตรวจด้วย $jsonSchema ได้" },
      { name: "Redis", url: "https://redis.io/docs/latest/develop/data-types/", detail: "Key-Value", level: "know", summary: "เก็บใน RAM เร็วมาก ค่ามีหลายชนิด (string, hash, list, set, sorted set …) · ใช้ทำ cache, session, ตัวนับ · ตั้งแต่ Redis 8 เลือก license AGPLv3 ได้" },
      { name: "Valkey", url: "https://valkey.io/", detail: "Key-Value", level: "aware", summary: "แยกสายจาก Redis 7.2.4 เมื่อปี 2024 หลัง Redis เปลี่ยน license อยู่ใต้ Linux Foundation · open source (BSD) ต่อยอดจากโค้ด Redis เดิม ผู้ให้บริการหลายเจ้าใช้แทน Redis" },
      { name: "Amazon DynamoDB", url: "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html", detail: "Key-Value + Document", level: "aware", summary: "บริการของ AWS ไม่ต้องดูแล server เอง (serverless) ตอบเร็วระดับมิลลิวินาทีแม้ข้อมูลใหญ่ · มี transaction แต่ไม่มี JOIN" },
      { name: "Cloud Firestore", url: "https://firebase.google.com/docs/firestore/data-model", detail: "Document", level: "aware", summary: "ของ Google/Firebase เก็บเอกสารเป็น collection · แอปมือถือ/เว็บต่อตรงผ่าน SDK และรับข้อมูลใหม่แบบ realtime ได้" },
      { name: "Apache Cassandra", url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/overview.html", detail: "Wide-Column", level: "aware", summary: "กระจายข้อมูลไปหลายเครื่องที่เท่าเทียมกัน (ไม่มีเครื่องหลัก) · ตั้งระดับความถูกต้องได้ทีละคำสั่ง · ภาษา CQL คล้าย SQL แต่ไม่มี JOIN" },
      { name: "Neo4j", url: "https://neo4j.com/docs/getting-started/graph-database/", detail: "Graph", level: "aware", summary: "เก็บเป็น node, relationship และ property แทนตาราง · ภาษา Cypher ซึ่งมาตรฐาน GQL (ISO/IEC 39075) รับแนวคิดส่วนใหญ่ไป" },
    ],
  },
  "db-specialized": {
    title: "ฐานข้อมูลเฉพาะทาง",
    detailLabel: "ประเภท",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "PostgreSQL Full-Text Search", url: "https://www.postgresql.org/docs/current/textsearch-intro.html", detail: "Search (มีในตัว)", level: "know", summary: "ค้นข้อความใน PostgreSQL ได้เลยด้วยชนิด tsvector/tsquery ไม่ต้องตั้งระบบเพิ่ม · จุดเริ่มที่ดีก่อนแยกไปใช้ search engine" },
      { name: "pgvector", url: "https://github.com/pgvector/pgvector", detail: "Vector (extension)", level: "know", summary: "extension ที่ทำให้ PostgreSQL เก็บและค้น vector ได้ ทั้งแบบแม่นยำและแบบประมาณ (index HNSW, IVFFlat) · ข้อมูลอยู่ที่เดียวกับตารางอื่น" },
      { name: "Elasticsearch", url: "https://www.elastic.co/docs/solutions/search/full-text/how-full-text-works", detail: "Search", level: "aware", summary: "search engine แบบกระจายหลายเครื่อง สร้างบน Apache Lucene ใช้ inverted index เก็บเอกสาร JSON · ใช้ค้นสินค้าและค้น log · ค้นด้วย vector ได้ด้วย" },
      { name: "OpenSearch", url: "https://opensearch.org/faq/", detail: "Search", level: "aware", summary: "แยกสายจาก Elasticsearch 7.10.2 เป็น open source (Apache 2.0) ดูแลโดย OpenSearch Software Foundation ใต้ Linux Foundation" },
      { name: "Meilisearch", url: "https://www.meilisearch.com/docs", detail: "Search", level: "aware", summary: "search engine ที่ตั้งง่าย เป็นโปรแกรมเดียวมี REST API · พิมพ์ผิดก็ยังเจอ และแสดงผลทันทีขณะพิมพ์" },
      { name: "Qdrant", url: "https://qdrant.tech/documentation/overview/", detail: "Vector", level: "aware", summary: "vector database แบบ open source เขียนด้วย Rust · แนบข้อมูลประกอบ (payload) แล้วกรองไปพร้อมกับการค้นได้" },
      { name: "Pinecone", url: "https://docs.pinecone.io/guides/get-started/overview", detail: "Vector", level: "aware", summary: "vector database แบบบริการ ไม่ต้องดูแล server เอง · ค้นได้ทั้งตามความหมายและตามคำ และสร้าง vector จากข้อความให้ได้" },
      { name: "TimescaleDB", url: "https://www.tigerdata.com/docs/", detail: "Time-series (extension)", level: "aware", summary: "extension ของ PostgreSQL ไม่ใช่ฐานข้อมูลแยก · แบ่งตารางตามช่วงเวลาให้อัตโนมัติ (hypertable) · พัฒนาโดยบริษัท Tiger Data" },
      { name: "InfluxDB", url: "https://docs.influxdata.com/influxdb3/core/", detail: "Time-series", level: "aware", summary: "ฐานข้อมูล time-series สำหรับข้อมูล sensor และค่าวัดของระบบ · รุ่น 3 เขียนด้วย Rust ตัว Core เป็น open source" },
      { name: "ClickHouse", url: "https://clickhouse.com/docs/intro", detail: "Analytics (columnar)", level: "aware", summary: "ฐานข้อมูลแบบเก็บทีละคอลัมน์ สำหรับวิเคราะห์ข้อมูลจำนวนมาก (OLAP) ตอบในไม่ถึงวินาที · มีทั้งแบบ open source และบริการ cloud" },
    ],
  },
  "dbms-engine": {
    title: "Database Engine (DBMS)",
    detailLabel: "สัญญาอนุญาต",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "PostgreSQL", url: "https://www.postgresql.org/support/versioning/", detail: "PostgreSQL License (ฟรี)", level: "team", summary: "ชุมชนดูแล ไม่มีบริษัทเจ้าของ · รุ่นล่าสุด 18 (19 อยู่ช่วงทดสอบ RC) บทเรียนใช้ 17 ซึ่งได้รับการแก้ไขถึงปี 2029 · เคร่งเรื่องชนิดข้อมูล มี JSONB และ extension เยอะ" },
      { name: "MySQL", url: "https://dev.mysql.com/doc/refman/en/mysql-releases.html", detail: "GPLv2 หรือแบบเสียเงิน", level: "know", summary: "Oracle เป็นเจ้าของ · มีสาย LTS (8.4, 9.7) กับสาย Innovation ที่ออกถี่ รุ่นหลัง 9.7 เปลี่ยนเลขเป็นปี.เดือน เช่น 26.7 · เจอบ่อยใน WordPress และระบบเดิม" },
      { name: "MariaDB", url: "https://mariadb.org/about/", detail: "GPLv2", level: "know", summary: "แยกมาจาก MySQL โดยผู้สร้างคนเดิม มูลนิธิ MariaDB ดูแล · ใช้แทน MySQL ได้เกือบทั้งหมด แต่บางอย่างต่างกัน (เช่น มี RETURNING) · ออกรุ่น LTS ปีละครั้ง" },
      { name: "SQLite", url: "https://www.sqlite.org/whentouse.html", detail: "Public domain", level: "know", summary: "ไม่มี server ทั้งฐานข้อมูลเป็นไฟล์เดียว แอปเปิดอ่านเขียนเอง · เหมาะกับแอปมือถือ แอปบนเครื่อง และงานทดสอบ · ถ้าหลายเครื่องต่อมาเขียนพร้อมกันผ่านเครือข่าย ควรใช้ตัวที่มี server" },
      { name: "Microsoft SQL Server", url: "https://learn.microsoft.com/en-us/sql/sql-server/editions-and-components-of-sql-server-2025", detail: "เสียเงิน (มีรุ่น Express ฟรี)", level: "aware", summary: "ของ Microsoft รุ่นล่าสุด 2025 · เจอบ่อยในองค์กรที่ใช้ .NET/Windows · รุ่น Express ฟรีแต่ใช้ได้ไม่เกิน 4 core และฐานละ 50 GB · จำกัดแถวด้วย TOP แทน LIMIT" },
      { name: "Oracle AI Database", url: "https://docs.oracle.com/en/database/oracle/oracle-database/26/xeinw/licensing-restrictions.html", detail: "เสียเงิน (มีรุ่น Free)", level: "aware", summary: "รุ่นปัจจุบัน 26ai · เจอในธนาคาร ราชการ และองค์กรใหญ่ · รุ่น Free ใช้ได้ 2 core, RAM 2 GB, ข้อมูลไม่เกิน 12 GB" },
    ],
  },
  "dbms-hosting": {
    title: "ที่ที่ฐานข้อมูลรัน",
    detailLabel: "engine ที่ให้",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "Docker (ดูแลเอง)", url: "https://hub.docker.com/_/postgres", detail: "ทุกตัวที่มี image", level: "team", summary: "ฟรี คุมได้ทุกอย่าง แต่ต้องดูแลเองทั้ง backup อัปเดต และความปลอดภัย · ทีมใช้ตอนพัฒนาบนเครื่อง และบนเครื่องเช่า (บทที่ 20)" },
      { name: "Neon", url: "https://neon.com/docs/introduction/plans", detail: "PostgreSQL", level: "team", summary: "Postgres แบบไม่ต้องดูแลเครื่อง หยุดเองเมื่อไม่มีคนใช้ 5 นาที แตก branch ฐานข้อมูลไว้ทดลองได้ · แผนฟรี 1 GB ต่อโปรเจกต์ · อยู่กับ Databricks ตั้งแต่ พ.ค. 2568 · เว็บทดลองของทีมใช้ตัวนี้ (บทที่ 22)" },
      { name: "Supabase", url: "https://supabase.com/docs/guides/platform/billing-on-supabase", detail: "PostgreSQL", level: "know", summary: "ได้ Postgres เต็มตัว พร้อมระบบ login ที่เก็บไฟล์ และหน้าแก้ตารางในเว็บ · แผนฟรี 2 โปรเจกต์ ฐานละ 500 MB และหยุดโปรเจกต์ถ้าแทบไม่มีคนใช้ 7 วัน" },
      { name: "Amazon RDS", url: "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html", detail: "PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, Db2", level: "know", summary: "บริการของ AWS ดูแล backup อัปเดต และสลับเครื่องสำรองให้ · บัญชีใหม่ตั้งแต่ ก.ค. 2568 ได้เครดิตทดลองแทนแบบฟรี 12 เดือนเดิม" },
      { name: "Google Cloud SQL", url: "https://docs.cloud.google.com/sql/docs/introduction", detail: "PostgreSQL, MySQL, SQL Server", level: "aware", summary: "แนวเดียวกับ RDS แต่อยู่บน Google Cloud เหมาะเมื่อระบบอื่นของลูกค้าอยู่บน Google อยู่แล้ว" },
      { name: "PlanetScale", url: "https://planetscale.com/docs/postgres-vs-vitess", detail: "PostgreSQL, MySQL (Vitess)", level: "aware", summary: "เดิมดังเรื่อง MySQL ที่แบ่งข้อมูลไปหลายเครื่องได้ (Vitess) ตอนนี้มี Postgres ด้วย · ไม่มีแผนฟรี ตัวเล็กสุดราว 5 ดอลลาร์/เดือน" },
    ],
  },
  "dbms-client": {
    title: "เครื่องมือต่อฐานข้อมูล (Client)",
    detailLabel: "ใช้กับ",
    checkedAt: "22 ต.ค. 2569",
    tools: [
      { name: "psql", url: "https://www.postgresql.org/docs/current/app-psql.html", detail: "PostgreSQL", level: "team", summary: "พิมพ์คำสั่งใน Terminal ตัวทางการ มากับ Postgres ทุกชุด (ในคอนเทนเนอร์ก็มี) · มีคำสั่งเฉพาะตัวขึ้นต้นด้วย \\ เช่น \\dt, \\d" },
      { name: "pgAdmin 4", url: "https://www.pgadmin.org/download/", detail: "PostgreSQL", level: "team", summary: "GUI ทางการของ Postgres ฟรี · เปิดเป็นแอปบนเครื่อง หรือเปิดเป็นเว็บในคอนเทนเนอร์ก็ได้ · คู่มืองาน STARTER ใช้ตัวนี้" },
      { name: "mysql (CLI)", url: "https://dev.mysql.com/doc/refman/8.4/en/mysql.html", detail: "MySQL", level: "know", summary: "พิมพ์คำสั่งใน Terminal ตัวทางการของ MySQL มากับ server เช่นกัน · ใส่ --default-character-set=utf8mb4 เมื่อพิมพ์ภาษาไทย" },
      { name: "DBeaver Community", url: "https://dbeaver.io/about/", detail: "แทบทุกตัวที่มี JDBC driver", level: "know", summary: "ฟรี open source (Apache 2.0) ตัวเดียวต่อได้ทั้ง Postgres, MySQL, SQLite, SQL Server, Oracle · เหมาะเมื่อต้องทำงานหลายค่าย" },
      { name: "Adminer", url: "https://www.adminer.org/en/", detail: "MySQL, MariaDB, PostgreSQL, SQLite, SQL Server, Oracle", level: "know", summary: "หน้าเว็บจัดการฐานข้อมูลที่เป็นไฟล์ PHP ไฟล์เดียว · บทที่ 2 เปิดเป็นคอนเทนเนอร์คู่กับฐานข้อมูล" },
      { name: "Drizzle Studio", url: "https://orm.drizzle.team/docs/drizzle-kit-studio", detail: "ฐานข้อมูลที่ตั้งไว้ใน drizzle.config.ts", level: "know", summary: "สั่ง drizzle-kit studio แล้วได้หน้าเว็บดู/แก้ข้อมูล โดยใช้การตั้งค่าเดียวกับโปรเจกต์ · มากับ Drizzle ที่ทีมใช้ (บทที่ 8)" },
      { name: "SQL Editor บนเว็บของบริการ (เช่น Neon)", url: "https://neon.com/docs/get-started/query-with-neon-sql-editor", detail: "ฐานข้อมูลของบริการนั้น", level: "know", summary: "พิมพ์ SQL ในเว็บได้ทันที ไม่ต้องติดตั้งอะไร สะดวกตอนดูข้อมูลบนเว็บทดลอง" },
      { name: "TablePlus", url: "https://tableplus.com/pricing", detail: "PostgreSQL, MySQL, SQLite, SQL Server, Redis, MongoDB ฯลฯ", level: "aware", summary: "แอปหน้าตาเรียบ เปิดเร็ว · รุ่นฟรีเปิดได้ครั้งละ 2 แท็บ 2 หน้าต่าง ใช้เต็มที่ต้องซื้อ" },
    ],
  },
  "object-storage": {
    title: "Object Storage (ที่เก็บไฟล์)",
    detailLabel: "คุยด้วย · ที่รัน",
    checkedAt: "23 ต.ค. 2569",
    tools: [
      { name: "RustFS", url: "https://github.com/rustfs/rustfs", detail: "S3 API · รันเอง (Docker)", level: "team", summary: "เขียนด้วย Rust สัญญาอนุญาต Apache 2.0 ตั้งใจให้ง่ายแบบ MinIO · คำสั่ง docker เดียวได้ S3 API ที่ port 9000 และหน้าเว็บที่ 9001 · ล็อกเลขรุ่น (บทที่ 8c ใช้ 1.0.3)" },
      { name: "Amazon S3", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html", detail: "S3 API (ต้นฉบับ) · cloud", level: "know", summary: "ต้นแบบของทั้งกลุ่ม ตัวอื่นเลียนแบบ API ของมัน · bucket ใหม่เป็นแบบส่วนตัวและเปิด Block Public Access ไว้ให้ · คิดเงินตามที่ใช้จริง" },
      { name: "Cloudflare R2", url: "https://developers.cloudflare.com/r2/pricing/", detail: "S3 API · cloud", level: "know", summary: "ไม่คิดค่าส่งข้อมูลออก (egress) · แผนฟรีเดือนละ 10 GB-month, คำขอแบบเขียน 1 ล้าน, แบบอ่าน 10 ล้าน · ไม่มีคำสั่ง bucket policy เปิดสาธารณะผ่านโดเมนใน dashboard" },
      { name: "Vercel Blob", url: "https://vercel.com/docs/vercel-blob", detail: "SDK @vercel/blob · cloud", level: "know", summary: "สะดวกเมื่อเว็บอยู่บน Vercel · เลือก store แบบ public หรือ private ตอนสร้าง (เปลี่ยนทีหลังไม่ได้) · ข้างหลังเก็บบน Amazon S3 และมี CDN ของ Vercel cache ให้ · ไม่ได้คุยด้วย S3 API" },
      { name: "Supabase Storage", url: "https://supabase.com/docs/guides/storage/s3/compatibility", detail: "SDK ของ Supabase + S3 API · cloud", level: "know", summary: "มากับ Supabase (Postgres + login) · คำสั่งไฟล์หลักและ presigned URL ใช้ได้ แต่ยังไม่มีคำสั่งตั้ง CORS และ lifecycle ผ่าน S3 API" },
      { name: "Google Cloud Storage", url: "https://docs.cloud.google.com/storage/docs/interoperability", detail: "XML API ที่เข้ากับ S3 · cloud", level: "aware", summary: "ของ Google Cloud · ใช้เครื่องมือของ S3 ได้ผ่าน XML API คู่กับ HMAC key · เหมาะเมื่อระบบอื่นของลูกค้าอยู่บน Google" },
      { name: "MinIO", url: "https://github.com/minio/minio", detail: "S3 API · รันเอง", level: "aware", summary: "เคยเป็นตัวมาตรฐานของการรัน S3 ในเครื่อง · repo ประกาศหยุดดูแลและถูก archive (อ่านอย่างเดียว) 25 เม.ย. 2569 รุ่นชุมชนแจกเป็น source code เท่านั้น ไม่มีไฟล์พร้อมใช้ (ดูบทที่ 8c)" },
      { name: "Garage", url: "https://garagehq.deuxfleurs.fr/", detail: "S3 API · รันเอง", level: "aware", summary: "ออกแบบให้กระจายหลายที่บนเครื่องธรรมดาหรือเครื่องเก่า ทนเน็ตช้าและเครื่องดับ · ต้องการ RAM ขั้นต่ำ 1 GB" },
      { name: "SeaweedFS", url: "https://github.com/seaweedfs/seaweedfs", detail: "S3 API · รันเอง", level: "aware", summary: "สัญญาอนุญาต Apache 2.0 · เน้นเก็บไฟล์จำนวนมหาศาล มีทั้ง S3 API และระบบไฟล์ · คำสั่ง docker เดียวได้ S3 ที่ port 8333" },
    ],
  },
  "image-cdn": {
    title: "บริการย่อและส่งรูปผ่าน URL (Image CDN)",
    detailLabel: "สั่งย่อรูปด้วย URL หน้าตาแบบ",
    checkedAt: "23 ต.ค. 2569",
    tools: [
      { name: "sharp (ทำเองใน API)", url: "https://sharp.pixelplumbing.com/", detail: "ไม่มี URL ย่อตอนอัปโหลด ได้ไฟล์ตายตัวไม่กี่ขนาด", level: "team", summary: "สิ่งที่บทที่ 8c ทำ: ย่อรูปตอนอัปโหลดแล้วเก็บ -1600 / -400 ไว้ใน storage · ไม่มีค่าบริการต่อรูป แต่อยากได้ขนาดใหม่ต้องเขียนโค้ดและย่อรูปเก่าทั้งหมดใหม่เอง" },
      { name: "Next.js Image / Vercel Image Optimization", url: "https://vercel.com/docs/image-optimization/limits-and-pricing", detail: "/_next/image?url=…&w=640&q=75", level: "know", summary: "ใส่ <Image> ใน Next.js แล้วได้รูปย่อตามขนาดจอ เลือก WebP/AVIF ตาม header Accept ของ browser · รูปจากโดเมนอื่นต้องอนุญาตใน images.remotePatterns · บน Vercel คิดตามจำนวนการแปลงและการอ่านเขียน cache (แผน Hobby มีโควตาฟรีรายเดือน) · รัน next start เองก็ใช้ได้ งานย่อรูปไปกินแรง server ของเรา" },
      { name: "Cloudinary", url: "https://cloudinary.com/documentation/image_transformations", detail: "…/image/upload/c_fill,w_400/f_auto/q_auto/<ชื่อรูป>", level: "know", summary: "อัปโหลดต้นฉบับไปเก็บที่ Cloudinary แล้วสั่งย่อ ครอป เลือกรูปแบบไฟล์ด้วยส่วนของ URL ผลที่ได้ cache บน CDN · แผนฟรีให้ 25 เครดิตต่อเดือน (1 เครดิต = แปลง 1,000 ครั้ง หรือพื้นที่ 1 GB หรือส่งข้อมูล 1 GB)" },
      { name: "Cloudflare Images", url: "https://developers.cloudflare.com/images/pricing/", detail: "/cdn-cgi/image/width=400,format=auto/<ที่อยู่รูป>", level: "know", summary: "ใช้ได้ 2 แบบ: ย่อรูปที่เก็บไว้ที่อื่น (เช่น R2 หรือ server เรา) ผ่านโดเมนที่อยู่บน Cloudflare หรือเก็บรูปไว้ที่ Cloudflare เลย · การแปลงไม่ซ้ำ 5,000 ครั้งแรกต่อเดือนฟรี เกินจากนั้นคิดต่อ 1,000 ครั้ง" },
      { name: "imgix", url: "https://docs.imgix.com/en-US/getting-started/setup/creating-sources", detail: "https://<ชื่อ>.imgix.net/<path>?w=400&auto=format", level: "aware", summary: "ไม่เก็บรูปเอง ไปอ่านจาก bucket ของเรา (S3 และตัวที่เข้ากับ S3) หรือโฟลเดอร์บนเว็บ แล้วย่อตาม query string · คิดเป็นเครดิต มีให้ทดลอง 30 วัน ไม่มีแผนฟรีถาวร" },
      { name: "ImageKit", url: "https://imagekit.io/docs/image-transformation", detail: "https://ik.imagekit.io/<id>/tr:w-400/<path>", level: "aware", summary: "แนวเดียวกับ Cloudinary ต่อกับ storage ภายนอกได้ · เลือกรูปแบบไฟล์ตาม header Accept ให้เอง · มีแผนฟรีที่จำกัดปริมาณส่งข้อมูลต่อเดือน" },
      { name: "Bunny Optimizer", url: "https://bunny.net/pricing/optimizer/", detail: "<ที่อยู่รูปบน Bunny CDN>?width=400", level: "aware", summary: "ส่วนเสริมของ Bunny CDN คิดเงินเหมาต่อเว็บต่อเดือน ไม่จำกัดจำนวนการแปลง" },
    ],
  },
} satisfies Record<string, ToolGroup>;

export type ToolGroupId = keyof typeof toolGroups;
