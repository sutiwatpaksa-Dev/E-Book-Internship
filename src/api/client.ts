// ชั้นเรียก API ของหน้าเว็บ: component ไม่เรียก fetch เอง ต้องผ่านไฟล์ในโฟลเดอร์นี้
// fetch ที่ส่ง cookie ไปด้วย แล้วแปลงข้อผิดพลาดเป็นข้อความจาก API
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "same-origin", ...init });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `ผิดพลาด (${res.status})`);
  return body as T;
}

export const jsonBody = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
