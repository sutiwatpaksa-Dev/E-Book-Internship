"use client";

// ลิงก์ "ข้ามไปเนื้อหา" สำหรับคนใช้คีย์บอร์ด: กด Tab ครั้งแรกจะโผล่ ข้ามแถบเมนูด้านบนไปเนื้อหาเลย
// เนื้อหาของแต่ละ layout มี id ต่างกัน (หน้าคู่มือเป็น #nd-page ของ Fumadocs) จึงหาทีละตัวตอนกด
export function SkipLink() {
  return (
    <a
      href="#main-content"
      onClick={(e) => {
        const target = document.querySelector<HTMLElement>("#main-content, #nd-page, main");
        if (!target) return;
        e.preventDefault();
        target.tabIndex = -1;
        target.focus();
        target.scrollIntoView();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-fd-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-fd-primary-foreground"
    >
      ข้ามไปเนื้อหา
    </a>
  );
}
