"use client";

import { useEffect, useState } from "react";
import { questionsApi } from "@/api/questions.api";
import type { Question } from "@/types";
import { useSession } from "./use-session";

// คำถามของน้องคนที่ login อยู่ (server เลือกให้จากบัตรผ่าน หน้าเว็บขอของคนอื่นไม่ได้)
export function useMyQuestions() {
  const { role } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!role) return;
    questionsApi
      .mine()
      .then(setQuestions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [role]);

  return {
    loggedIn: !!role,
    questions,
    loading,
    error,
    // คืน true เมื่อส่งสำเร็จ ให้ฟอร์มรู้ว่าล้างช่องเขียนได้
    async ask(pageUrl: string, body: string) {
      setError("");
      try {
        const q = await questionsApi.ask(pageUrl, body);
        setQuestions((qs) => [q, ...qs]);
        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      }
    },
  };
}
