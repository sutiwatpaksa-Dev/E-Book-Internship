# บทที่ 21: ให้เครื่องตรวจงานและขึ้นระบบให้อัตโนมัติ (CI/CD) 🤖🚚

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 1 และ 20 · 🛠 ใช้: GitHub Actions (หรือ GitLab CI), SSH, `bun test`

> **⚡ สรุป 30 วินาที**
> - **CI** = ทุกครั้งที่ส่งงานขึ้น Git จะมีเครื่องกลางตรวจให้: ชนิดข้อมูลถูกไหม, ทดสอบผ่านไหม, แพ็กเว็บได้ไหม
> - **CD** = รวมงานเข้า `main` เมื่อไหร่ เครื่องกลางขึ้นระบบจริงให้เอง ด้วยขั้นตอนเดียวกับบทที่ 20
> - ค่าลับ (กุญแจ, IP) เก็บในช่อง **Secrets** ของ GitHub/GitLab ไม่ใส่ในโค้ด
> - ตั้งกติกาว่า **รวมงานเข้า `main` ได้เฉพาะงานที่ตรวจผ่านแล้วเท่านั้น**

> **📖 คำใหม่ในบทนี้**
> [CI / CD](./glossary.md#ci-cd) · [Pipeline](./glossary.md#pipeline) · [Secret](./glossary.md#secret) · [PR / MR](./glossary.md#pr) · [Health check](./glossary.md#health-check) · [SSH key](./glossary.md#ssh-key)

---

## 📖 เรื่องเล่า

ศุกร์ 5 โมงเย็น บิตแก้ข้อความหน้าแรกนิดเดียว แล้วเข้าเครื่องเช่าไปอัปเดตเองตามบทที่ 20
แต่ลืมสั่งอัปเดตตาราง... เว็บ error ทั้งคืน 😵 วันจันทร์ลูกค้าโทรมา

พี่ไบต์: *"ขั้นตอนที่ต้องทำเหมือนเดิมทุกครั้ง ให้เครื่องทำ คนลืมได้ เครื่องไม่ลืม"*

---

## 1. สายพานที่เราจะสร้าง

ก่อนลงรายละเอียด ดูภาพรวมก่อนว่า CI กับ CD ต่างกันตรงไหน

![CI ตรวจงานอัตโนมัติ ถ้าผ่านค่อย CD ขึ้นระบบจริง ถ้าไม่ผ่านหยุดและแจ้งสีแดง](/img/21-ci-vs-cd.svg)
*CI = ตรวจ, CD = ขึ้นระบบ เครื่องกลางทำให้ทุกครั้ง ถ้าตรวจไม่ผ่านจะไม่มีการขึ้นระบบ*

สายพานที่เราจะสร้างมี 2 เส้นทาง คือเปิด PR (ตรวจอย่างเดียว) กับรวมเข้า `main` (ตรวจ + ขึ้นระบบ)

![สายพาน CI/CD สองเส้นทาง: PR ตรวจอย่างเดียว, main ตรวจแล้วขึ้นระบบ รออนุมัติ และเช็คเว็บ](/img/21-pipeline-lanes.svg)
*เส้นทาง A (PR) จบที่ตรวจงาน เส้นทาง B (main) ตรวจแล้วรอคนอนุมัติ ขึ้นระบบ และเช็คเว็บ*

---

## 2. 🔧 โค้ดทดสอบ: ต้องมีก่อนให้เครื่องขึ้นระบบแทนเรา

ถ้าไม่มีโค้ดทดสอบ เครื่องกลางก็ตรวจได้แค่ว่า "เขียนถูกไวยากรณ์" เริ่มจากข้อที่สำคัญที่สุดของงาน STARTER: **API หลังบ้านทุกตัว ถ้าไม่ login ต้องได้ 401**

`server/src/admin.test.ts`

```ts
import { expect, test } from "bun:test";
import server from "./index";

// ทุก endpoint หลังบ้าน: ไม่มี cookie ต้องได้ 401 เสมอ (ข้อที่ทำให้ไม่ผ่านทันทีถ้าพลาด)
const adminEndpoints = [
  ["GET", "/api/admin/me"],
  ["GET", "/api/admin/dashboard"],
  ["PATCH", "/api/admin/messages/1"],
  ["DELETE", "/api/admin/categories/1"],
] as const;

for (const [method, path] of adminEndpoints) {
  test(`${method} ${path} ไม่ login → 401`, async () => {
    const res = await server.fetch(new Request(`http://localhost${path}`, { method }));
    expect(res.status).toBe(401);
  });
}

