import { ref } from "vue";
import { authApi } from "../api/auth.api";
import { readRoleHint } from "../lib/access";
import type { Role } from "../types";

// สถานะ login ใช้ร่วมกันทุก component (ref อยู่นอกฟังก์ชัน จึงเป็นค่าเดียวทั้งเว็บ)
const role = ref<Role | null>(null);

export function useSession() {
  const refresh = () => {
    role.value = readRoleHint();
  };
  const login = async (username: string, pin: string) => {
    await authApi.login(username, pin);
    refresh();
  };
  const logout = async () => {
    await authApi.logout().catch(() => {});
    role.value = null;
  };
  return { role, refresh, login, logout };
}
