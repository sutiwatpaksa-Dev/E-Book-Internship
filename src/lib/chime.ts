// เสียงแจ้งเตือนสั้นๆ สร้างด้วย Web Audio (ไม่มีไฟล์เสียงให้โหลด) · เปิด/ปิดได้ จำไว้ในเบราว์เซอร์
// เบราว์เซอร์ห้ามเล่นเสียงจนกว่าผู้ใช้จะกดอะไรบนหน้าสักครั้ง: เราสร้าง AudioContext ตอนกดครั้งแรก
// ถ้ายังไม่เคยกดเลย เสียงจะเงียบไปเอง (ไม่ error) ส่วนตัวเลขและ toast ยังขึ้นตามปกติ

const KEY = "notify.sound";
const listeners = new Set<() => void>();
let ctx: AudioContext | undefined;

function audio() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return undefined;
  ctx ??= new AudioContext();
  return ctx;
}

// ปลดล็อกเสียงตอนผู้ใช้กดครั้งแรก (ต้องเกิดใน event ของผู้ใช้ เบราว์เซอร์ถึงยอม)
if (typeof window !== "undefined") {
  const unlock = () => {
    audio()?.resume().catch(() => {});
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

// ค่าเริ่มต้นเปิดเสียง · localStorage ใช้ไม่ได้ (โหมดส่วนตัว) ก็ถือว่าเปิดและไม่จำ
export function soundOn() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((l) => l());
}

export function subscribeSound(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// สองโน้ตขึ้น (E6 → A6) ดังเบาๆ 0.35 วินาที: ได้ยินชัดแต่ไม่ตกใจ
// ยังถูกล็อกอยู่: ลอง resume ก่อน (สำเร็จเฉพาะตอนเรียกจากการกดของผู้ใช้ เช่นปุ่มเปิดเสียง) ไม่สำเร็จก็เงียบไป
export function playChime(force = false) {
  if (!force && !soundOn()) return;
  const a = audio();
  if (!a) return;
  if (a.state === "running") beep(a);
  else
    a.resume()
      .then(() => a.state === "running" && beep(a))
      .catch(() => {});
}

function beep(a: AudioContext) {
  const t = a.currentTime;
  [1318.5, 1760].forEach((freq, i) => {
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = t + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
    osc.connect(gain).connect(a.destination);
    osc.start(start);
    osc.stop(start + 0.26);
  });
}
