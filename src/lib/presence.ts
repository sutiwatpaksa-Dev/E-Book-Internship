// ออนไลน์ = หน้าเว็บส่งสัญญาณมาไม่เกิน 3 นาทีก่อน (หน้าเว็บส่งทุก 1 นาทีตอนเปิดแท็บอยู่)
export const ONLINE_WINDOW_MS = 3 * 60 * 1000;
export const PING_EVERY_MS = 60 * 1000;

export const isOnline = (lastSeenAt: string | null, now = Date.now()) => !!lastSeenAt && now - new Date(lastSeenAt).getTime() <= ONLINE_WINDOW_MS;

// "ออนไลน์" หรือ "เห็นล่าสุด 20 นาทีก่อน" · ไม่เคยเห็น = null
export function presenceLabel(lastSeenAt: string | null, now = Date.now()): string | null {
  if (!lastSeenAt) return null;
  if (isOnline(lastSeenAt, now)) return "ออนไลน์";
  const min = Math.floor((now - new Date(lastSeenAt).getTime()) / 60000);
  if (min < 60) return `เห็นล่าสุด ${min} นาทีก่อน`;
  const h = Math.floor(min / 60);
  return h < 24 ? `เห็นล่าสุด ${h} ชม.ก่อน` : `เห็นล่าสุด ${Math.floor(h / 24)} วันก่อน`;
}