test("token ปลอม → 401", async () => {
  const res = await server.fetch(
    new Request("http://localhost/api/admin/me", { headers: { Cookie: "session=forged.token.value" } }),
  );
  expect(res.status).toBe(401);
});
```

```bash
cd server
bun test
```
👀 โค้ดทดสอบชุดนี้ **ไม่ต้องมีฐานข้อมูล** เพราะด่านตรวจ login ตอบ 401 กลับไปก่อนจะถึงโค้ดที่ใช้ฐานข้อมูล จึงรันบนเครื่องกลางได้ง่าย
🤓 `bun test` ตั้งค่า `NODE_ENV=test` ให้เอง นี่คือเหตุผลที่ไฟล์ `env.ts` ในบทที่ 14 ต้องยอมรับค่า `"test"` (ตอนเขียนคู่มือ เรื่องนี้ทำให้ทดสอบพังจริงมาแล้ว)
💡 เพิ่ม API หลังบ้านใหม่เมื่อไหร่ **เพิ่มบรรทัดในรายการนี้ทุกครั้ง** (และเขียนกติกานี้ไว้ใน `CLAUDE.md` ด้วย)

---

## 3. 🔧 ไฟล์คำสั่งขึ้นระบบ (ใช้ทั้งตอนทำเองและตอนเครื่องทำ)

`deploy/deploy.sh`

```bash
#!/usr/bin/env bash
# รันบน server ในโฟลเดอร์ repo หลัง git อัปเดตโค้ดแล้ว
set -euo pipefail                      # คำสั่งไหนพัง หยุดทันที ไม่ทำต่อแบบครึ่งๆ กลางๆ
cd "$(dirname "$0")/.."

DC="docker compose -f compose.prod.yaml"

