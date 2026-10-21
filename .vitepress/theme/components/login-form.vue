<script setup lang="ts">
import { ref } from "vue";
import { useSession } from "../composables/use-session";

const { login } = useSession();

const username = ref("");
const pin = ref("");
const error = ref("");
const busy = ref(false);

// รับเฉพาะ path ภายในเว็บเรา กันคนส่งลิงก์ login?next=https://เว็บปลอม มาหลอก
function nextPath() {
  const next = new URLSearchParams(location.search).get("next") ?? "/starter/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/starter/";
}

async function submit() {
  error.value = "";
  busy.value = true;
  try {
    await login(username.value, pin.value);
    // โหลดหน้าใหม่ทั้งหน้า ให้คำขอผ่าน middleware พร้อม cookie ใหม่
    location.assign(nextPath());
  } catch (e) {
    error.value = (e as Error).message;
    pin.value = "";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <form class="bt-form" @submit.prevent="submit">
    <label>
      Username
      <input v-model="username" autocomplete="username" autocapitalize="none" spellcheck="false" required />
    </label>
    <label>
      PIN 6 หลัก
      <input
        v-model="pin"
        type="password"
        inputmode="numeric"
        autocomplete="current-password"
        pattern="\d{6}"
        maxlength="6"
        required
      />
    </label>
    <p v-if="error" class="bt-error" role="alert">{{ error }}</p>
    <button class="bt-btn" type="submit" :disabled="busy">{{ busy ? "กำลังตรวจ…" : "เข้าสู่ระบบ" }}</button>
  </form>
</template>
