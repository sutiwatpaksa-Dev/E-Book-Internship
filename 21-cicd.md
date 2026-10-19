# บทที่ 21: CI/CD: ตรวจและ Deploy อัตโนมัติ 🤖🚚

> ⏱ ประมาณ 3 ชั่วโมง · 🧩 ต้องผ่านก่อน: บทที่ 1 และ 20 · 🛠 ใช้: GitHub Actions (หรือ GitLab CI), SSH, `bun test`

> **⚡ สรุป 30 วินาที**
> - **CI (Continuous Integration)** = ทุกครั้งที่ push/เปิด PR เครื่องกลางตรวจให้: typecheck, test, build
> - **CD (Continuous Deployment)** = merge เข้า `main` แล้ว deploy ขึ้น server ให้เอง ด้วยขั้นตอนเดียวกับบทที่ 20
> - ความลับ (SSH key, IP) เก็บใน **Secrets** ของ GitHub/GitLab ไม่อยู่ในโค้ด
> - ตั้ง **branch protection**: เข้า `main` ได้ทาง PR ที่ CI เขียวเท่านั้น

---

## 📖 เรื่องเล่า

ศุกร์ 5 โมงเย็น บิตแก้ข้อความหน้าแรกนิดเดียว SSH เข้า server แล้ว `git pull` + build ตามบทที่ 20
แต่ลืมรัน migrate... เว็บ error ทั้งคืน 😵 วันจันทร์ลูกค้าโทรมา

พี่ไบต์: *"ขั้นตอนที่ต้องทำเหมือนเดิมทุกครั้ง ให้เครื่องทำ คนลืมได้ เครื่องไม่ลืม"*

---

## 1. Pipeline ที่เราจะสร้าง

```
 เปิด PR / push branch                                merge เข้า main
        │                                                    │
        ▼                                                    ▼
 ┌─ check ──────────────────────┐              ┌─ check (เหมือนเดิม) ─┐
 │ server: install → typecheck  │              └──────────┬───────────┘
 │         → test               │                         │ ผ่าน
 │ client: install → build      │                         ▼
 └──────────────────────────────┘              ┌─ deploy ───────────────────────────┐
   ❌ แดง = ห้าม merge                           │ SSH เข้า VPS → git reset ไป main     │
                                                │ → build → migrate → up → ตรวจ health │
                                                └─────────────────────────────────────┘
```

---

## 2. 🔧 Test ที่ต้องมีก่อนให้เครื่อง deploy แทน

ถ้าไม่มี test, CI ก็แค่ตรวจว่า "compile ผ่าน" เริ่มจาก test ที่สำคัญที่สุดของ STARTER: **ทุก admin endpoint ไม่ login ต้องได้ 401**

