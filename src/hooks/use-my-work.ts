"use client";

import { useEffect, useState } from "react";
import { profileApi } from "@/api/profile.api";
import { submissionsApi } from "@/api/submissions.api";
import { buildPlan, type PlanItem } from "@/lib/work-plan";
import type { MySubmissions, Profile } from "@/types";

export type Cohort = NonNullable<Profile["cohort"]>;
export type Work = { loading: boolean; failed: boolean; cohort: Cohort | null; data: MySubmissions | null; plan: PlanItem[] };

// งานของน้อง: รุ่น (วันเริ่ม) + โจทย์ + งานที่ส่ง รวมเป็นแผนงานตามกำหนดส่ง · ดึงผ่าน src/api ตามกติกาของเว็บ
export function useMyWork(role: string | null): Work {
  const [state, setState] = useState<{ loading: boolean; failed: boolean; cohort: Cohort | null; data: MySubmissions | null }>({ loading: true, failed: false, cohort: null, data: null });
  useEffect(() => {
    if (role !== "intern") return;
    Promise.all([profileApi.get(), submissionsApi.mine()])
      .then(([p, data]) => setState({ loading: false, failed: false, cohort: p.cohort, data }))
      .catch(() => setState({ loading: false, failed: true, cohort: null, data: null }));
  }, [role]);
  const plan = state.data ? buildPlan({ assignments: state.data.assignments, submissions: state.data.items, startsOn: state.cohort?.startsOn ?? null, ended: !!state.cohort?.endedAt }) : [];
  return { ...state, plan };
}

