// ------------------------------------------------------------
// The pet: a little ghost that lives on top of whatever is on screen.
//
//   start page        -> runs along the top of the console and jumps
//                        up into the heading, knocking the letters, for
//                        2 seconds; then sits in a corner of the console
//                        for 4 seconds, and round again
//   window stack      -> hops from one window preview to another,
//                        behind them
//   a window is open  -> runs along its title bar and waves
//   anything else     -> falls to the bottom of the screen, runs to
//                        the nearest corner and sits
//
// assets/pet-sheet.png has one row per animation (frames left to
// right, each FW x FH pixels). It is built by tools/pet/build.py.
// The art faces left; running right just mirrors it.
// ------------------------------------------------------------

const SHEET = "assets/pet-sheet.png";
const FW = 76;
const FH = 72;
const COLS = 5; // widest row of the sheet
// row in the sheet + how long each frame shows (ms)
const ANIMS = {
  idle: { row: 0, ms: [420, 420, 420, 420, 140] },
  run: { row: 1, ms: [90, 90, 90, 90] },
  jump: { row: 2, ms: [110, 90, 160, 120, 110] }, // crouch, take-off, top, coming down, land
  wave: { row: 3, ms: [140, 140, 140, 140] },
  fall: { row: 4, ms: [110, 110] },
  sit: { row: 5, ms: [520, 520, 520, 520, 160] },
};
const TOP_ROW = 15; // first row of the art inside a frame (tip of the horns)

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Size: whole device pixels per art pixel, so the pixels stay crisp
// (1.5x on a retina screen = exactly 3 device pixels per art pixel).
const dpr = window.devicePixelRatio || 1;
const SCALE = Math.max(1, Math.floor(1.5 * dpr)) / dpr;
const W = FW * SCALE;
const H = FH * SCALE;
const GRAVITY = 2400 * SCALE; // px / s²
const RUN = 200 * SCALE;      // px / s

// ---------- the element ----------
const el = document.createElement("div");
el.className = "pet";
el.setAttribute("aria-hidden", "true");
el.style.width = `${W}px`;
el.style.height = `${H}px`;
el.style.backgroundImage = `url(${SHEET})`;
el.style.backgroundSize = `${COLS * W}px ${6 * H}px`;
document.body.append(el);

// ---------- the places it can stand ----------
const start = document.querySelector(".start");
const stage = document.querySelector(".start__stage");
const consoleEl = document.getElementById("console");
const desktop = document.getElementById("desktop");
const viewer = document.getElementById("viewer");
const letters = [...document.querySelectorAll(".welcome .bouncy span")];

// A surface is a flat top edge: { key, top, left, right } in viewport px.
function edge(key, r, inset = 0) {
  return { key, top: r.top, left: r.left + inset, right: r.right - inset };
}
const floor = () => ({ key: "floor", top: innerHeight, left: 0, right: innerWidth });
function consoleTop() {
  // the console art is 180 "pixels" wide with rounded corners; stay on the flat part
  const r = consoleEl.getBoundingClientRect();
  return edge("console", r, (r.width / 180) * 22);
}
function previewTops() {
  return [...document.querySelectorAll(".pv:not(.is-hidden):not(.is-open)")]
    .map((pv) => edge(`pv-${pv.dataset.win}`, pv.getBoundingClientRect(), 14));
}
function windowTop() {
  const win = viewer.querySelector(".win:not([hidden])");
  return win ? edge("win", win.getBoundingClientRect(), 30) : null;
}
function surfaceByKey(key) {
  if (key === "floor") return floor();
  if (key === "console") return consoleTop();
  if (key === "win") return windowTop();
  return previewTops().find((s) => s.key === key) || null;
}

