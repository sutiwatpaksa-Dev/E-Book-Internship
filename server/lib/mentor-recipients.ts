// ใครได้แจ้งเตือนเรื่องของน้องคนหนึ่ง (คำถาม คำตอบกลับ งานที่ส่ง ความเห็นใต้งาน ขอรีเซ็ตรหัส)
// พี่เลี้ยงประจำรุ่นของน้องคนนั้นก่อน · รุ่นไม่มีพี่เลี้ยงประจำ หรือน้องไม่มีรุ่น = พี่เลี้ยงทุกคน (เรื่องต้องไม่ตกหล่น)
// ไม่แจ้งคนที่ทำเรื่องนั้นเอง
export function mentorRecipients(cohortMentorIds: readonly number[], allMentorIds: readonly number[], exceptUserId?: number): number[] {
  const to = cohortMentorIds.length > 0 ? cohortMentorIds : allMentorIds;
  return [...new Set(to)].filter((id) => id !== exceptUserId);
}
