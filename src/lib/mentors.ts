// ชื่อพี่เลี้ยงที่น้องเห็น: ชื่อเล่น > ชื่อจริง > ชื่อบัญชี · เติม "พี่" ข้างหน้าถ้ายังไม่มี
type Named = { username: string; nickname: string | null; fullName: string | null };

export const mentorName = (m: Named) => {
  const name = (m.nickname || m.fullName || m.username).trim();
  return name.startsWith("พี่") ? name : `พี่${name}`;
};

// "พี่เอ" · "พี่เอ และ พี่บี" · "พี่เอ, พี่บี และ พี่ซี" · ไม่มีใคร = null
export function mentorNames(mentors: readonly Named[]): string | null {
  const names = mentors.map(mentorName);
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} และ ${names.at(-1)}`;
}

// บรรทัดบอกน้องว่าเรื่องที่ส่งไปถึงใคร (ตรงกับผู้รับแจ้งเตือนใน server/lib/mentor-recipients.ts)
// undefined = ยังโหลดไม่เสร็จ ยังไม่บอกชื่อ · [] = รุ่นยังไม่มีพี่เลี้ยงประจำหรือยังไม่มีรุ่น = ถึงพี่เลี้ยงทุกคน
export function sendToLine(mentors: readonly Named[] | undefined): string | null {
  if (mentors === undefined) return null;
  return `ส่งถึง${mentorNames(mentors) ? ` ${mentorNames(mentors)}` : "พี่เลี้ยงทุกคน"}`;
}
