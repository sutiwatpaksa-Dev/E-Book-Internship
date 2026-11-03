// รูปแบบวันที่เดียวทั้งเว็บ: "3 พ.ย. 2569 14:05" (มีเวลา) / "3 พ.ย. 2569" (วันอย่างเดียว) · เวลาไทยเสมอ ไม่ขึ้นกับเครื่องคนดู
// ใช้แทน toLocaleString("th-TH") ตรงๆ ที่เคยได้ 27/10/69, 21/10/2569 14:05:00 และ 3 พ.ย. 2569 ปนกันในแอปเดียว
const TZ = "Asia/Bangkok";

export const thDateTime = (iso: string | Date) => new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: TZ });
export const thDateOnly = (iso: string | Date) => new Date(iso).toLocaleDateString("th-TH", { dateStyle: "medium", timeZone: TZ });
