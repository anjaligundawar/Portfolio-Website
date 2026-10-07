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

// ---------- 5. scrolling: explode, then zoom into the screen ----------
// One scroll value p (0..1) drives the whole trip into the console:
//   0.00-0.40  the character and the "Lets Start" lettering blow apart
//   0.25-0.90  the console zooms in until its screen fills the window
//   0.82-1.00  the windows desktop fades in "inside" the screen
// Scrolling back up plays the same thing in reverse.
const stage = document.querySelector(".start");
const stageInner = document.querySelector(".start__stage");
const welcome = document.querySelector(".welcome");
const box = document.getElementById("portrait-box");
const hint = document.querySelector(".scroll-hint");
const desktop = document.getElementById("desktop");
const pet = document.getElementById("pet");
const fx = new Explosion(document.getElementById("ascii-canvas"), { reducedMotion });
const fxText = new Explosion(document.getElementById("letters-canvas"), { reducedMotion, color: token("pink") });

// the lettering as a grid of characters (every row the same length)
const letterRows = letsStart.textContent.split("\n");
const letterCols = Math.max(...letterRows.map((r) => r.length));
fxText.setAscii(letterRows.map((r) => r.padEnd(letterCols)));

let zoom = { x: 0, y: 0, dx: 0, dy: 0, s: 1 };

function layout() {
  // Same size rule as before: up to 980px wide, 94% of a phone's width,
  // and short enough to fit under the heading.
  const availW = Math.min(window.innerWidth * (window.innerWidth <= 640 ? 0.96 : 0.94), 980);
  const availH = (window.innerHeight - welcome.offsetHeight - 80) * (CONSOLE_W / CONSOLE_H);
  const size = Math.min(availW, availH) / CONSOLE_W;
  consoleEl.style.setProperty("--px", `${size}px`);

  fx.resize();
  fxText.resize();
  fx.setImageData(frames[SEQUENCE[step][0]]);

  // size the ASCII "Lets Start" to fit its column (width and height)
  const menu = letsStart.parentElement;
  const lineCount = letsStart.textContent.split("\n").length;
  const fitW = (menu.clientWidth * 0.9) / (ASCII_COLS * 0.6);
  const fitH = (menu.clientHeight * 0.62) / lineCount;
  letsStart.style.fontSize = `${Math.min(fitW, fitH)}px`;

  // park the (future) pet just above the console's top-left corner
  const c = consoleEl.getBoundingClientRect();
  const s = consoleEl.parentElement.getBoundingClientRect();
  pet.style.left = `${c.left - s.left + c.width * 0.02}px`;
  pet.style.top = `${c.top - s.top - 80}px`;

  // Work out the zoom: how far to move and scale the stage so the screen
  // ends up centred and just covering the window. Measure it un-zoomed.
  stageInner.style.transform = "";
  const st = stageInner.getBoundingClientRect();
  const sc = screenEl.getBoundingClientRect();
  zoom = {
    x: sc.left + sc.width / 2 - st.left,          // screen centre inside the stage
    y: sc.top + sc.height / 2 - st.top,
    dx: innerWidth / 2 - (sc.left + sc.width / 2), // how far that centre must travel
    dy: innerHeight / 2 - (sc.top + sc.height / 2),
    s: Math.max(innerWidth / sc.width, innerHeight / sc.height) * 1.04,
  };
  stageInner.style.transformOrigin = `${zoom.x}px ${zoom.y}px`;
}

// how far through the start section we've scrolled: 0..1
function progress() {
  const r = stage.getBoundingClientRect();
  const runway = r.height - window.innerHeight;
  return Math.min(1, Math.max(0, -r.top / runway));
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let ticking = false;
let exploding = false;
let inside = false;
function render() {
  ticking = false;
  let p = progress();
  if (p > 0.995) p = 1; // the last pixel of scroll can land a hair short

  // as soon as scrolling starts, stand her still in the first idle pose,
  // so a half-turned frame never gets blown apart
  if (p > 0 && !exploding) { exploding = true; step = 0; fx.setImageData(frames[SEQUENCE[0][0]]); }
  if (p === 0) exploding = false;

  // 1. explosion: character and lettering together. The real lettering
  // hides while its particle copy is on screen.
  const blast = clamp01(p / 0.4);
  fx.render(box.getBoundingClientRect(), blast);
  fxText.render(letsStart.getBoundingClientRect(), p > 0 ? blast : 1);
  letsStart.style.visibility = p > 0 ? "hidden" : "";
  hint.style.opacity = p > 0 ? 1 - blast : "";

  // 2. zoom into the screen. Scale grows exponentially (s^t), which feels
  // like moving forward at a steady speed instead of slowing down.
  const t = ease(clamp01((p - 0.25) / 0.65));
  if (t === 0) {
    stageInner.style.transform = welcome.style.opacity = "";
  } else if (reducedMotion) {
    stageInner.style.opacity = 1 - t;
  } else {
    const s = Math.pow(zoom.s, t);
    stageInner.style.transform = `translate(${zoom.dx * t}px, ${zoom.dy * t}px) scale(${s})`;
    welcome.style.opacity = 1 - clamp01(t * 3);
  }

  // 3. the desktop. It sits right under the start section in the page, so
  // while we're still scrolling it is pulled up to the top of the window
  // (translateY) and grows out of the screen in choppy 8-bit steps.
  const q = Math.round(clamp01((p - 0.82) / 0.18) * 6) / 6;
  const below = Math.max(0, desktop.offsetTop - scrollY);
  desktop.style.visibility = q === 0 ? "hidden" : "";
  desktop.style.opacity = q === 1 ? "" : q;
  desktop.style.transform = q === 1 ? "" : `translateY(${-below}px) scale(${0.86 + q * 0.14})`;

  // tell windows.js when we're inside (it takes over the scroll there)
  if (p === 1 && !inside) { inside = true; document.body.classList.add("in-screen"); dispatchEvent(new Event("screen:enter")); }
  if (p < 1 && inside) { inside = false; document.body.classList.remove("in-screen"); dispatchEvent(new Event("screen:leave")); }
  if (p === 0) dispatchEvent(new Event("screen:home"));
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

// After the last window, windows.js asks to go home: glide the page back to
// the top. render() runs on every scroll, so the zoom and the explosion play
// backwards on their own and she reassembles on the console.
addEventListener("screen:exit", () => {
  const from = scrollY;
  const ms = reducedMotion ? 0 : 1800;
  const t0 = performance.now();
  const glide = (now) => {
    const k = ms ? clamp01((now - t0) / ms) : 1;
    scrollTo(0, from * (1 - ease(k)));
    if (k < 1) requestAnimationFrame(glide);
  };
  requestAnimationFrame(glide);
});

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
