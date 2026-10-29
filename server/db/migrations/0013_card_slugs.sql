-- เปลี่ยน slug การ์ด 4 ใบให้ตรงกติกา (คำนามหรือ -ing ไม่ใช่คำกริยา) · ย้ายข้อมูลอย่างเดียว ไม่แก้ตาราง
-- read-requirement → reading-requirements · fetch-data → data-fetching · unit-test → unit-testing · deploy-online → vps-deployment
-- URL เดิมมี redirect 308 ใน next.config.mjs · audit_logs ไม่แตะ (เป็นประวัติ ต้องเป็นอย่างที่เกิดจริง)
-- regex มี (?![a-z0-9-]) ต่อท้าย: "/learn/cards/unit-test" ต้องไม่ไปโดน "/learn/cards/unit-testing" หรือ slug อื่นที่ขึ้นต้นเหมือนกัน

-- ความคืบหน้า: (user_id, link) เป็น PK ถ้าน้องมีทั้งลิงก์เก่าและใหม่ เก็บแถวใหม่ไว้แถวเดียว
INSERT INTO "progress" ("user_id", "link", "done_at")
SELECT p."user_id", '/learn/cards/' || m.new, p."done_at"
FROM "progress" p
JOIN (VALUES ('read-requirement', 'reading-requirements'), ('fetch-data', 'data-fetching'), ('unit-test', 'unit-testing'), ('deploy-online', 'vps-deployment')) AS m(old, new)
  ON p."link" = '/learn/cards/' || m.old
ON CONFLICT DO NOTHING;--> statement-breakpoint
DELETE FROM "progress" WHERE "link" IN ('/learn/cards/read-requirement', '/learn/cards/fetch-data', '/learn/cards/unit-test', '/learn/cards/deploy-online');--> statement-breakpoint

-- การ์ดในระบบที่พี่เลี้ยงปรับ (ซ่อน/เปลี่ยนชื่อ): slug เป็น PK · มีของใหม่อยู่แล้วก็ลบของเก่าทิ้ง
UPDATE "card_overrides" o SET "slug" = m.new
FROM (VALUES ('read-requirement', 'reading-requirements'), ('fetch-data', 'data-fetching'), ('unit-test', 'unit-testing'), ('deploy-online', 'vps-deployment')) AS m(old, new)
WHERE o."slug" = m.old AND NOT EXISTS (SELECT 1 FROM "card_overrides" x WHERE x."slug" = m.new);--> statement-breakpoint
DELETE FROM "card_overrides" WHERE "slug" IN ('read-requirement', 'fetch-data', 'unit-test', 'deploy-online');--> statement-breakpoint

-- การ์ดของพี่เลี้ยง: "อ่านก่อน" เก็บเป็น slug ล้วน และลิงก์ในเนื้อหา
UPDATE "mentor_cards" SET "needs" = (
  SELECT array_agg(CASE n WHEN 'read-requirement' THEN 'reading-requirements' WHEN 'fetch-data' THEN 'data-fetching' WHEN 'unit-test' THEN 'unit-testing' WHEN 'deploy-online' THEN 'vps-deployment' ELSE n END ORDER BY i)
  FROM unnest("needs") WITH ORDINALITY AS t(n, i)
) WHERE "needs" && ARRAY['read-requirement', 'fetch-data', 'unit-test', 'deploy-online'];--> statement-breakpoint
UPDATE "mentor_cards" SET "body" =
  regexp_replace(regexp_replace(regexp_replace(regexp_replace("body",
    '/learn/cards/read-requirement(?![a-z0-9-])', '/learn/cards/reading-requirements', 'g'),
    '/learn/cards/fetch-data(?![a-z0-9-])', '/learn/cards/data-fetching', 'g'),
    '/learn/cards/unit-test(?![a-z0-9-])', '/learn/cards/unit-testing', 'g'),
    '/learn/cards/deploy-online(?![a-z0-9-])', '/learn/cards/vps-deployment', 'g')
WHERE "body" ~ '/learn/cards/(read-requirement|fetch-data|unit-test|deploy-online)(?![a-z0-9-])';--> statement-breakpoint

-- โน้ตท้ายหน้า, หน้าที่น้องกดถาม, ลิงก์ในแจ้งเตือน (อาจมี #anchor ต่อท้าย จึงใช้ regex แทนเทียบตรง)
UPDATE "page_notes" SET "page_url" =
  regexp_replace(regexp_replace(regexp_replace(regexp_replace("page_url",
    '^/learn/cards/read-requirement(?![a-z0-9-])', '/learn/cards/reading-requirements'),
    '^/learn/cards/fetch-data(?![a-z0-9-])', '/learn/cards/data-fetching'),
    '^/learn/cards/unit-test(?![a-z0-9-])', '/learn/cards/unit-testing'),
    '^/learn/cards/deploy-online(?![a-z0-9-])', '/learn/cards/vps-deployment')
WHERE "page_url" ~ '^/learn/cards/(read-requirement|fetch-data|unit-test|deploy-online)(?![a-z0-9-])';--> statement-breakpoint
UPDATE "threads" SET "page_url" =
  regexp_replace(regexp_replace(regexp_replace(regexp_replace("page_url",
    '^/learn/cards/read-requirement(?![a-z0-9-])', '/learn/cards/reading-requirements'),
    '^/learn/cards/fetch-data(?![a-z0-9-])', '/learn/cards/data-fetching'),
    '^/learn/cards/unit-test(?![a-z0-9-])', '/learn/cards/unit-testing'),
    '^/learn/cards/deploy-online(?![a-z0-9-])', '/learn/cards/vps-deployment')
WHERE "page_url" ~ '^/learn/cards/(read-requirement|fetch-data|unit-test|deploy-online)(?![a-z0-9-])';--> statement-breakpoint
UPDATE "notifications" SET "link" =
  regexp_replace(regexp_replace(regexp_replace(regexp_replace("link",
    '^/learn/cards/read-requirement(?![a-z0-9-])', '/learn/cards/reading-requirements'),
    '^/learn/cards/fetch-data(?![a-z0-9-])', '/learn/cards/data-fetching'),
    '^/learn/cards/unit-test(?![a-z0-9-])', '/learn/cards/unit-testing'),
    '^/learn/cards/deploy-online(?![a-z0-9-])', '/learn/cards/vps-deployment')
WHERE "link" ~ '^/learn/cards/(read-requirement|fetch-data|unit-test|deploy-online)(?![a-z0-9-])';
