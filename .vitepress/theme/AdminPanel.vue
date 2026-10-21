<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, type Role } from "./session";

type User = { id: number; username: string; role: Role; disabled: boolean; lockedUntil: string | null; lastLoginAt: string | null };

const users = ref<User[]>([]);
const error = ref("");
// PIN ที่เพิ่งสร้าง แสดงครั้งเดียวให้คัดลอกส่งน้อง (ระบบเก็บแค่ hash ดูย้อนหลังไม่ได้)
const issued = ref<{ username: string; pin: string } | null>(null);
const newUsername = ref("");
const newRole = ref<Role>("intern");
const pdf = ref<{ size: number; updatedAt: string } | null>(null);

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("th-TH") : "–");
const isLocked = (u: User) => !!u.lockedUntil && new Date(u.lockedUntil) > new Date();

async function run(fn: () => Promise<void>) {
  error.value = "";
  try {
    await fn();
  } catch (e) {
    error.value = (e as Error).message;
  }
}

const load = () =>
  run(async () => {
    users.value = await api<User[]>("/admin/users");
    pdf.value = await api("/admin/requirement");
  });

const json = (method: string, body: unknown) => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

const create = () =>
  run(async () => {
    const r = await api<{ user: User; pin: string }>("/admin/users", json("POST", { username: newUsername.value, role: newRole.value }));
    issued.value = { username: r.user.username, pin: r.pin };
    newUsername.value = "";
    await load();
  });

const resetPin = (u: User) =>
  run(async () => {
    if (!confirm(`ออก PIN ใหม่ให้ ${u.username}? PIN เดิมจะใช้ไม่ได้ทันที`)) return;
    const r = await api<{ user: User; pin: string }>(`/admin/users/${u.id}/reset-pin`, { method: "POST" });
    issued.value = { username: u.username, pin: r.pin };
    await load();
  });

const patch = (u: User, body: object) =>
  run(async () => {
    await api(`/admin/users/${u.id}`, json("PATCH", body));
    await load();
  });

const upload = (e: Event) =>
  run(async () => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    pdf.value = await api("/admin/requirement", { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file });
  });

onMounted(load);
</script>

<template>
  <div class="bt-admin">
    <p v-if="error" class="bt-error" role="alert">{{ error }}</p>

    <div v-if="issued" class="bt-issued" role="status">
      PIN ของ <strong>{{ issued.username }}</strong>: <code class="bt-pin">{{ issued.pin }}</code>
      <span>คัดลอกส่งให้น้องตอนนี้ ปิดกล่องนี้แล้วจะดูอีกไม่ได้</span>
      <button class="bt-auth-link" type="button" @click="issued = null">ปิด</button>
    </div>

    <h2>เพิ่มบัญชี</h2>
    <form class="bt-row" @submit.prevent="create">
      <input v-model="newUsername" placeholder="username" autocapitalize="none" spellcheck="false" required />
      <select v-model="newRole">
        <option value="intern">Internship</option>
        <option value="dev">Dev (พี่เลี้ยง)</option>
      </select>
      <button class="bt-btn" type="submit">สร้าง + ออก PIN</button>
    </form>

    <h2>บัญชีทั้งหมด</h2>
    <div class="bt-table">
      <table>
        <thead>
          <tr><th>Username</th><th>Role</th><th>สถานะ</th><th>เข้าล่าสุด</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.username }}</td>
            <td>
              <select :value="u.role" @change="patch(u, { role: ($event.target as HTMLSelectElement).value })">
                <option value="intern">Internship</option>
                <option value="dev">Dev</option>
              </select>
            </td>
            <td>{{ u.disabled ? "ปิดอยู่" : isLocked(u) ? "ล็อกชั่วคราว" : "ใช้งาน" }}</td>
            <td>{{ fmt(u.lastLoginAt) }}</td>
            <td class="bt-actions">
              <button v-if="isLocked(u)" type="button" @click="patch(u, { unlock: true })">ปลดล็อก</button>
              <button type="button" @click="resetPin(u)">ออก PIN ใหม่</button>
              <button type="button" @click="patch(u, { disabled: !u.disabled })">{{ u.disabled ? "เปิดบัญชี" : "ปิดบัญชี" }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>ไฟล์ Requirement (PDF)</h2>
    <p v-if="pdf">ไฟล์ปัจจุบัน {{ Math.round(pdf.size / 1024) }} KB · อัปเดต {{ fmt(pdf.updatedAt) }} · <a href="/api/files/requirement.pdf" target="_blank" rel="noopener">เปิดดู</a></p>
    <p v-else>ยังไม่มีไฟล์ น้องจะเปิดแผง Requirement ไม่ได้จนกว่าจะอัปโหลด</p>
    <label class="bt-btn bt-upload">
      อัปโหลด PDF ใหม่ (ไม่เกิน 4 MB)
      <input type="file" accept="application/pdf" hidden @change="upload" />
    </label>
  </div>
</template>