$DC build
$DC run --rm server bun run db:migrate
$DC up -d
docker image prune -f
echo "✅ deploy $(git rev-parse --short HEAD) เสร็จ"
```

![ลำดับ 4 ขั้นใน deploy.sh: build, db:migrate, up, prune และหยุดทันทีเมื่อขั้นไหนพัง](/img/21-deploy-script.svg)
*เรียงลำดับสำคัญ: อัปเดตตารางก่อนเปิดโค้ดใหม่ และถ้าขั้นไหนพังต้องหยุดทันที*

```bash
chmod +x deploy/deploy.sh
git add deploy/deploy.sh && git commit -m "chore: add deploy script"
```
> 🤓 **ทำไมไม่ใส่คำสั่งดึงโค้ด (`git pull`) ไว้ในไฟล์นี้?** ระหว่างที่ไฟล์นี้กำลังทำงาน ถ้ามันไปดึงโค้ดใหม่ที่แก้ตัวมันเองด้วย ผลลัพธ์อาจเพี้ยน จึงดึงโค้ด **ก่อน** แล้วค่อยเรียกไฟล์นี้

---

## 4. 🔧 กุญแจสำหรับเครื่องกลาง

เครื่องกลางต้องเข้าเครื่องเช่าได้ ให้สร้าง **กุญแจคู่ใหม่สำหรับเครื่องกลางโดยเฉพาะ** (ไม่ใช้กุญแจส่วนตัวของเรา ถ้ากุญแจนี้หลุด จะได้ยกเลิกได้โดยไม่กระทบใคร)

```bash
# ในเครื่องเรา
ssh-keygen -t ed25519 -f ./ci_deploy_key -N "" -C "github-actions"
ssh-copy-id -i ./ci_deploy_key.pub bitcafe       # ติด public key ให้ user deploy บน server
ssh-keyscan -t ed25519 203.0.113.10              # ลายนิ้วมือ server สำหรับ known_hosts
```
เก็บค่าที่ **GitHub → โปรเจกต์ → Settings → Secrets and variables → Actions**
| ชนิด | ชื่อ | ใส่อะไร |
|---|---|---|
| Secret (ค่าลับ) | `SSH_HOST` | IP ของเครื่องเช่า เช่น `203.0.113.10` |
| Secret | `SSH_USER` | `deploy` |
| Secret | `SSH_KEY` | ข้อความทั้งหมดในไฟล์ `ci_deploy_key` (ดอกที่เก็บไว้ ไม่ใช่ `.pub`) |
| Secret | `SSH_KNOWN_HOSTS` | ผลจากคำสั่ง `ssh-keyscan` (ไว้ยืนยันว่าเข้าเครื่องจริง ไม่ใช่เครื่องปลอม) |
| Variable (ค่าธรรมดา) | `DOMAIN` | `example.com` |

![ค่าลับเก็บใน Secrets ของ GitHub ส่งให้เครื่องกลางเป็นตัวแปรตอนรัน ไม่อยู่ในโค้ด](/img/21-secrets-flow.svg)
*ค่าลับไหลจาก Secrets ไปหาเครื่องกลางตอนงานรันเท่านั้น ไม่เคยอยู่ใน Git*

แล้ว **ลบไฟล์กุญแจในเครื่องเราทิ้ง** (`rm ci_deploy_key*`) เก็บไว้ใน GitHub ที่เดียวพอ

> ⚠️ ห้ามสั่งพิมพ์ค่าลับออกมาดู GitHub จะปิดบังค่าลับในบันทึกให้ แต่ถ้าเราแปลงรูปแบบก่อนพิมพ์ จะปิดไม่ได้

---

## 5. 🔧 ไฟล์สั่งงาน GitHub Actions

`.github/workflows/ci-cd.yml`

ก่อนอ่านไฟล์เต็ม ดูโครงของมันก่อน ไฟล์นี้อ่านเป็น 3 ชั้นคือ `on` (เมื่อไหร่) → `jobs` (งานอะไร) → `steps` (ทำอะไรตามลำดับ)

![โครงสร้างไฟล์ ci-cd.yml แบ่งเป็น on, jobs และ steps โดย deploy ต้องรอ check](/img/21-workflow-anatomy.svg)
*โครงของไฟล์ (ตัดรายละเอียดออก) อ่านจากบนลงล่างตามสี*

```yaml
name: CI/CD

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}   # PR ใหม่ยกเลิกรอบเก่า แต่ deploy ห้ามถูกตัดกลางทาง

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2

      - name: Server — install, typecheck, test
        working-directory: server
        env:
          DATABASE_URL: postgres://ci@127.0.0.1:1/none     # ค่าหลอก: test ชุดนี้ไม่ต่อ DB จริง
          JWT_SECRET: ci-only-secret-ci-only-secret-ci-only
        run: |
          bun install --frozen-lockfile
          bun run typecheck
          bun test

      - name: Client — install, build
        working-directory: client
        run: |
          bun install --frozen-lockfile
          bun run build

  deploy:
    needs: check
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy via SSH
        env:
          SSH_KEY: ${{ secrets.SSH_KEY }}
          SSH_KNOWN_HOSTS: ${{ secrets.SSH_KNOWN_HOSTS }}
          TARGET: ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}
        run: |
          install -m 700 -d ~/.ssh
          echo "$SSH_KEY" > ~/.ssh/id_ed25519 && chmod 600 ~/.ssh/id_ed25519
          echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
          ssh "$TARGET" 'cd ~/bit-cafe && git fetch origin main && git reset --hard origin/main && ./deploy/deploy.sh'

      - name: Health check
        run: curl -fsS --retry 10 --retry-delay 5 --retry-all-errors "https://${{ vars.DOMAIN }}/api/health"
