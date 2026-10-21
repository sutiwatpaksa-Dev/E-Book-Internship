<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { withBase } from "vitepress";
import { useSession } from "../composables/use-session";
import { roadmap } from "../data/roadmap";
import { canSee, needsRole } from "../lib/access";

// ติ๊ก "ผ่านแล้ว" เก็บในเบราว์เซอร์ของแต่ละคน (ไม่ส่งขึ้น server) ล้างเบราว์เซอร์แล้วหายได้
const STORAGE_KEY = "bt-roadmap-done";
const done = ref<Set<string>>(new Set());
const { role, refresh } = useSession();

onMounted(() => {
  refresh();
  try {
    done.value = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {}
});

function toggle(link: string) {
  const next = new Set(done.value);
  next.has(link) ? next.delete(link) : next.add(link);
  done.value = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {}
}

const required = roadmap.flatMap((l) => l.items.filter((i) => !i.extra));
const doneCount = computed(() => required.filter((i) => done.value.has(i.link)).length);
const percent = computed(() => Math.round((doneCount.value / required.length) * 100));
const locked = (link: string) => !canSee(needsRole(link), role.value);
</script>

<template>
  <div class="rm">
    <div class="rm-progress" role="status">
      <span>ผ่านแล้ว <b>{{ doneCount }}</b> / {{ required.length }} บท</span>
      <span class="rm-bar"><span :style="{ width: percent + '%' }" /></span>
      <span>{{ percent }}%</span>
    </div>

    <div class="rm-start">เริ่มที่นี่ 👇</div>

    <section v-for="(level, li) in roadmap" :key="level.title" class="rm-level">
      <div class="rm-node">
        <span class="rm-node-title">{{ level.title }}</span>
        <span class="rm-node-goal">{{ level.goal }}</span>
      </div>
      <ul class="rm-items">
        <li
          v-for="(item, i) in level.items"
          :key="item.link"
          class="rm-item"
          :class="[i % 2 === 0 ? 'is-left' : 'is-right', { 'is-done': done.has(item.link), 'is-extra': item.extra }]"
        >
          <a class="rm-link" :href="withBase(item.link)">
            <span class="rm-num">{{ item.num }}</span>
            <span class="rm-body">
              <span class="rm-title">{{ item.title }}<span v-if="locked(item.link)" title="ต้อง login"> 🔒</span></span>
              <span class="rm-outcome">{{ item.outcome }}</span>
              <span class="rm-time">⏱ {{ item.time }}</span>
            </span>
          </a>
          <button
            v-if="!item.extra"
            class="rm-check"
            type="button"
            :aria-pressed="done.has(item.link)"
            :title="done.has(item.link) ? 'ยกเลิกติ๊ก' : 'ติ๊กว่าผ่านบทนี้แล้ว'"
            @click="toggle(item.link)"
          >
            {{ done.has(item.link) ? "✓" : "" }}
          </button>
        </li>
      </ul>
      <div v-if="li === roadmap.length - 1" class="rm-finish">🎉 ส่งมอบเว็บที่ลูกค้าใช้งานจริง</div>
    </section>

    <div class="rm-legend">
      <span><i class="rm-key" /> บทหลัก อ่านตามลำดับ</span>
      <span><i class="rm-key is-extra" /> บทเสริม อ่านเมื่ออยากรู้ลึก</span>
      <span>🔒 ต้อง login</span>
      <span>✓ ติ๊กเองเมื่อผ่านบท (เก็บในเบราว์เซอร์นี้)</span>
    </div>
  </div>
</template>

<style scoped>
.rm {
  --rm-node-bg: #ffe066;
  --rm-node-fg: #1f2328;
  --rm-item-bg: #fff6d6;
  --rm-line: #2f6feb;
  --rm-done: #2da44e;
  margin: 24px 0;
}
:global(.dark) .rm {
  --rm-node-bg: #d4a72c;
  --rm-node-fg: #1b1b1f;
  --rm-item-bg: #2b2a24;
  --rm-line: #4c8dff;
  --rm-done: #3fb950;
}

.rm-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}
.rm-bar {
  flex: 1;
  height: 8px;
  border-radius: 99px;
  background: var(--vp-c-default-soft);
  overflow: hidden;
}
.rm-bar > span {
  display: block;
  height: 100%;
  background: var(--rm-done);
  transition: width 0.3s;
}