// Which part of the site is on screen right now?
function context() {
  const s = start.getBoundingClientRect();
  const p = -s.top / (s.height - innerHeight); // how far through the explode scroll
  if (s.bottom > innerHeight * 0.5 && p < 0.2) return "console";
  // the desktop counts once it fills the window and isn't hidden mid-transition
  const atDesktop = document.body.classList.contains("in-screen") ||
    (desktop.getBoundingClientRect().top <= 1 && desktop.style.visibility !== "hidden");
  if (atDesktop) {
    if (viewer.classList.contains("has-open") && windowTop()) return "win";
    if (previewTops().length) return "stack";
  }
  return "floor";
}

// Move the element into the right layer: under the heading on the start
// page, behind the previews on the desktop, above an open window.
function layer(ctx) {
  const parent = ctx === "console" ? stage : ctx === "floor" ? document.body : desktop;
  if (el.parentElement !== parent) parent.append(el);
  el.dataset.layer = ctx;
}

// ---------- animation player ----------
let anim = "idle";
let frame = 0;
let frameT = 0;
let hold = false; // true: frame is set by hand (jumping), don't advance
function play(name) {
  if (anim === name && !hold) return;
  anim = name; frame = 0; frameT = 0; hold = false;
}
function pose(name, f) {
  anim = name; frame = f; hold = true;
}
function animate(dt) {
  if (hold) return;
  frameT += dt * 1000;
  const ms = ANIMS[anim].ms;
  while (frameT >= ms[frame]) {
    frameT -= ms[frame];
    frame = (frame + 1) % ms.length;
  }
}

// ---------- state ----------
// mode: "ground" (standing on `on`), "air" (falling / hopping straight up),
//       "crouch" (about to jump along an arc), "arc" (jumping to `goal`)
const pet = {
  x: innerWidth - 60, y: innerHeight, vx: 0, vy: 0,
  mode: "air", on: null, relX: 0, face: -1,
  task: null, timer: 0,
  arc: null,
};
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function standOn(s) {
  pet.mode = "ground";
  pet.on = s.key;
  pet.relX = pet.x - s.left;
  pet.y = s.top;
  pet.vx = pet.vy = 0;
  pet.task = null;
  pose("jump", 4); // landing squash
  pet.timer = 0.12;
}

// jump along an arc to a spot on surface `key` (relX = spot from its left edge)
function jumpTo(key, relX) {
  pet.mode = "crouch";
  pet.timer = 0.11;
  pet.arc = { key, relX, x0: 0, y0: 0, t: 0, T: 0 };
  pet.on = null;
  pose("jump", 0);
}

// drop straight down (vx keeps any run speed)
function fall() {
  pet.mode = "air";
  pet.on = null;
  pet.vy = Math.max(pet.vy, 0);
}

// ---------- behaviours ----------
// Each one picks the next task when the pet is standing with nothing to do.
function goalSurface(ctx) {
  if (ctx === "console") return consoleTop();
  if (ctx === "win") return windowTop();
  if (ctx === "floor") return floor();
  return null; // stack: any preview
}

function onRightSurface(ctx) {
  if (ctx === "stack") return pet.on?.startsWith("pv-");
  return pet.on === ctx;
}

// head box, for knocking letters
function headBox() {
  const top = pet.y - (FH - TOP_ROW) * SCALE;
  return { left: pet.x - 18 * SCALE, right: pet.x + 18 * SCALE, top, bottom: top + 22 * SCALE };
}
function knockLetters() {
  const h = headBox();
  for (const s of letters) {
    const r = s.getBoundingClientRect();
    if (r.right < h.left || r.left > h.right || r.bottom < h.top || r.top > h.bottom) continue;
    if (s.classList.contains("pop")) continue;
    s.classList.add("pop");
    setTimeout(() => s.classList.remove("pop"), 320);
  }
}

