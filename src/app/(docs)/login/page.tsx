import type { Metadata } from "next";
import Link from "next/link";
import { DocsBody, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default function LoginPage() {
  return (
    <DocsPage>
      <DocsTitle>🔑 เข้าสู่ระบบ</DocsTitle>
      <DocsBody>
        <p>
          ส่วน <strong>Mini Project STARTER</strong> และเอกสาร Requirement เปิดให้เฉพาะน้องฝึกงานและพี่เลี้ยงของบริษัท
          <br />
          ใช้ username และ PIN ที่พี่เลี้ยงให้ไว้ ยังไม่มีบัญชีหรือลืม PIN ให้ติดต่อพี่เลี้ยง
        </p>
        <LoginForm />
        <blockquote>
          <p>
            🔒 <strong>ทำไมต้อง login:</strong> เอกสาร Requirement เป็นโจทย์ที่บริษัทใช้กับลูกค้าจริง จึงไม่เปิดให้คนนอกอ่าน
            ส่วนเนื้อหาบทเรียนทั่วไปยังอ่านได้ทุกคนโดยไม่ต้อง login
            <br />
            ระบบหน้านี้สร้างจากเรื่องเดียวกับที่สอนใน <Link href="/15-auth">บทที่ 15</Link>: เก็บ PIN แบบ hash, cookie แบบ
            httpOnly และตรวจสิทธิ์ฝั่ง server
          </p>
        </blockquote>
      </DocsBody>
    </DocsPage>
  );
}