```
**อ่านทีละส่วน**
| ในไฟล์ | แปลว่า |
|---|---|
| `on: pull_request` / `push: main` | เปิดคำขอรวมงาน = ตรวจอย่างเดียว / รวมเข้า `main` = ตรวจ + ขึ้นระบบ |
| `needs: check` | ขึ้นระบบได้ก็ต่อเมื่อตรวจผ่านแล้ว |
| `environment: production` | ตั้งให้ต้องมีคนกดอนุมัติก่อนขึ้นระบบได้ (ข้อ 6) |
| `git reset --hard origin/main` | ทำให้โค้ดบนเครื่องเช่าตรงกับ `main` ทุกตัวอักษร (ถ้ามีคนแอบแก้ไฟล์บนเครื่องเช่า จะถูกทับ ซึ่งดีแล้ว เพราะไม่ควรมีใครแก้ตรงนั้น) |
| `known_hosts` | ยืนยันว่ากำลังเข้าเครื่องเช่าตัวจริง |
| Health check | ขึ้นระบบเสร็จแล้วลองเปิดเว็บจริง ถ้าไม่ตอบ งานนี้ขึ้นสีแดง เรารู้ทันที |

เมื่อรวมงานเข้า `main` งาน `deploy` ทำตามลำดับนี้

![ลำดับตอนขึ้นระบบ: เครื่องกลาง SSH เข้าเครื่องเช่า ดึงโค้ด รัน deploy.sh แล้วเช็คเว็บ](/img/21-deploy-sequence.svg)
*เครื่องกลางสั่งงานผ่าน SSH ส่วนขั้นสุดท้ายคือเปิดเว็บจริงเช็คว่ายังตอบ*

---

## 6. 🔧 ตั้งกติกาให้ `main`

**GitHub → Settings → Branches → Add branch ruleset** สำหรับ `main`
- ✅ ต้องรวมงานผ่านคำขอรวมงาน (PR) และมีคนอนุมัติอย่างน้อย 1 คน
- ✅ ต้องตรวจงาน (`check`) ผ่านก่อน
- ✅ ห้ามบังคับเขียนทับประวัติ (force push)

![PR ที่ตรวจไม่ผ่านถูกล็อกปุ่ม Merge ต้องแก้แล้วส่งใหม่ ถ้าผ่านและมีคนอนุมัติจึงรวมเข้า main](/img/21-branch-protection.svg)
*กติกาของ `main`: ตรวจไม่ผ่านรวมไม่ได้ ผ่านแล้วยังต้องรอคนอนุมัติ*

**GitHub → Settings → Environments → production**
- ✅ Required reviewers: ใส่ชื่อพี่เลี้ยง ขึ้นระบบได้เมื่อพี่เลี้ยงกดอนุมัติ (เหมาะกับช่วงฝึกงาน)

ขั้นตอนทำงานหลังจากนี้ (ทบทวน [บทที่ 1 ข้อ 16 Workflow ของทีม](./01-git.md#_16-workflow-ของทีม-blicktech))
```
 แตก branch ใหม่ → แก้ → commit → ส่งขึ้น Git → เปิดคำขอรวมงาน (PR)
   → เครื่องตรวจผ่าน (เขียว) → พี่เลี้ยงตรวจ + อนุมัติ → รวมงาน
   → เครื่องขึ้นระบบ → (พี่เลี้ยงกดอนุมัติ) → เว็บอัปเดต → เปิดเว็บเช็คผ่าน ✅
```

---

## 7. 🦊 ถ้าใช้ GitLab แทน GitHub

หลายโปรเจกต์ของทีม Blicktech ใช้ GitLab หลักการเหมือนกันทุกอย่าง ต่างแค่ไฟล์ตั้งค่า
เก็บค่าลับที่ **Settings → CI/CD → Variables** (ติ๊ก Masked + Protected) ใช้ชื่อเดียวกับข้อ 4

`.gitlab-ci.yml`

```yaml
stages: [check, deploy]

check:
  stage: check
  image: oven/bun:1
  variables:
    DATABASE_URL: postgres://ci@127.0.0.1:1/none
    JWT_SECRET: ci-only-secret-ci-only-secret-ci-only
  script:
    - cd server && bun install --frozen-lockfile && bun run typecheck && bun test
    - cd ../client && bun install --frozen-lockfile && bun run build

deploy:
  stage: deploy
  image: alpine:3.22
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  environment: production
  resource_group: production          # deploy ทีละรอบ ไม่ซ้อนกัน
  before_script:
    - apk add --no-cache openssh-client curl
    - install -m 700 -d ~/.ssh
    - echo "$SSH_KEY" > ~/.ssh/id_ed25519 && chmod 600 ~/.ssh/id_ed25519
    - echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
  script:
    - ssh "$SSH_USER@$SSH_HOST" 'cd ~/bit-cafe && git fetch origin main && git reset --hard origin/main && ./deploy/deploy.sh'
    - curl -fsS --retry 10 --retry-delay 5 --retry-all-errors "https://$DOMAIN/api/health"