function nextTask(ctx, s) {
  if (ctx === "console") {
    // run under a letter, then hop up into it
    const under = letters.filter((l) => {
      const r = l.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      return l.textContent.trim() && cx > s.left && cx < s.right;
    });
    const target = under.length ? pick(under) : null;
    const x = target
      ? target.getBoundingClientRect().left + target.getBoundingClientRect().width / 2
      : rand(s.left, s.right);
    return { kind: "run", x, then: target ? { kind: "hop", letter: target } : { kind: "idle", t: rand(0.8, 2) } };
  }
  if (ctx === "win") {
    return pick([
      { kind: "run", x: rand(s.left, s.right), then: { kind: "wave", t: rand(1.6, 3) } },
      { kind: "wave", t: rand(1.6, 3) },
    ]);
  }
  if (ctx === "stack") {
    const others = previewTops().filter((p) => p.key !== pet.on);
    if (!others.length || Math.random() < 0.25) return { kind: "idle", t: rand(0.8, 1.6) };
    const to = pick(others);
    // run to the end of this window nearest the next one, then jump
    const x = to.left + (to.right - to.left) / 2 < pet.x ? s.left + 10 : s.right - 10;
    return { kind: "idle", t: rand(0.5, 1.4), then: { kind: "run", x, then: { kind: "leap", key: to.key } } };
  }
  // floor: run to the nearest corner, then sit
  const x = pet.x < innerWidth / 2 ? W / 2 + 6 : innerWidth - W / 2 - 6;
  return { kind: "run", x, then: { kind: "sit" } };
}

// Start page rhythm: mess with the letters for PLAY seconds, then sit in a
// corner of the console for REST seconds, and repeat.
const PLAY = 2;
const REST = 4;
let playLeft = PLAY;

function groundStep(dt, ctx, s) {
  pet.y = s.top;
  pet.x = s.left + pet.relX;
  if (pet.timer > 0) { pet.timer -= dt; if (pet.timer > 0) return; }
  if (ctx === "console" && playLeft <= 0 && !pet.task?.rest) {
    // play time is up: run to the nearer corner, sit, then play again
    const corner = pet.x - s.left < s.right - pet.x ? s.left : s.right;
    pet.task = { kind: "run", x: corner, rest: true,
      then: { kind: "sit", t: REST, rest: true, then: { kind: "resume", rest: true } } };
  }
  if (!pet.task) pet.task = nextTask(ctx, s);
  const t = pet.task;
  const next = () => { pet.task = t.then || null; pet.timer = 0; };

  if (t.kind === "idle" || t.kind === "wave") {
    play(t.kind);
    t.t -= dt;
    if (t.t <= 0) next();
  } else if (t.kind === "sit") {
    play("sit");
    if (t.t !== undefined) { t.t -= dt; if (t.t <= 0) next(); }
  } else if (t.kind === "resume") {
    playLeft = PLAY;
    next();
  } else if (t.kind === "run") {
    const goal = Math.min(s.right, Math.max(s.left, t.x));
    const d = goal - pet.x;
    if (Math.abs(d) < 3) { next(); play("idle"); return; }
    pet.face = Math.sign(d);
    play("run");
    pet.x += Math.sign(d) * Math.min(Math.abs(d), RUN * dt);
  } else if (t.kind === "hop") {
    // straight up, high enough for the head to reach the letter
    const r = t.letter.getBoundingClientRect();
    const rise = Math.max(30, Math.min(320, pet.y - (FH - TOP_ROW) * SCALE - (r.top + r.height * 0.3)));
    pet.task = { kind: "idle", t: rand(0.1, 0.3) }; // straight on to the next letter
    pet.mode = "air";
    pet.vx = 0;
    pet.vy = -Math.sqrt(2 * GRAVITY * rise);
    pose("jump", 1);
    return;
  } else if (t.kind === "leap") {
    const to = surfaceByKey(t.key);
    if (!to) { pet.task = null; return; }
    jumpTo(t.key, rand(10, Math.max(12, to.right - to.left - 10)));
    return;
  }
  pet.relX = pet.x - s.left;
}

