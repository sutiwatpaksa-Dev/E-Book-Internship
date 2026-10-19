<script setup lang="ts">
// แผนที่การเดินทาง 3 มิติบนหน้าแรก: 7 ด่านเรียงเป็นเกลียวจาก Basic 0 ขึ้นไปถึงลูกโลก (Deploy)
// โหลด three.js เฉพาะตอนเปิดหน้านี้ และหยุดวาดเมื่อเลื่อนพ้นจอ
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter, withBase } from "vitepress";

const stages = [
  { title: "ด่าน 1", label: "เตรียมตัว", link: "/00-start" },
  { title: "ด่าน 2", label: "ภาษาและ API", link: "/03-node-yarn-bun" },
  { title: "ด่าน 3", label: "ข้อมูล", link: "/06-sql-nosql" },
  { title: "ด่าน 4", label: "มืออาชีพ", link: "/09-debugging" },
  { title: "ด่าน 5", label: "Fullstack", link: "/11-react" },
  { title: "ด่าน 6", label: "Mini Project", link: "/starter/" },
  { title: "ด่าน 7", label: "Deploy 🚀", link: "/17-network" },
];

const container = ref<HTMLDivElement | null>(null);
const failed = ref(false);
const hovered = ref<number | null>(null);
const router = useRouter();

let cleanup: (() => void) | null = null;

onMounted(async () => {
  const el = container.value;
  if (!el) return;

  let THREE: typeof import("three");
  try {
    THREE = await import("three");
  } catch {
    failed.value = true;
    return;
  }

  let renderer: import("three").WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    failed.value = true; // เครื่องที่ไม่มี WebGL: แสดงข้อความแทน
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a1a3f, 18, 42);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(6, 12, 8);
  scene.add(keyLight);

  // ---- ตำแหน่งด่าน: เกลียวขึ้นไปเรื่อยๆ ----
  const radius = 6;
  const points = stages.map((_, i) => {
    const angle = (i / stages.length) * Math.PI * 1.75 - Math.PI / 2;
    return new THREE.Vector3(Math.cos(angle) * radius, i * 1.3 - 4, Math.sin(angle) * radius);
  });
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);

  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0x5b8ef0,
    emissive: 0x1a4fb0,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.55,
  });
  const path = new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.07, 8, false), pathMaterial);
  scene.add(path);

  // ---- แท่นของแต่ละด่าน + ป้ายชื่อ ----
  const startColor = new THREE.Color(0x3f73d6);
  const endColor = new THREE.Color(0xe9a03b);
  const platforms: import("three").Mesh[] = [];
  const disposables: { dispose: () => void }[] = [pathMaterial, path.geometry];

  function makeLabel(title: string, label: string) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(7, 42, 107, 0.85)";
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 144, 36);
    ctx.fill();
    ctx.fillStyle = "#9ec0ff";
    ctx.font = "600 44px 'IBM Plex Sans Thai', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, 256, 66);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 50px 'IBM Plex Sans Thai', system-ui, sans-serif";
    ctx.fillText(label, 256, 126);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2.6, 0.8, 1);
    disposables.push(texture, material);
    return sprite;
  }

  const platformGeometry = new THREE.CylinderGeometry(0.75, 0.9, 0.3, 32);
  disposables.push(platformGeometry);
  points.forEach((p, i) => {
    const color = startColor.clone().lerpHSL(endColor, i / (stages.length - 1));   // น้ำเงิน → ฟ้า → เขียว → ทอง
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.35,
      metalness: 0.3,
      roughness: 0.35,
    });
    disposables.push(material);
    const platform = new THREE.Mesh(platformGeometry, material);
    platform.position.copy(p);
    platform.userData.index = i;
    scene.add(platform);
    platforms.push(platform);

    const sprite = makeLabel(stages[i]!.title, stages[i]!.label);
    sprite.position.set(p.x, p.y + 1.05, p.z);
    scene.add(sprite);
  });

  // ---- ลูกโลกที่ปลายทาง: ขึ้น Internet จริง ----
  const globeGeometry = new THREE.IcosahedronGeometry(1.2, 2);
  const globeMaterial = new THREE.MeshBasicMaterial({ color: 0xe9a03b, wireframe: true, transparent: true, opacity: 0.7 });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  const last = points[points.length - 1]!;
  globe.position.set(last.x * 0.5, last.y + 1.9, last.z * 0.5);
  scene.add(globe);
  disposables.push(globeGeometry, globeMaterial);

  // ---- "บิต": จุดแสงที่วิ่งตามเส้นทาง + หางแสง ----
  const bitGeometry = new THREE.SphereGeometry(0.22, 24, 24);
  const bitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const bit = new THREE.Mesh(bitGeometry, bitMaterial);
  const glow = new THREE.PointLight(0x9ec0ff, 6, 6);
  bit.add(glow);
  scene.add(bit);
  disposables.push(bitGeometry, bitMaterial);

  const trailCount = 40;
  const trailPositions = new Float32Array(trailCount * 3);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  const trailMaterial = new THREE.PointsMaterial({ color: 0x9ec0ff, size: 0.12, transparent: true, opacity: 0.8 });
  scene.add(new THREE.Points(trailGeometry, trailMaterial));
  disposables.push(trailGeometry, trailMaterial);

  // ---- ฝุ่นดาว (code dust) ----
  const starCount = 600;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 50;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0x7aa7ff, size: 0.06, transparent: true, opacity: 0.7 });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  disposables.push(starGeometry, starMaterial);

  // ---- ขนาด / เมาส์ / คลิก ----
  let distance = 17;
  function resize() {
    const { clientWidth: w, clientHeight: h } = el!;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    distance = camera.aspect < 1 ? 26 : 18;   // จอแคบ (มือถือ) ถอยกล้องออกให้เห็นครบทุกด่าน
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(el);
  resize();

  const pointer = new THREE.Vector2(10, 10);
  const parallax = { x: 0, y: 0 };
  const raycaster = new THREE.Raycaster();

  function updatePointer(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    parallax.x = pointer.x;
    parallax.y = pointer.y;
  }
  function pick(): number | null {
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(platforms)[0];
    return hit ? (hit.object.userData.index as number) : null;
  }
  function onMove(e: PointerEvent) {
    updatePointer(e);
    hovered.value = pick();
    renderer.domElement.style.cursor = hovered.value === null ? "grab" : "pointer";
  }
  function onClick(e: PointerEvent) {
    updatePointer(e);
    const index = pick();
    if (index !== null) router.go(withBase(stages[index]!.link));
  }
  function onLeave() {
    hovered.value = null;
    parallax.x = 0;
    parallax.y = 0;
  }
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("pointerup", onClick);
  renderer.domElement.addEventListener("pointerleave", onLeave);

  // ---- วาดเฉพาะตอนอยู่ในจอ ----
  let visible = true;
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  });
  visibility.observe(el);

  const startedAt = performance.now();
  let frame = 0;
  const trail: import("three").Vector3[] = [];
  const scaleTarget = new THREE.Vector3();

  function render(t: number) {
    const orbit = t * 0.08;
    camera.position.set(Math.cos(orbit) * distance + parallax.x * 2, 4.5 + parallax.y * 1.5, Math.sin(orbit) * distance);
    camera.lookAt(0, 1.4, 0);

    const progress = (t * 0.06) % 1;
    const pos = curve.getPointAt(progress);
    bit.position.copy(pos);
    trail.unshift(pos.clone());
    if (trail.length > trailCount) trail.pop();
    trail.forEach((p, i) => trailPositions.set([p.x, p.y, p.z], i * 3));
    trailGeometry.attributes.position!.needsUpdate = true;
    trailGeometry.setDrawRange(0, trail.length);

    platforms.forEach((platform, i) => {
      const active = hovered.value === i;
      const target = active ? 1.25 : 1;
      platform.scale.lerp(scaleTarget.setScalar(target), 0.15);
      platform.rotation.y = t * 0.4 + i;
      const material = platform.material as import("three").MeshStandardMaterial;
      const near = Math.abs(progress * (stages.length - 1) - i) < 0.5;   // บิตกำลังผ่านด่านนี้
      material.emissiveIntensity = active || near ? 0.9 : 0.35;
    });

    globe.rotation.y = t * 0.25;
    globe.rotation.x = Math.sin(t * 0.3) * 0.2;
    stars.rotation.y = t * 0.01;

    renderer.render(scene, camera);
  }

  if (reducedMotion) {
    render(6); // ภาพนิ่ง 1 เฟรม สำหรับคนที่ตั้งให้ลดการเคลื่อนไหว
  } else {
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (visible) render((performance.now() - startedAt) / 1000);
    };
    loop();
  }

  cleanup = () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibility.disconnect();
    renderer.domElement.removeEventListener("pointermove", onMove);
    renderer.domElement.removeEventListener("pointerup", onClick);
    renderer.domElement.removeEventListener("pointerleave", onLeave);
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };
});