`server/src/admin.test.ts`
```ts
import { expect, test } from "bun:test";
import server from "./index";

// ทุก endpoint หลังบ้าน: ไม่มี cookie ต้องได้ 401 เสมอ (ข้อที่ทำให้ไม่ผ่านทันทีถ้าพลาด)
const adminEndpoints = [
  ["GET", "/api/admin/me"],
  ["GET", "/api/admin/dashboard"],
  ["GET", "/api/admin/messages/1"],
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
👀 test นี้ **ไม่ต้องมีฐานข้อมูล** เพราะ middleware ตอบ 401 ก่อนถึงโค้ดที่ query DB จึงรันใน CI ได้ง่าย
🤓 `bun test` ตั้ง `NODE_ENV=test` ให้เอง นี่คือเหตุผลที่ `env.ts` ในบทที่ 14 ต้องรับค่า `"test"` ด้วย (ตอนเขียนคู่มือ เคสนี้ทำให้ test พังจริงมาแล้ว)
💡 เพิ่ม endpoint หลังบ้านใหม่เมื่อไหร่ **เพิ่มบรรทัดในรายการนี้ทุกครั้ง** (เพิ่มเป็นข้อใน `CLAUDE.md` ด้วย)

---

## 3. 🔧 สคริปต์ deploy (ใช้ร่วมกันทั้ง manual และ CI)

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
```bash
chmod +x deploy/deploy.sh
git add deploy/deploy.sh && git commit -m "chore: add deploy script"
```
> 🤓 **ทำไม `git pull` ไม่อยู่ในสคริปต์?** bash อ่านสคริปต์ทีละส่วนระหว่างรัน ถ้าสคริปต์ดึงโค้ดใหม่ที่แก้ตัวมันเองระหว่างทาง ผลลัพธ์จะเพี้ยนได้ จึงอัปเดตโค้ด **ก่อน** เรียกสคริปต์

---

## 4. 🔧 กุญแจสำหรับ CI

CI ต้อง SSH เข้า server ได้ สร้าง **กุญแจคู่ใหม่สำหรับ CI โดยเฉพาะ** (ไม่ใช้กุญแจส่วนตัวของเรา)
```bash
# ในเครื่องเรา
ssh-keygen -t ed25519 -f ./ci_deploy_key -N "" -C "github-actions"
ssh-copy-id -i ./ci_deploy_key.pub bitcafe       # ติด public key ให้ user deploy บน server
ssh-keyscan -t ed25519 203.0.113.10              # ลายนิ้วมือ server สำหรับ known_hosts
```
เก็บใน **GitHub → repo → Settings → Secrets and variables → Actions**
| ชนิด | ชื่อ | ค่า |
|---|---|---|
| Secret | `SSH_HOST` | `203.0.113.10` |
| Secret | `SSH_USER` | `deploy` |
| Secret | `SSH_KEY` | เนื้อหาไฟล์ `ci_deploy_key` (private) ทั้งไฟล์ |
| Secret | `SSH_KNOWN_HOSTS` | ผลจาก `ssh-keyscan` |
| Variable | `DOMAIN` | `example.com` |

แล้ว **ลบไฟล์ `ci_deploy_key` ในเครื่องทิ้ง** (`rm ci_deploy_key*`) อยู่ใน GitHub Secrets ที่เดียวพอ

> ⚠️ secret ห้ามโผล่ใน log GitHub จะเซ็นเซอร์ค่าที่ตรงกับ secret ให้ แต่ถ้าเรา `echo` แปลงรูปแบบ (เช่น base64) จะไม่ถูกเซ็นเซอร์ อย่าพิมพ์ secret ออกมาเด็ดขาด

---

## 5. 🔧 GitHub Actions

`.github/workflows/ci-cd.yml`
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
| ส่วน | ทำอะไร |
|---|---|
| `on: pull_request` / `push: main` | PR = ตรวจอย่างเดียว / push เข้า main = ตรวจ + deploy |
| `needs: check` | deploy เริ่มเมื่อ check ผ่านเท่านั้น |
| `environment: production` | ตั้งให้ต้องมีคนกดอนุมัติก่อน deploy ได้ (ข้อ 6) |
| `git reset --hard origin/main` | ให้โค้ดบน server ตรงกับ main เป๊ะ (ถ้ามีใครแก้ไฟล์บน server ตรงๆ จะถูกทับ: ซึ่งดี เพราะไม่ควรมีใครแก้ตรงนั้น) |
| `known_hosts` | ยืนยันว่า SSH ไปเครื่องจริง ไม่ใช่เครื่องปลอม |
| Health check | deploy เสร็จแล้วเรียกเว็บจริง ถ้าไม่ตอบ job แดง เรารู้ทันที |

---

## 6. 🔧 ตั้งกติกาให้ `main`

**GitHub → Settings → Branches → Add branch ruleset** (หรือ Branch protection rule) สำหรับ `main`
- ✅ Require a pull request before merging (อย่างน้อย 1 approve)
- ✅ Require status checks to pass → เลือก `check`
- ✅ Block force pushes

**GitHub → Settings → Environments → production**
- ✅ Required reviewers: ใส่ชื่อพี่เลี้ยง → deploy ต้องมีคนกดอนุมัติ (เหมาะกับช่วงฝึกงาน)

flow การทำงานหลังจากนี้ (ทบทวน [บทที่ 1 ข้อ 8](./01-git.md)):
```
 git switch -c feat/hero-text → แก้ → commit → push → เปิด PR
   → CI check เขียว → พี่เลี้ยง review + approve → merge
   → CI deploy → (พี่เลี้ยงกดอนุมัติ environment) → เว็บอัปเดต → health check เขียว ✅
