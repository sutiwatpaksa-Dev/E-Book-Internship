-- ย้ายคำถามแบบเดิม (ถาม 1 ครั้ง ตอบ 1 ครั้ง) เข้าระบบแชท แล้วค่อยลบตารางเก่า ข้อมูลจึงไม่หาย
-- ใช้ id เดิมเป็น id ของเรื่อง ข้อความจะผูกกลับได้ตรงตัว
INSERT INTO "threads" ("id", "created_by", "kind", "subject", "page_url", "status", "last_message_at", "last_author_role", "intern_read_at", "dev_read_at", "created_at")
SELECT q."id", q."asked_by", 'question', left(split_part(q."body", E'\n', 1), 80), q."page_url",
       CASE WHEN q."answer" IS NULL THEN 'waiting' ELSE 'answered' END,
       coalesce(q."answered_at", q."created_at"),
       CASE WHEN q."answer" IS NULL THEN 'intern' ELSE 'dev' END,
       q."created_at", q."answered_at", q."created_at"
FROM "questions" q;--> statement-breakpoint
INSERT INTO "thread_messages" ("thread_id", "author_id", "body", "created_at")
SELECT q."id", q."asked_by", q."body", q."created_at" FROM "questions" q;--> statement-breakpoint
INSERT INTO "thread_messages" ("thread_id", "author_id", "body", "created_at")
SELECT q."id", q."answered_by", q."answer", q."answered_at" FROM "questions" q WHERE q."answer" IS NOT NULL AND q."answered_by" IS NOT NULL;--> statement-breakpoint
-- ตั้งตัวนับ id ต่อจากเลขที่ย้ายมา ไม่งั้นเรื่องใหม่จะได้ id ซ้ำกับของเดิม
SELECT setval(pg_get_serial_sequence('threads', 'id'), coalesce((SELECT max("id") FROM "threads"), 0) + 1, false);--> statement-breakpoint
DROP TABLE "questions" CASCADE;
