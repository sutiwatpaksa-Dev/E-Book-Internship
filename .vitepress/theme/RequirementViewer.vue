<script setup lang="ts">
// แผง Requirement ต้นฉบับ (PDF) เปิดข้างคู่มือ อ่านเทียบกันได้โดยไม่ต้องสลับแท็บ
// ถ้าจอแคบจนเหลือที่ให้เนื้อหาไม่พอ (วางคู่กันไม่ได้) จะเปิด PDF ตามปกติแทน
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vitepress";

const PDF = "/docs/starter-requirement.pdf";
// ความกว้างที่ต้องเหลือให้เนื้อหาคู่มือ (ข้อความ ~480px + ระยะขอบของ VitePress) และความกว้างต่ำสุดของแผง
const CONTENT_MIN = 608;
const PANEL_MIN = 360;
const WIDTH_KEY = "req-viewer-width";

// หัวข้อในต้นฉบับกับหน้าของ PDF (ตรงกับตารางใน starter/compare.md)
const sections = [
  { page: 1, label: "1. ภาพรวมโปรเจกต์" },
  { page: 2, label: "2. ขอบเขตงาน + เลือกธุรกิจ" },
  { page: 3, label: "3. Tech stack + โฟลเดอร์" },
  { page: 4, label: "4. หน้าบ้าน (Public)" },
  { page: 5, label: "5. หลังบ้าน (Admin)" },
  { page: 7, label: "6. ฐานข้อมูล" },
  { page: 8, label: "7. API Spec" },
  { page: 10, label: "8. Non-functional" },
  { page: 11, label: "9. Timeline 10 วัน" },
  { page: 12, label: "10. สิ่งที่ต้องส่ง + เกณฑ์" },
  { page: 13, label: "11. Bonus" },
  { page: 14, label: "Checklist รายวัน" },
  { page: 16, label: "ควรศึกษาก่อน (รายวัน)" },
];

const route = useRoute();
const open = ref(false);
const page = ref(1);
// เปลี่ยน key เพื่อโหลด iframe ใหม่ เพราะตัวอ่าน PDF ของเบราว์เซอร์ไม่สนใจการเปลี่ยน #page ทีหลัง
const frameKey = ref(0);
const width = ref(560);
const dockable = ref(false);

const onStarter = computed(() => route.path.startsWith("/starter/"));
// เอกสารนี้เป็นโจทย์ของ Mini Project แผงจึงแสดงเฉพาะหน้า STARTER ออกไปบทอื่นแล้วซ่อน กลับมาแล้วแสดงต่อ
const visible = computed(() => open.value && onStarter.value);
const src = computed(() => `${PDF}#page=${page.value}&navpanes=0&view=FitH`);

function show(p = 1) {
  if (!dockable.value) {
    window.open(`${PDF}#page=${p}`, "_blank", "noopener");
    return;
  }
  page.value = p;
  frameKey.value++;
  open.value = true;
}

function jump(e: Event) {
  show(Number((e.target as HTMLSelectElement).value));
}

// ลิงก์ PDF ในเนื้อหา (มี #page=N) ให้เปิดในแผงแทนแท็บใหม่
function onClick(e: MouseEvent) {
  if (!dockable.value || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const a = (e.target as HTMLElement).closest?.("a");
  if (!a) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname !== PDF) return;
  e.preventDefault();
  const m = url.hash.match(/page=(\d+)/);
  show(m ? Number(m[1]) : 1);
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape" && visible.value) open.value = false;
}

// แผงกว้างได้สูงสุดเท่าที่เหลือหลังหักแถบเมนูซ้าย (padding-left ของ .VPContent) และที่ของเนื้อหา
function maxWidth() {
  const content = document.querySelector<HTMLElement>(".VPContent");
  const left = content ? parseFloat(getComputedStyle(content).paddingLeft) || 0 : 0;
  return window.innerWidth - left - CONTENT_MIN;
}

function onResize() {
  dockable.value = maxWidth() >= PANEL_MIN;
  if (!dockable.value) open.value = false;
  width.value = clampWidth(width.value);
}

function clampWidth(w: number) {
  return Math.round(Math.min(Math.max(w, PANEL_MIN), Math.max(maxWidth(), PANEL_MIN)));
}

// ลากขอบซ้ายของแผงเพื่อปรับความกว้าง (ระหว่างลาก ปิดการรับเมาส์ของ iframe ไม่งั้นมันกินเหตุการณ์ไป)
const dragging = ref(false);
function startDrag(e: PointerEvent) {
  dragging.value = true;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
}
function onDrag(e: PointerEvent) {
  if (dragging.value) width.value = clampWidth(window.innerWidth - e.clientX);
}
function endDrag() {
  if (!dragging.value) return;
  dragging.value = false;
  try {
    localStorage.setItem(WIDTH_KEY, String(width.value));
  } catch {}
}

watch([visible, width], ([v, w]) => {
  const root = document.documentElement;
  root.classList.toggle("req-open", v);
  root.style.setProperty("--req-w", `${w}px`);
});

onMounted(() => {
  try {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    if (saved) width.value = saved;
  } catch {}
  onResize();
  window.addEventListener("resize", onResize);
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  document.removeEventListener("click", onClick);
  document.removeEventListener("keydown", onKey);
  document.documentElement.classList.remove("req-open");
});
</script>

<template>
  <button
    v-if="onStarter && !open"
    class="req-fab"
    type="button"
    title="แสดงเอกสาร Requirement ต้นฉบับข้างคู่มือ"
    @click="show(1)"
  >
    📄 แสดงเอกสาร Requirement
  </button>

  <aside v-if="visible" class="req-panel" aria-label="เอกสาร Requirement ต้นฉบับ">
    <div
      class="req-resize"
      role="separator"
      aria-orientation="vertical"
      title="ลากเพื่อปรับความกว้าง"
      @pointerdown="startDrag"
      @pointermove="onDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
    />
    <header class="req-head">
      <strong>📄 Requirement ต้นฉบับ</strong>
      <select class="req-jump" aria-label="ไปที่หัวข้อ" :value="''" @change="jump">
        <option value="" disabled>ไปที่หัวข้อ…</option>
        <option v-for="s in sections" :key="s.page" :value="s.page">
          {{ s.label }} (หน้า {{ s.page }})
        </option>
      </select>
      <a class="req-btn" :href="`${PDF}#page=${page}`" target="_blank" rel="noopener" title="เปิดในแท็บใหม่">↗</a>
      <button class="req-btn" type="button" title="ปิด (Esc)" aria-label="ปิดเอกสาร" @click="open = false">✕</button>
    </header>
    <iframe
      :key="frameKey"
      class="req-frame"
      :class="{ 'is-dragging': dragging }"
      :src="src"
      title="เอกสาร Requirement โปรเจกต์ฝึกงาน เว็บไซต์ STARTER (PDF)"
    />
  </aside>
</template>