```

---

## 7. 🦊 ใช้ GitLab แทน GitHub

ทีม Blicktech หลายโปรเจกต์ใช้ GitLab แนวคิดเหมือนกันทุกอย่าง เปลี่ยนแค่ไฟล์ config
เก็บตัวแปรที่ **Settings → CI/CD → Variables** (ติ๊ก Masked + Protected) ชื่อเดียวกับข้อ 4

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
  image: alpine:3.20
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
ตั้ง **Protected branch** `main` (Settings → Repository) ให้ merge ผ่าน MR เท่านั้น และ pipeline ต้องผ่าน (Settings → Merge requests → Pipelines must succeed)

---

## 8. 🤓 ขั้นต่อไป (รู้ไว้ ยังไม่ต้องทำ)

| ระดับ | ทำยังไง | ได้อะไร |
|---|---|---|
| **บทนี้** | CI SSH เข้าไป build บน server | ง่าย เข้าใจทุกขั้น |
| build image ใน CI | CI build แล้ว push ไป registry (GHCR / GitLab Registry) server แค่ `pull` | server ไม่ต้องใช้ RAM build, ถอยเวอร์ชันด้วย tag ของ image |
| staging + production | `dev` → staging อัตโนมัติ, `main` → production | ลองของบนระบบเหมือนจริงก่อนถึงลูกค้า |
| GitOps / Kubernetes | ArgoCD อ่าน config จาก Git แล้ว sync เอง | ระบบใหญ่ หลาย service (ระบบจริงหลายตัวของบริษัทใช้แบบนี้) |

---

## 🧠 เช็คความเข้าใจ

<details><summary>1. CI กับ CD ต่างกันยังไง?</summary>

CI = ตรวจคุณภาพโค้ดอัตโนมัติทุกครั้งที่มีการเปลี่ยน (typecheck, test, build) / CD = เอาโค้ดที่ผ่านแล้วขึ้น server อัตโนมัติ
</details>

<details><summary>2. ทำไม CI ต้องใช้ SSH key แยก ไม่ใช้กุญแจส่วนตัวของเรา?</summary>

ถ้า key ของ CI หลุด ลบออกจาก `authorized_keys` ได้ทันทีโดยไม่กระทบคนอื่น และรู้ชัดว่าการเข้าเครื่องครั้งไหนมาจาก CI
</details>

<details><summary>3. ทำไม test 401 รันได้โดยไม่มีฐานข้อมูล?</summary>

middleware ตอบ 401 ก่อนถึง route ที่ query DB และ `drizzle()` ยังไม่ต่อ DB จนกว่าจะมี query แรก จึงใส่ `DATABASE_URL` หลอกได้
</details>

<details><summary>4. เปิด PR แล้ว check แดง ควรทำอะไร?</summary>

เปิด log ของ job ดูขั้นที่แดง อ่าน error บรรทัดแรก (บทที่ 9) แก้ใน branch เดิมแล้ว push ใหม่ CI จะรันให้อีกรอบ ห้าม merge ทั้งที่แดง
</details>

---

## ✏️ แบบฝึกหัด

ทำ CI/CD ให้ Bit Café: เปิด PR ที่จงใจทำให้ test แดง (เช่น ลบ `app.use("/api/admin/*", requireAdmin)`) แคปจอว่า CI จับได้และ merge ไม่ได้ จากนั้นแก้ให้เขียว merge แล้วแคปจอ deploy + health check ผ่าน

## ✅ ผ่านด่าน

- [ ] มี test ที่ยืนยันว่าทุก admin endpoint ได้ 401 และรันด้วย `bun test` ได้
- [ ] มี `deploy/deploy.sh` ที่หยุดทันทีเมื่อขั้นไหนพัง
- [ ] เก็บ SSH key และค่าลับใน Secrets อย่างถูกต้อง
- [ ] PR → check อัตโนมัติ / merge main → deploy + health check อัตโนมัติ
- [ ] ตั้ง branch protection และ environment approval ได้

---

[← บทที่ 20: Deploy บน VPS](./20-deploy-vps.md) · [🏠 สารบัญ](./README.md) · [บทที่ 22: Deploy แบบ Managed →](./22-deploy-managed.md)