.rm-start,
.rm-finish {
  width: fit-content;
  margin: 20px auto 0;
  padding: 6px 14px;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}
.rm-finish {
  margin-top: 28px;
}

/* เส้นแกนกลางที่ร้อยทุกด่านเข้าด้วยกัน */
.rm-level {
  position: relative;
  padding-top: 28px;
}
.rm-level::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  border-left: 3px solid var(--rm-line);
  transform: translateX(-50%);
}
.rm-level:last-of-type::before {
  bottom: 18px;
}

.rm-node {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(340px, 90%);
  margin: 0 auto;
  padding: 10px 16px;
  border: 2px solid var(--rm-node-fg);
  border-radius: 8px;
  background: var(--rm-node-bg);
  color: var(--rm-node-fg);
  text-align: center;
}
.rm-node-title {
  font-weight: 700;
}
.rm-node-goal {
  font-size: 13px;
  line-height: 1.4;
}

.rm-items {
  display: grid;
  grid-template-columns: 1fr 56px 1fr;
  row-gap: 12px;
  margin: 16px 0 0 !important;
  padding: 0 !important;
  list-style: none;
}
.rm-item {
  position: relative;
  display: flex;
  align-items: stretch;
  margin: 0 !important;
}
.rm-item.is-left {
  grid-column: 1;
}
.rm-item.is-right {
  grid-column: 3;
}
/* เส้นประจากบทไปหาแกนกลาง */
.rm-item::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 28px;
  border-top: 2px dashed var(--rm-line);
}
.rm-item.is-left::after {
  right: -28px;
}
.rm-item.is-right::after {
  left: -28px;
}

.rm-link {
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border: 2px solid var(--rm-node-fg);
  border-radius: 8px;
  background: var(--rm-item-bg);
  color: var(--vp-c-text-1) !important;
  text-decoration: none !important;
  transition: transform 0.15s, box-shadow 0.15s;
}
:global(.dark) .rm-link {
  border-color: var(--vp-c-divider);
}
.rm-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.rm-num {
  flex-shrink: 0;
  min-width: 28px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}
.rm-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rm-title {
  font-weight: 600;
  line-height: 1.4;
}
.rm-outcome {
  font-size: 13px;
  line-height: 1.45;
  color: var(--vp-c-text-2);
}
.rm-time {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.rm-check {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 26px;
  height: 26px;
  border: 2px solid var(--vp-c-divider);
  border-radius: 50%;
  background: var(--vp-c-bg);
  color: #fff;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}
.rm-check:hover {
  border-color: var(--rm-done);
}
.is-done .rm-check {
  border-color: var(--rm-done);
  background: var(--rm-done);
}
.is-done .rm-link {
  border-color: var(--rm-done);
}
.is-done .rm-title {
  text-decoration: line-through;
  text-decoration-color: var(--rm-done);
}

.is-extra .rm-link {
  border-style: dashed;
  border-color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
}
.is-extra::after {
  border-top-style: dotted;
  border-color: var(--vp-c-text-3);
}

.rm-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 24px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.rm-key {
  display: inline-block;
  width: 18px;
  height: 12px;
  margin-right: 4px;
  vertical-align: middle;
  border: 2px solid var(--rm-node-fg);
  border-radius: 3px;
  background: var(--rm-item-bg);
}
.rm-key.is-extra {
  border-style: dashed;
  border-color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
}

/* จอแคบ: แกนย้ายไปซ้าย บทเรียงลงมาแถวเดียว */
@media (max-width: 640px) {
  .rm-level::before {
    left: 14px;
    transform: none;
  }
  .rm-node {
    margin-left: 0;
    width: 100%;
    align-items: flex-start;
    text-align: left;
  }
  .rm-items {
    grid-template-columns: 1fr;
    padding-left: 40px !important;
  }
  .rm-item.is-left,
  .rm-item.is-right {
    grid-column: 1;
  }
  .rm-item.is-left::after,
  .rm-item.is-right::after {
    left: -26px;
    right: auto;
    width: 26px;
  }
  .rm-start,
  .rm-finish {
    margin-left: 0;
  }
}
</style>
