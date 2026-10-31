"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { toast } from "@/hooks/use-toast";

// แถบบอกว่าเน็ตหลุด ติดบนสุดของจอทุกหน้า หายเองเมื่อเน็ตกลับมา (พร้อมแจ้งสั้นๆ ว่ากลับมาแล้ว)
// navigator.onLine บอกได้แค่ "ต่อวงอยู่ไหม" ไม่รู้ว่าออกเน็ตได้จริงไหม จึงไม่ใช้ปิดปุ่ม ส่งไม่ผ่านจะมีข้อความแดงบอกเอง
const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

export function OfflineBanner() {
  // ฝั่ง server ถือว่าออนไลน์ ไม่ให้ HTML ไม่ตรงกับฝั่ง browser
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) wasOffline.current = true;
    else if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("กลับมาออนไลน์แล้ว");
    }
  }, [online]);

  if (online) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-[90] flex items-center justify-center gap-2 bg-fd-foreground px-4 py-2 text-center text-sm font-medium text-fd-background"
    >
      <WifiOff aria-hidden className="size-4 shrink-0" />
      ออฟไลน์อยู่ ข้อมูลที่เห็นอาจไม่ใช่ล่าสุด และยังส่งข้อความหรือส่งงานไม่ได้
    </div>
  );
}
