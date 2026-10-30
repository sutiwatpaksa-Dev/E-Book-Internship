---
name: skill-finder
description: หาว่างานนี้ควรใช้ skill ไหน หรือยังไม่มี skill ที่ตรงแล้วควรสร้างใหม่ไหม ใช้เมื่อผู้ใช้ถาม "มี skill อะไรบ้าง", "ใช้ skill ไหนดี", "skill-finder", หรือเมื่อเริ่มงานที่ไม่แน่ใจว่ามีขั้นตอนของโปรเจกต์กำหนดไว้แล้ว
---

# หา skill ที่ใช่

## 1. ดูว่ามีอะไรอยู่แล้ว

```bash
ls .claude/skills/ .claude/agents/ ~/.claude/skills/ 2>/dev/null
grep -h "^description:" .claude/skills/*/SKILL.md
```

skill ของโปรเจกต์นี้ (`.claude/skills/`):

| skill | ใช้เมื่อ |
|---|---|
| `ux-ui-design` | ออกแบบหรือรีวิวหน้าจอ, mock-up, น้องหาของไม่เจอ |
| `planner` | ร่างแผน/เอกสารก่อนลงมือ, ตรวจแผน |
| `sweep` | กวาดหาจุดพังทั้งเว็บ: ลิงก์, โค้ดตัวอย่าง, คำสั่ง Windows, MDX |
| `qna` | ตอบคำถามหรือคำขอเนื้อหาของน้องฝึกงาน |
| `maintainer` | ออกเวอร์ชัน, changelog, Handoff, กติกาดูแล repo |
| `deploy-vercel` | push ขึ้น dev/main, build บน Vercel ล้ม, migrate ล้ม |
| `websockets` | ฟีเจอร์ realtime (แชท, แจ้งเตือน) หรือเนื้อหาสอนเรื่อง WebSocket/SSE/polling |
| `card-writer` | เขียน/แก้การ์ดความรู้, แปลงบทเดิมเป็นการ์ด, ตรวจว่าคนไม่มีพื้นฐานอ่านเข้าใจ |
| `form-validation` | เพิ่ม/แก้ช่องกรอก, กฎ validation ที่ใช้ร่วมกันทั้งฟอร์มและ server |

agent ของโปรเจกต์ (`.claude/agents/`, เรียกด้วย Agent tool ไม่ใช่ Skill tool):

| agent | ใช้เมื่อ |
|---|---|
| `card-reader` | อ่านการ์ดแบบน้องฝึกงานเพื่อหาจุดที่ต่อกันไม่ได้ (ถูกเรียกจาก `card-writer` และ `sweep`) |

นอกจากนี้ยังมี skill ทั่วไปในรายการ skill ของ session ด้วย เช่น `code-review`, `security-review`, `simplify`, `run`, `anthropic-skills:skill-creator`

## 2. เลือก

- อ่านคำขอแล้วจับคู่กับคอลัมน์ "ใช้เมื่อ" ถ้าตรงกันหลายตัว ให้ใช้ตามลำดับงาน เช่น `planner` → `ux-ui-design` → `maintainer` → `deploy-vercel`
- บอกผู้ใช้สั้นๆ ว่าจะใช้ตัวไหนเพราะอะไร แล้วเรียกด้วย Skill tool

## 3. ไม่มีตัวที่ตรง

ถ้างานแบบเดียวกันเกิดซ้ำตั้งแต่ 2 ครั้งขึ้นไป ให้เสนอสร้าง skill ใหม่:

1. สร้าง `.claude/skills/<ชื่อ-kebab>/SKILL.md` ที่มี frontmatter `name` และ `description` (description ต้องบอกว่าใช้เมื่อไหร่ และมีคำที่ผู้ใช้น่าจะพิมพ์)
2. เนื้อหาเขียนเป็นขั้นตอนที่ทำตามได้ ชี้ไฟล์จริงใน repo และใส่กติกาความปลอดภัยที่เกี่ยวข้อง
3. ห้ามใส่ค่าลับ (repo นี้เปิดสาธารณะ)
4. เพิ่มแถวในตารางข้างบน
5. ถ้าอยากวัดผลหรือปรับ description ให้ trigger แม่นขึ้น ใช้ `anthropic-skills:skill-creator`
