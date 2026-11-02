"use client";

import { useEffect, useState } from "react";
import { profileApi } from "@/api/profile.api";
import { useSession } from "@/hooks/use-session";
import type { MentorContact } from "@/types";

// พี่เลี้ยงประจำรุ่นของน้องที่ login อยู่ (ใช้บอกว่าคำถามหรืองานที่ส่งไปถึงใคร)
// undefined = ยังโหลดไม่เสร็จ / ไม่ใช่น้อง / โหลดพลาด · [] = ไม่มีรุ่น หรือรุ่นยังไม่มีพี่เลี้ยงประจำ
export function useMyMentors(): MentorContact[] | undefined {
  const { role } = useSession();
  const [mentors, setMentors] = useState<MentorContact[] | undefined>(undefined);
  useEffect(() => {
    if (role !== "intern") return setMentors(undefined);
    profileApi
      .get()
      .then((p) => setMentors(p.cohort?.mentors ?? []))
      .catch(() => setMentors(undefined));
  }, [role]);
  return mentors;
}
