// ชั้นเรียก API ของหน้าเว็บ: component ไม่เรียก fetch เอง ต้องผ่านไฟล์ในโฟลเดอร์นี้
// fetch ที่ส่ง cookie ไปด้วย แล้วแปลงข้อผิดพลาดเป็นข้อความจาก API

// message = ข้อความภาษาไทยจาก API (แสดงได้เลย) · status ไว้ให้หน้าเว็บเลือกทำต่อ เช่น 401 = พาไป login
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // เน็ตหลุด/เปลี่ยนวง fetch จะโยน TypeError ภาษาอังกฤษของเบราว์เซอร์ แปลงเป็นข้อความไทย (status 0 = ถึงเซิร์ฟเวอร์ไม่ได้)
  const res = await fetch(`/api${path}`, { credentials: "same-origin", ...init }).catch(() => {
    throw new ApiError("เชื่อมต่ออินเทอร์เน็ตไม่ได้ ตรวจเน็ตแล้วลองใหม่อีกครั้ง", 0);
  });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  // ยังถือ PIN ชั่วคราว (เช่นเปิดแท็บค้างไว้): ทุกคำขอพาไปตั้งรหัสผ่าน ไม่ต้องให้แต่ละหน้าจัดการเอง
  if (body?.code === "MUST_SET_PASSWORD" && location.pathname !== "/set-password") location.assign(`/set-password?next=${encodeURIComponent(location.pathname)}`);
  if (!res.ok) throw new ApiError(body?.error ?? `ผิดพลาด (${res.status})`, res.status);
  return body as T;
}

export const jsonBody = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
