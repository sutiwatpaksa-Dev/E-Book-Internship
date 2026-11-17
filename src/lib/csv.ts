// สร้างไฟล์ CSV ที่เปิดใน Excel ได้ (มี BOM ให้อ่านภาษาไทยถูก)
// ค่าที่ขึ้นต้นด้วย = + - @ หรือ tab/ขึ้นบรรทัด Excel จะเอาไปคิดเป็นสูตร (ชื่อที่ผู้ใช้กรอกเองมีให้ใส่ได้) จึงนำหน้าด้วย ' ให้เป็นข้อความธรรมดา
const FORMULA = /^[=+\-@\t\r]/;

export function csvCell(v: string | number | boolean | null | undefined): string {
  let t = v === null || v === undefined ? "" : String(v);
  if (typeof v === "string" && FORMULA.test(t)) t = `'${t}`;
  return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

export const toCsv = (rows: (string | number | boolean | null | undefined)[][]) => "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
