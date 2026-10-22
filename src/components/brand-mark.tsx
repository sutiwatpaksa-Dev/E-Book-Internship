import Image from "next/image";

// โลโก้บริษัท มีไฟล์แยกสำหรับโหมดมืด (สลับด้วย CSS ไม่ต้องรอ JavaScript)
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <>
      <Image src="/brand/mark.png" alt="" width={size} height={size} className="shrink-0 dark:hidden" />
      <Image src="/brand/mark-dark.png" alt="" width={size} height={size} className="hidden shrink-0 dark:block" />
    </>
  );
}