function step(dt) {
  const ctx = context();
  layer(ctx);
  if (ctx !== "console") playLeft = PLAY; // a fresh round each time the start page comes back
  else if (playLeft > 0) playLeft -= dt;
  const goal = goalSurface(ctx);

  if (pet.mode === "ground") {
    const s = surfaceByKey(pet.on);
    if (!s || !onRightSurface(ctx)) {
      // the place we stand is gone, or the site moved on: go to the new place
      if (ctx === "floor" || (goal && goal.top > (s ? s.top : pet.y) + 4 && pet.x > goal.left && pet.x < goal.right)) fall();
      else if (ctx === "stack") { const p = pick(previewTops()); jumpTo(p.key, rand(10, Math.max(12, p.right - p.left - 10))); }
      else jumpTo(goal.key, rand(10, Math.max(12, goal.right - goal.left - 10)));
    } else {
      groundStep(dt, ctx, s);
    }
  }

  if (pet.mode === "crouch") {
    pet.timer -= dt;
    if (pet.timer <= 0) {
      const to = surfaceByKey(pet.arc.key);
      if (!to) { fall(); }
      else {
        const x1 = to.left + pet.arc.relX;
        const dist = Math.hypot(x1 - pet.x, to.top - pet.y);
        Object.assign(pet.arc, { x0: pet.x, y0: pet.y, t: 0, T: Math.min(0.95, Math.max(0.45, 0.35 + dist / 1400)) });
        pet.face = x1 > pet.x ? 1 : x1 < pet.x ? -1 : pet.face;
        pet.mode = "arc";
      }
    }
  }

  if (pet.mode === "arc") {
    const a = pet.arc;
    const to = surfaceByKey(a.key);
    if (!to) { fall(); }
    else {
      a.t += dt;
      const u = Math.min(1, a.t / a.T);
      const x1 = to.left + a.relX;
      const y1 = to.top;
      // a parabola that peaks ~50px above the higher of the two ends
      const peak = Math.max(0, a.y0 - y1) + 50 * SCALE;
      pet.x = a.x0 + (x1 - a.x0) * u;
      pet.y = a.y0 + (y1 - a.y0) * u - 4 * peak * u * (1 - u) * (y1 < a.y0 ? 1 : 0.6);
      pose("jump", u < 0.2 ? 1 : u < 0.6 ? 2 : 3);
      if (u >= 1) standOn(to);
    }
  }

  if (pet.mode === "air") {
    const prevY = pet.y;
    pet.vy += GRAVITY * dt;
    pet.x += pet.vx * dt;
    pet.y += pet.vy * dt;
    if (pet.vy < 0) pose("jump", 2);
    else play("fall");
    if (ctx === "console") knockLetters();
    // land on the surface for this part of the site (or the floor)
    const targets = [goal, floor()].filter(Boolean);
    if (ctx === "stack") targets.unshift(...previewTops());
    for (const s of targets) {
      if (pet.vy >= 0 && prevY <= s.top + 2 && pet.y >= s.top && pet.x >= s.left && pet.x <= s.right) {
        pet.y = s.top;
        standOn(s);
        break;
      }
    }
    if (pet.mode === "air" && pet.y > innerHeight) { pet.y = innerHeight; standOn(floor()); }
  }
}

// ---------- draw ----------
function draw() {
  const a = ANIMS[anim];
  el.style.backgroundPosition = `${-frame * W}px ${-a.row * H}px`;
  // the art faces left; mirror it when heading right
  el.style.transform = `translate(${Math.round(pet.x - W / 2)}px, ${Math.round(pet.y - H + SCALE)}px) scaleX(${pet.face > 0 ? -1 : 1})`;
}

if (reducedMotion) {
  // no running about: it just sits in the corner
  pet.x = innerWidth - W / 2 - 6; pet.y = innerHeight;
  pose("sit", 0);
  draw();
  addEventListener("resize", () => { pet.x = innerWidth - W / 2 - 6; pet.y = innerHeight; draw(); });
} else {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); // a background tab can pause for ages
    last = now;
    // professional mode hides the pet; keep it paused until it comes back
    if (document.documentElement.dataset.mode === "pro") { requestAnimationFrame(loop); return; }
    step(dt);
    animate(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
