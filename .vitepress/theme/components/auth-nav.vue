<script setup lang="ts">
import { onMounted, ref } from "vue";
import { filesApi } from "../api/files.api";
import { useSession } from "../composables/use-session";

const { role, refresh, logout: endSession } = useSession();

const exampleRepo = ref<string | null>(null);
const label = { intern: "Internship", dev: "Dev" } as const;

onMounted(async () => {
  refresh();
  if (!role.value) return;
  try {
    exampleRepo.value = (await filesApi.links()).exampleRepo;
  } catch {
    // บัตรหมดอายุแต่ cookie บอก role ยังค้าง: ถือว่ายังไม่ได้ login
    role.value = null;
  }
});

async function logout() {
  await endSession();
  location.assign("/");
}
</script>

<template>
  <div class="bt-auth">
    <template v-if="role">
      <a v-if="exampleRepo" class="bt-auth-link" :href="exampleRepo" target="_blank" rel="noopener" title="โค้ดของระบบจริง ใช้ดูการวางโครงสร้าง">
        📦 ระบบตัวอย่าง
      </a>
      <a v-if="role === 'dev'" class="bt-auth-link" href="/dev/admin">⚙️ จัดการบัญชี</a>
      <span class="bt-auth-role">{{ label[role] }}</span>
      <button class="bt-auth-link" type="button" @click="logout">ออกจากระบบ</button>
    </template>
    <a v-else class="bt-auth-link" href="/login">🔑 เข้าสู่ระบบ</a>
  </div>
</template>
