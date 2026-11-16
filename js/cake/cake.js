import { burst } from "../confetti.js";
import { play, playBirthdaySong } from "../sound.js";
import { startFireworks } from "./fireworks.js";

const CANDLE_COUNT = 19;
const COUNTDOWN_STEPS = [
  { number: 3, text: "Бэлэн үү?" },
  { number: 2, text: "Хүслээ бодоорой..." },
  { number: 1, text: "Хоёулаа зэрэг үлээгээрэй!" },
];
const STEP_MS = 1100,
  CELEBRATION_MS = 7200;
// 19 candles sit in two staggered arcs across the upper tier.
const RINGS = [
  [13, 86, 12],
  [6, 40, 6],
];

function candleLayout() {
  const spots = RINGS.flatMap(([count, rx, ry], ring) =>
    Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + (ring ? 0.7 : 0.26);   // inner ring is staggered between outer candles
      return { x: Math.cos(a) * rx, y: Math.sin(a) * ry };
    }));
  return spots.sort((a, b) => a.y - b.y);   // back candles first so front ones overlap them
}

/** Self-contained cake screen. phase: idle → counting → celebrating → done. Calls onComplete once. */
export function createCake(root, { onComplete, greeting = "Happy birthday" }) {
  let lit,
    phase,
    timers = [],
    listeners = null,
    stopFireworks = null;

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  function render() {
    clearTimers();
    stopFireworks?.();
    stopFireworks = null;
    listeners?.abort();
    listeners = new AbortController();
    phase = "idle";
    lit = CANDLE_COUNT;
    const candles = candleLayout()
      .map(
        (s, i) =>
          `<button class="candle" style="--x:${s.x.toFixed(1)}px;--y:${s.y.toFixed(1)}px;--i:${i}" aria-label="Лаа ${i + 1}"><span class="flame"></span></button>`,
      )
      .join("");
    root.innerHTML = `<h2 tabindex="-1">Хүслээ бодоод лаагаа үлээгээрэй</h2>
      <div class="cake-stage"><div class="cake" role="img" aria-label="Гурван давхар төрсөн өдрийн бялуу">
        <div class="layer top"><div class="candles">${candles}</div></div><div class="layer mid"></div><div class="layer base"></div><div class="plate"></div></div>
        <div class="cake-greeting"></div><div class="countdown" aria-hidden="true"></div></div>
      <p class="status" aria-live="polite">Лаа бүр дээр товшиж эсвэл доорх товчийг дар.</p>
      <button class="btn" id="blow-btn">Үлээх 💨</button>`;
    root.addEventListener("click", onClick, { signal: listeners.signal });
  }

  function onClick(event) {
    const candle = event.target.closest(".candle");
    if (candle) blowOutOne(candle);
    else if (event.target.closest("#blow-btn")) startCountdown();
  }

  function blowOutOne(candle) {
    if (
      candle.classList.contains("out") ||
      (phase !== "idle" && phase !== "counting")
    )
      return;
    candle.classList.add("out");
    play("pop");
    if (--lit === 0) celebrate();
  }

  function startCountdown() {
    if (phase !== "idle") return; // ignore repeated clicks
    if (lit === 0) {
      celebrate();
      return;
    }
    phase = "counting";
    root.querySelector("#blow-btn").disabled = true;
    COUNTDOWN_STEPS.forEach((step, i) =>
      later(() => showStep(step), i * STEP_MS),
    );
    later(blowOutAllRemaining, COUNTDOWN_STEPS.length * STEP_MS);
  }

  function showStep({ number, text }) {
    const counter = root.querySelector(".countdown");
    counter.textContent = number;
    play("tick");
    counter.classList.remove("tick");
    void counter.offsetWidth;
    counter.classList.add("tick");
    root.querySelector(".status").textContent = text;
  }

  function blowOutAllRemaining() {
    // all at the same instant
    root
      .querySelectorAll(".candle:not(.out)")
      .forEach((candle) => candle.classList.add("out"));
    lit = 0;
    celebrate();
  }

  function celebrate() {
    clearTimers(); // cancels a countdown still in progress
    phase = "celebrating";
    root.querySelector(".countdown").textContent = "";
    root.querySelector(".status").textContent =
      "Хүсэл чинь биелэх болтугай! ✨";
    root.querySelector("#blow-btn").disabled = true;
    const greetingEl = root.querySelector(".cake-greeting");
    greetingEl.textContent = `${greeting} 🎂`;
    greetingEl.classList.add("show");
    burst(root.querySelector(".cake-stage"), 36);
    stopFireworks = startFireworks(root);
    playBirthdaySong();
    later(() => {
      phase = "done";
      onComplete();
    }, CELEBRATION_MS);
    later(() => {
      stopFireworks?.();
      stopFireworks = null;
    }, CELEBRATION_MS + 800);
  }

  function destroy() {
    clearTimers();
    stopFireworks?.();
    listeners?.abort();
    listeners = null;
    root.innerHTML = "";
  }

  render();
  return { reset: render, destroy };
}
