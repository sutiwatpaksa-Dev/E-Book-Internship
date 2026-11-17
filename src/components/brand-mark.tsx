import Image from "next/image";

// โลโก้บริษัท มีไฟล์แยกสำหรับโหมดมืด (สลับด้วย CSS ไม่ต้องรอ JavaScript)
// ไฟล์จริง 94×96 ไม่ใช่สี่เหลี่ยมจัตุรัส จึงล็อกกล่องเป็น size×size แล้วใช้ object-contain
// ถ้าไม่ล็อก preflight ของ Tailwind (height: auto) จะยืดความสูง และ next/image เตือน
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <>
      <Image src="/brand/mark.png" alt="" width={size} height={size} className="shrink-0 object-contain dark:hidden" style={{ width: size, height: size }} />
      <Image src="/brand/mark-dark.png" alt="" width={size} height={size} className="hidden shrink-0 object-contain dark:block" style={{ width: size, height: size }} />
    </>
  );
}
