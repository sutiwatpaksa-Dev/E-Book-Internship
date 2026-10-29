import { describe, expect, test } from "bun:test";
import { emailProblem, facebookProblem, instagramProblem, lineProblem, phoneProblem } from "./contact";

describe("เบอร์โทร", () => {
  test("เบอร์ไทยที่ถูก", () => {
    for (const v of ["081-234-5678", "0812345678", "02-123-4567", "+66 81 234 5678", "(02) 123 4567"]) expect(phoneProblem(v)).toBeNull();
  });
  test("ยาวเกิน สั้นไป หรือมีตัวอักษร ไม่ผ่าน", () => {
    for (const v of ["34342442342342423242", "12345", "081-234-567x", "เบอร์ที่ทำงาน", "812345678"]) expect(phoneProblem(v)).not.toBeNull();
  });
  test("ว่าง = ไม่กรอก ผ่าน", () => expect(phoneProblem(null)).toBeNull());
});

describe("อีเมล", () => {
  test("อีเมลที่ถูก", () => {
    for (const v of ["somchai@gmail.com", "Sutiwat.P@blicktechconsultant.co.th", "first.last+intern@company.co.th", "a_b-c@sub.mail.example.org"]) expect(emailProblem(v)).toBeNull();
  });
  test("ไม่มี @ ไม่มีโดเมน ภาษาไทย หรือยาวเกิน ไม่ผ่าน", () => {
    for (const v of ["somchai", "somchai@", "somchai@gmail", "@gmail.com", "som chai@gmail.com", "สมชาย@gmail.com", "a@b..com", `${"a".repeat(250)}@x.co`]) expect(emailProblem(v)).not.toBeNull();
  });
  test("ว่าง = ไม่กรอก ผ่าน", () => expect(emailProblem(null)).toBeNull());
});

describe("ช่องทางเสริม", () => {
  test("ภาษาไทยไม่ผ่าน", () => {
    expect(lineProblem("กหกห")).not.toBeNull();
    expect(instagramProblem("กหฟกฟหก")).not.toBeNull();
    expect(facebookProblem("สมชาย ใจดี")).not.toBeNull();
  });
  test("ค่าที่ถูก", () => {
    expect(lineProblem("sutiwat.p")).toBeNull();
    expect(instagramProblem("@sutiwat_p")).toBeNull();
    expect(facebookProblem("https://www.facebook.com/sutiwat.p")).toBeNull();
    expect(facebookProblem("sutiwat.p")).toBeNull();
  });
  test("LINE ID สั้นกว่า 4 ตัวไม่ผ่าน", () => expect(lineProblem("ab")).not.toBeNull());
});
