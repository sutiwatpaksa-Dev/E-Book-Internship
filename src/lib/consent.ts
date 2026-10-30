// ความยินยอมคุกกี้: เก็บในเบราว์เซอร์ของผู้ใช้เอง (localStorage) ไม่ส่งไป server
// ประเภท "จำเป็น" เปิดเสมอ ปิดไม่ได้ (ไม่มีมันเข้าสู่ระบบไม่ได้) ส่วนที่เหลือไม่ได้ยินยอม = ไม่โหลด
// ตอนนี้เว็บนี้ยังไม่มีสคริปต์วิเคราะห์หรือการตลาดเลย ถ้าจะเพิ่มในอนาคต ให้โหลดเฉพาะเมื่อ hasConsent("analytics" | "marketing") เป็นจริง
export type ConsentCategory = "analytics" | "marketing";
export type Consent = Record<ConsentCategory, boolean> & { at: string };

export const CONSENT_KEY = "bt-cookie-consent";
export const CONSENT_EVENT = "bt-consent-change";
export const OPEN_SETTINGS_EVENT = "bt-open-cookie-settings";

export function readConsent(): Consent | null {
  try {
    const v = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? "null");
    if (v && typeof v.analytics === "boolean" && typeof v.marketing === "boolean" && typeof v.at === "string") return v;
  } catch {
    // ค่าเสีย = ถือว่ายังไม่เคยเลือก
  }
  return null;
}

export function saveConsent(c: Pick<Consent, ConsentCategory>) {
  const value: Consent = { ...c, at: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {
    // เบราว์เซอร์ปิด storage: ยังใช้ค่าในหน้านี้ต่อได้ แค่จะถามใหม่รอบหน้า
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  return value;
}

export const hasConsent = (c: ConsentCategory) => readConsent()?.[c] === true;
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