```
ตั้งให้ `main` เป็นแบบป้องกัน (Settings → Repository → Protected branches) รวมงานได้ผ่านคำขอรวมงาน (MR) เท่านั้น และงานตรวจต้องผ่านก่อน (Settings → Merge requests → Pipelines must succeed)

---

## 8. 🤓 ขั้นต่อไป (รู้ไว้ ยังไม่ต้องทำ)

| ระดับ | ทำยังไง | ได้อะไร |
|---|---|---|
| **บทนี้** | เครื่องกลางเข้าไปสร้างกล่องบนเครื่องเช่า | ง่าย เข้าใจทุกขั้น |
| สร้างกล่องบนเครื่องกลาง | เครื่องกลางสร้างกล่องแล้วฝากไว้ที่คลังกล่อง เครื่องเช่าแค่ดึงไปใช้ | เครื่องเช่าไม่ต้องออกแรงสร้างกล่อง ถอยเวอร์ชันง่าย |
| มีเว็บทดลองแยกจากเว็บจริง | branch หนึ่งขึ้นเว็บทดลอง อีก branch ขึ้นเว็บจริง | ลองของบนระบบที่เหมือนจริงก่อนถึงลูกค้า |
| ระบบใหญ่ (Kubernetes) | มีเครื่องมือคอยดูไฟล์ใน Git แล้วปรับระบบให้ตรงเอง | ระบบใหญ่หลายส่วน (บางระบบของบริษัทใช้แบบนี้) |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. CI กับ CD ต่างกันยังไง?</summary>

CI = ตรวจงานอัตโนมัติทุกครั้งที่มีการแก้โค้ด (ชนิดข้อมูล, โค้ดทดสอบ, แพ็กเว็บ) / CD = เอางานที่ตรวจผ่านแล้วขึ้นระบบจริงอัตโนมัติ
</details>

<details><summary>2. ทำไมเครื่องกลางต้องใช้กุญแจแยก ไม่ใช้กุญแจส่วนตัวของเรา?</summary>

ถ้ากุญแจของเครื่องกลางหลุด ยกเลิกได้ทันทีโดยไม่กระทบคนอื่น และรู้ชัดว่าการเข้าเครื่องครั้งไหนมาจากเครื่องกลาง
</details>

<details><summary>3. ทำไมโค้ดทดสอบ 401 รันได้โดยไม่มีฐานข้อมูล?</summary>

ด่านตรวจ login ตอบ 401 กลับก่อนถึงโค้ดที่ใช้ฐานข้อมูล และตัวต่อฐานข้อมูลยังไม่ต่อจริงจนกว่าจะมีคำสั่งแรก จึงใส่ที่อยู่ฐานข้อมูลปลอมได้
</details>

<details><summary>4. เปิดคำขอรวมงานแล้วงานตรวจขึ้นสีแดง ควรทำอะไร?</summary>

เปิดบันทึกของขั้นที่แดง อ่าน error บรรทัดแรก (บทที่ 9) แก้ใน branch เดิมแล้วส่งขึ้นใหม่ เครื่องจะตรวจให้อีกรอบ ห้ามรวมงานทั้งที่ยังแดง
</details>

---

## ✏️ แบบฝึกหัด

ทำระบบนี้ให้ Bit Café: เปิดคำขอรวมงานที่ตั้งใจทำให้ทดสอบไม่ผ่าน (เช่น ลบบรรทัด `app.use("/api/admin/*", requireAdmin)`) แคปจอว่าเครื่องจับได้และรวมงานไม่ได้ จากนั้นแก้ให้ผ่าน รวมงาน แล้วแคปจอว่าขึ้นระบบและเช็คเว็บผ่าน

## ✅ ผ่านด่าน

- [ ] มีโค้ดทดสอบว่า API หลังบ้านทุกตัวได้ 401 และรันด้วย `bun test` ได้
- [ ] มีไฟล์ `deploy/deploy.sh` ที่หยุดทันทีเมื่อขั้นไหนพัง
- [ ] เก็บกุญแจและค่าลับในช่อง Secrets ถูกวิธี
- [ ] เปิดคำขอรวมงาน → ตรวจอัตโนมัติ / รวมเข้า main → ขึ้นระบบ + เช็คเว็บอัตโนมัติ
- [ ] ตั้งกติกาให้ `main` และให้ต้องกดอนุมัติก่อนขึ้นระบบได้

---

[← บทที่ 20: ขึ้นเว็บบนเครื่องเช่า](./20-deploy-vps.md) · [🏠 สารบัญ](/) · [บทที่ 22: ใช้บริการสำเร็จรูป →](./22-deploy-managed.md)
