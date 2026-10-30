// ลิงก์ในหลังบ้าน (ตรงกับ viewHref ใน admin-panel.tsx) · ใช้เป็น href จริงของลิงก์ในตาราง
// เปิดแท็บใหม่ได้ (Ctrl/⌘-คลิก) และคัดลอกลิงก์ส่งให้พี่เลี้ยงอีกคนได้
export const internHref = (id: number) => `/dev/admin?tab=overview&intern=${id}`;
export const cohortHref = (id: number) => `/dev/admin?tab=cohorts&cohort=${id}`;