onBeforeUnmount(() => cleanup?.());
</script>

<template>
  <section class="journey3d" aria-label="แผนที่การเดินทาง 3 มิติ จาก Basic 0 ถึง Deploy">
    <div ref="container" class="journey3d__canvas" />
    <div class="journey3d__overlay">
      <p class="journey3d__eyebrow">จาก Basic 0 → ระบบจริงบนโดเมนจริง</p>
      <p class="journey3d__hint">
        {{ hovered === null ? "แตะหรือคลิกที่ด่านเพื่อเปิดบทนั้น" : `${stages[hovered]!.title} · ${stages[hovered]!.label}` }}
      </p>
    </div>
    <p class="journey3d__credit">3D นี้สร้างโดย 🧑‍💻 Dev ของ Blicktech + 🤖 Claude Code</p>
    <p v-if="failed" class="journey3d__fallback">เครื่องนี้แสดงภาพ 3 มิติไม่ได้ ใช้สารบัญด้านล่างแทนได้เลย</p>
  </section>
</template>

<style scoped>
.journey3d {
  position: relative;
  margin: 16px 0 32px;
  height: clamp(400px, 58vw, 520px);
  border-radius: 16px;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 30%, #12306e 0%, #0a1a3f 60%, #050d22 100%);
}
.journey3d__canvas {
  position: absolute;
  inset: 0;
}
.journey3d__canvas :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  display: block;
  cursor: grab;
  touch-action: pan-y;
}
.journey3d__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px 20px 40px;
  background: linear-gradient(to bottom, rgba(5, 13, 34, 0.85), rgba(5, 13, 34, 0));
  pointer-events: none;
}
.journey3d__eyebrow {
  margin: 0;
  color: #ffffff;
  font-weight: 700;
  font-size: clamp(16px, 3.2vw, 22px);
  line-height: 1.4;
}
.journey3d__hint {
  margin: 4px 0 0;
  color: #9ec0ff;
  font-size: 14px;
  line-height: 1.5;
}
.journey3d__credit {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0;
  padding: 32px 20px 12px;
  background: linear-gradient(to top, rgba(5, 13, 34, 0.85), rgba(5, 13, 34, 0));
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  line-height: 1.5;
  pointer-events: none;
}
.journey3d__fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: 24px;
  color: #ffffff;
  text-align: center;
}
</style>
