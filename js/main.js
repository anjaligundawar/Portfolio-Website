import { textToAscii } from "./ascii.js";
import { Explosion } from "./explode.js";
import { drawConsole, drawCap, BUTTONS, SCREEN, W as CONSOLE_W, H as CONSOLE_H } from "./console.js";
import { loadFrames, SEQUENCE } from "./sprite.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const css = getComputedStyle(document.documentElement);
const token = (name) => css.getPropertyValue(`--${name}`).trim();

// ---------- 1. bouncy heading: one <span> per letter ----------
document.querySelectorAll(".bouncy").forEach((el) => {
  [...el.dataset.text].forEach((ch, i) => {
    const s = document.createElement("span");
    s.textContent = ch === " " ? " " : ch;
    s.style.setProperty("--i", i);
    // hover / tap makes the letter jump, then it settles back into the wave
    const pop = () => {
      s.classList.add("pop");
      setTimeout(() => s.classList.remove("pop"), 320);
    };
    s.addEventListener("pointerenter", pop);
    s.addEventListener("pointerdown", pop);
    el.append(s);
  });
  el.setAttribute("aria-label", el.dataset.text);
});

// ---------- 2. the pixel-art console ----------
const consoleEl = document.getElementById("console");
drawConsole(document.getElementById("console-art"));
// place the HTML screen over the painted glass, in art-pixel units
const screenEl = document.getElementById("screen");
screenEl.style.left = `calc(var(--px) * ${SCREEN.x})`;
screenEl.style.top = `calc(var(--px) * ${SCREEN.y})`;
screenEl.style.width = `calc(var(--px) * ${SCREEN.w})`;
screenEl.style.height = `calc(var(--px) * ${SCREEN.h})`;

// ---------- 3. pressable buttons (purely for fun) ----------
const buttonLayer = document.getElementById("buttons");
for (const b of BUTTONS) {
  const cap = document.createElement("canvas");
  cap.className = "btn";
  drawCap(cap, b);
  cap.style.left = `calc(var(--px) * ${b.x})`;
  cap.style.top = `calc(var(--px) * ${b.y})`;
  cap.style.width = `calc(var(--px) * ${b.w})`;
  cap.style.height = `calc(var(--px) * ${b.h})`;
  pressable(cap, b.kind === "stick");
  buttonLayer.append(cap);
}

function pressable(el, isStick) {
  const release = () => {
    el.classList.remove("is-down");
    el.style.removeProperty("--dx");
    el.style.removeProperty("--dy");
  };
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId); // keep getting moves even off the button
    el.classList.add("is-down");
  });
  if (isStick) {
    // a held stick leans up to 2 art pixels towards the pointer
    el.addEventListener("pointermove", (e) => {
      if (!el.classList.contains("is-down")) return;
      const r = el.getBoundingClientRect();
      const px = r.width / 14;
      const lean = (d) => Math.max(-2, Math.min(2, Math.round(d / (px * 3))));
      el.style.setProperty("--dx", `${lean(e.clientX - (r.left + r.width / 2)) * px}px`);
      el.style.setProperty("--dy", `${lean(e.clientY - (r.top + r.height / 2)) * px - px}px`);
    });
  }
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
}

// ---------- 3b. Anjali's game character (sprite sheet) ----------
const frames = await loadFrames();
let step = 0; // position in SEQUENCE

// ---------- 4. "Lets Start" as cursive ASCII lettering ----------
// Draw each word in a script font on a hidden canvas, then run it
// through the image -> ASCII converter in ascii.js.
const letsStart = document.getElementById("lets-start");
await document.fonts.load('120px "Pacifico"');
const ASCII_COLS = 64;
const lettering = (word) => textToAscii(word, '120px "Pacifico"', ASCII_COLS, { weight: 9 });
letsStart.textContent = lettering("Lets") + "\n\n" + lettering("Start");

// ---------- 5. the explosion ----------
const stage = document.querySelector(".start");
const welcome = document.querySelector(".welcome");
const box = document.getElementById("portrait-box");
const fx = new Explosion(document.getElementById("ascii-canvas"), { reducedMotion });

function layout() {
  // Same size rule as before: up to 980px wide, 94% of a phone's width,
  // and short enough to fit under the heading.
  const availW = Math.min(window.innerWidth * (window.innerWidth <= 640 ? 0.96 : 0.94), 980);
  const availH = (window.innerHeight - welcome.offsetHeight - 80) * (CONSOLE_W / CONSOLE_H);
  const size = Math.min(availW, availH) / CONSOLE_W;
  consoleEl.style.setProperty("--px", `${size}px`);

  fx.resize();
  fx.setImageData(frames[SEQUENCE[step][0]]);

  // size the ASCII "Lets Start" to fit its column (width and height)
  const menu = letsStart.parentElement;
  const lineCount = letsStart.textContent.split("\n").length;
  const fitW = (menu.clientWidth * 0.9) / (ASCII_COLS * 0.6);
  const fitH = (menu.clientHeight * 0.62) / lineCount;
  letsStart.style.fontSize = `${Math.min(fitW, fitH)}px`;
}

// how far through the start section we've scrolled: 0..1
function progress() {
  const r = stage.getBoundingClientRect();
  const runway = r.height - window.innerHeight;
  return Math.min(1, Math.max(0, -r.top / runway));
}

let ticking = false;
let exploding = false;
function render() {
  ticking = false;
  const p = progress();
  // as soon as scrolling starts, stand her still in the first idle pose,
  // so a half-turned (paper-thin) frame never gets blown apart
  if (p > 0 && !exploding) { exploding = true; step = 0; fx.setImageData(frames[SEQUENCE[0][0]]); }
  if (p === 0) exploding = false;
  // the particles use most of the runway; the console fades out behind them
  fx.render(box.getBoundingClientRect(), Math.min(1, p / 0.85));
  const fade = Math.min(1, Math.max(0, (p - 0.25) / 0.55));
  // at rest, drop the inline styles entirely so nothing is left half-applied
  const rest = fade === 0;
  consoleEl.style.opacity = rest ? "" : 1 - fade;
  consoleEl.style.transform = rest ? "" : `scale(${1 - fade * 0.15}) translateY(${fade * -4}vh)`;
  welcome.style.opacity = rest ? "" : 1 - fade;
  welcome.style.transform = rest ? "" : `translateY(${fade * -8}vh)`;
}
// Scroll events can fire many times per frame. We only redraw once per
// animation frame (requestAnimationFrame), which keeps it smooth.
function requestFrame() {
  if (!ticking) { ticking = true; requestAnimationFrame(render); }
}

await document.fonts.ready; // heading height depends on the pixel fonts
layout();
render();
addEventListener("scroll", requestFrame, { passive: true });
addEventListener("resize", () => { layout(); requestFrame(); });

// Play the sprite animation: show a frame, wait its time, move on.
// It pauses while the page is scrolled, so the explosion stays steady.
function tick() {
  if (progress() === 0 && !reducedMotion) {
    step = (step + 1) % SEQUENCE.length;
    fx.setImageData(frames[SEQUENCE[step][0]]);
    requestFrame();
  }
  setTimeout(tick, SEQUENCE[step][1]);
}
setTimeout(tick, SEQUENCE[0][1]);
