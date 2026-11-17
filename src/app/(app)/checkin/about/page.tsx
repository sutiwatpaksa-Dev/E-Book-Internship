import type { Metadata } from "next";
import Link from "next/link";
import { requirePageAccess } from "@/lib/require-page-access";

export const metadata: Metadata = { title: "ระบบเช็คอินเก็บอะไร ใครเห็น" };

const box = "rounded-2xl border border-fd-border bg-fd-card p-5";
const link = "font-medium text-fd-primary hover:underline";

// คำอธิบาย 1 หน้าให้น้องอ่านก่อนใช้: เก็บอะไร ใครเห็น ใช้ทำอะไร และไม่ใช้ทำอะไร
// เขียนเฉพาะสิ่งที่ระบบทำจริง ถ้าระบบเปลี่ยน (เช่นเริ่มใช้คิด KPI) ต้องแก้หน้านี้ก่อนปล่อยเสมอ
export default async function AboutPage() {
  await requirePageAccess("/checkin/about");
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <Link href="/checkin" className={`${link} inline-flex min-h-11 items-center self-start text-sm`}>
          ← กลับไปหน้าเช็คอิน
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">ระบบเช็คอินเก็บอะไร ใครเห็น</h1>
        <p className="text-sm text-fd-muted-foreground">อ่านจบใน 1 นาที ถ้าสงสัยอะไรเพิ่ม ถามพี่เลี้ยงได้เลย</p>
      </header>

      <section className={`${box} flex flex-col gap-2`}>
        <h2 className="text-lg font-semibold">เก็บอะไรบ้าง</h2>
        <ul className="list-disc ps-5 text-sm leading-relaxed">
          <li>เวลาที่คุณกดเช็คอินและเช็คเอาต์ ใช้เวลาของระบบเสมอ ไม่ใช่เวลาจากเครื่องของคุณ</li>
          <li>ใบลาและการแจ้งมาสายที่คุณส่ง พร้อมเหตุผลที่คุณเขียน และคำตอบของพี่เลี้ยง</li>
          <li>ถ้าพี่เลี้ยงแก้เวลาให้ จะเก็บเวลาเดิม เวลาใหม่ และเหตุผลที่พี่เลี้ยงเขียนไว้</li>
        </ul>
        <p className="text-sm text-fd-muted-foreground">ระบบเช็คอินไม่เก็บตำแหน่งที่ตั้ง รูปถ่าย หรือข้อมูลอื่นจากเครื่องของคุณ</p>
      </section>

      <section className={`${box} flex flex-col gap-2`}>
        <h2 className="text-lg font-semibold">ใครเห็นข้อมูลนี้</h2>
        <ul className="list-disc ps-5 text-sm leading-relaxed">
          <li>
            <strong>คุณเห็นของตัวเองทั้งหมด</strong> ที่{" "}
            <Link href="/checkin/history" className={link}>
              ประวัติเข้างานของฉัน
            </Link>{" "}
            รวมวันที่พี่เลี้ยงแก้เวลาและเหตุผล
          </li>
          <li>
            <strong>พี่เลี้ยงเห็นของทั้งรุ่น</strong> (บัญชีพี่เลี้ยงทุกคนในระบบเปิดดูได้ทุกรุ่น) และดาวน์โหลดเป็นไฟล์ CSV ได้ ทุกครั้งที่ดาวน์โหลด แก้เวลา หรือตัดสินใบลา ระบบจดไว้ในบันทึกการกระทำ
          </li>
          <li>น้องคนอื่นในรุ่นไม่เห็นข้อมูลของคุณ และไม่มีหน้าเทียบน้องกันเอง</li>
        </ul>
      </section>

      <section className={`${box} flex flex-col gap-2`}>
        <h2 className="text-lg font-semibold">ใช้ทำอะไร</h2>
        <ul className="list-disc ps-5 text-sm leading-relaxed">
          <li>ให้คุณและพี่เลี้ยงเห็นตรงกันว่าวันไหนมาทำงานเมื่อไร ทำกี่ชั่วโมง วันไหนลาหรือหยุด</li>
          <li>
            <strong>ตอนนี้ยังไม่ได้ใช้คิดคะแนนหรือตัดสินผลฝึกงาน</strong> ถ้าจะนำไปใช้คิด KPI จะบอกให้ทราบก่อนเริ่มนับ และไม่นับย้อนหลังไปก่อนวันที่ประกาศ
          </li>
        </ul>
      </section>

      <section className={`${box} flex flex-col gap-2`}>
        <h2 className="text-lg font-semibold">กติกาที่ควรรู้</h2>
        <ul className="list-disc ps-5 text-sm leading-relaxed">
          <li>เวลาเริ่ม-เลิกงานและเวลาผ่อนผันสายของรุ่น แสดงอยู่ที่หน้าเช็คอิน ถ้าพี่เลี้ยงเปลี่ยน จะบอกล่วงหน้า และมีผลตั้งแต่วันถัดไปเท่านั้น วันที่ผ่านมาแล้วไม่เปลี่ยน</li>
          <li>เสาร์-อาทิตย์และวันหยุดที่พี่เลี้ยงประกาศ ไม่นับว่าไม่มีเช็คอิน</li>
          <li>ลืมเช็คเอาต์: ระบบนับเวลาเลิกงานให้ และติดป้าย "ระบบนับให้" ให้เห็นชัดว่าไม่ได้กดเอง</li>
          <li>เน็ตหลุด หรือลืมเช็คอิน: บอกพี่เลี้ยง พี่เลี้ยงแก้เวลาให้ได้ โดยต้องเขียนเหตุผลทุกครั้งและคุณเห็นเหตุผลนั้น</li>
          <li>
            ลา/แจ้งมาสาย: ส่งที่{" "}
            <Link href="/checkin/leave" className={link}>
              หน้าส่งใบลา
            </Link>{" "}
            เฉพาะใบที่พี่เลี้ยงอนุมัติแล้วมีผล
          </li>
        </ul>
      </section>
    </div>
  );
}
