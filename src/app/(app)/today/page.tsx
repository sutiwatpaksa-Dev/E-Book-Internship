import type { Metadata } from "next";
import { Today } from "@/components/today";

export const metadata: Metadata = { title: "วันนี้" };

export default function TodayPage() {
  return <Today />;
}
