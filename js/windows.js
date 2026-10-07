// Windows section: a desktop with a messy stack of window previews.
//   arrive               -> previews pop up one by one (1, 2, 3, 4)
//   click / scroll down  -> the front window zooms open to its full view
//   × / Esc / scroll up  -> it zooms back; the next window comes to the front
//   scroll down while open -> zoom out of this one, zoom into the next
//   scroll down on the last window -> leave the console screen, back to the start
//   (also once the last window has been opened and closed again)
// Getting in and out of the console screen itself is done in main.js; it
// sends "screen:enter" / "screen:leave" / "screen:home" events, and we send
// "screen:exit" when it's time to go home.

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktop = document.getElementById("desktop");
const viewer = document.getElementById("viewer");
const previews = Object.fromEntries(
  [...document.querySelectorAll(".pv")].map((pv) => [pv.dataset.win, pv])
);
const ZOOM_MS = reducedMotion ? 0 : 420;
const SHUFFLE_MS = reducedMotion ? 0 : 460;

// order[0] is the front window; the rest follow in the order they come up next
const START_ORDER = ["about", "projects", "socials", "resume"];
let order = [...START_ORDER];
const LAST = "resume"; // scrolling down on this window leaves the console
let openId = null;
let busy = false; // true while a zoom or shuffle is playing
let seenLast = false; // the last window has been opened since we came in

// ---------- 1. menu bar clock ----------
const clock = document.getElementById("clock");
const showTime = () => {
  clock.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
showTime();
setInterval(showTime, 15000);

// ---------- 2. stack layout ----------
// Each preview gets a "slot-N" class; the CSS for that class says where it sits.
// Changing the classes is all it takes to shuffle the stack (CSS animates it).
function placeStack() {
  order.forEach((id, i) => {
    const pv = previews[id];
    pv.classList.remove("slot-0", "slot-1", "slot-2", "slot-3");
    pv.classList.add(`slot-${i}`);
  });
}
placeStack();

// ---------- 3. arrival: previews pop up one by one ----------
// main.js tells us when the zoom into the console screen has finished.
Object.values(previews).forEach((pv) => pv.classList.add("is-hidden"));
let shown = false;
addEventListener("screen:enter", () => {
  if (shown) return;
  shown = true;
  ["about", "projects", "socials", "resume"].forEach((id, i) => {
    setTimeout(() => previews[id].classList.remove("is-hidden"), reducedMotion ? 0 : 150 + i * 220);
  });
});
// back at the start: reset so the pop-up plays again next time
addEventListener("screen:home", () => {
  if (!shown || openId) return;
  shown = false;
  seenLast = false;
  order = [...START_ORDER];
  placeStack();
  Object.values(previews).forEach((pv) => pv.classList.add("is-hidden"));
});

// ---------- 4. zoom open / closed ----------
// "FLIP" animation: put the full window where it really belongs, then use a
// transform to make it look exactly like the small preview, then animate the
// transform away. Animating only a transform is cheap for the browser.
function rectTransform(from, to) {
  return `translate(${from.left - to.left}px, ${from.top - to.top}px)
          scale(${from.width / to.width}, ${from.height / to.height})`;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function openWin(id) {
  if (busy || openId) return;
  busy = true;
  openId = id;
  if (id === LAST) seenLast = true;
  const pv = previews[id];
  const win = document.getElementById(id);
  win.hidden = false;
  viewer.classList.add("has-open");
  markMenu(id);

  const from = pv.getBoundingClientRect();
  const to = win.getBoundingClientRect();
  pv.classList.add("is-open");
  win.style.transition = "none";
  win.style.transform = rectTransform(from, to);
  win.getBoundingClientRect(); // make the browser apply that before animating
  win.style.transition = `transform ${ZOOM_MS}ms steps(7)`; // choppy, 8-bit zoom
  win.style.transform = "";
  await wait(ZOOM_MS);
  win.querySelector(".win__body").scrollTop = 0;
  win.querySelector(".win__close").focus({ preventScroll: true });
  busy = false;
}

// Zoom back into the preview, then send it to the back of the stack so the
// next window comes to the front.
async function closeWin() {
  if (busy || !openId) return;
  busy = true;
  const id = openId;
  const pv = previews[id];
  const win = document.getElementById(id);
  win.style.transition = `transform ${ZOOM_MS}ms steps(7)`;
  win.style.transform = rectTransform(pv.getBoundingClientRect(), win.getBoundingClientRect());
  await wait(ZOOM_MS);
  win.hidden = true;
  win.style.transition = win.style.transform = "";
  pv.classList.remove("is-open");
  viewer.classList.remove("has-open");
  openId = null;
  markMenu(null);

  if (order[0] === id) order.push(order.shift()); // 1 goes to the back, 2 comes forward
  placeStack();
  await wait(SHUFFLE_MS);
  busy = false;
}

// Bring one window to the front (the rest keep their sequence), then open it.
async function showWin(id) {
  if (openId === id || busy) return;
  if (openId) await closeWin();
  if (order[0] !== id) {
    busy = true;
    while (order[0] !== id) order.push(order.shift());
    placeStack();
    await wait(SHUFFLE_MS);
    busy = false;
  }
  openWin(id);
}

async function next() {
  if (openId === LAST || (!openId && seenLast)) {
    // the end: close it (if it's open) and zoom back out of the console screen
    if (openId) await closeWin();
    dispatchEvent(new Event("screen:exit"));
    return;
  }
  if (openId) await closeWin();
  openWin(order[0]);
}

function markMenu(id) {
  document.querySelectorAll(".menubar a").forEach((a) => {
    a.toggleAttribute("aria-current", id !== null && a.getAttribute("href") === `#${id}`);
  });
}

// ---------- 5. clicks ----------
Object.values(previews).forEach((pv) => pv.addEventListener("click", () => showWin(pv.dataset.win)));
document.querySelectorAll(".win__close").forEach((b) => b.addEventListener("click", closeWin));

// links like href="#projects" (menu bar, About Me buttons) open that window
desktop.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  e.preventDefault();
  desktop.scrollIntoView(); // in case the page isn't all the way down yet
  const id = link.getAttribute("href").slice(1);
  if (previews[id]) showWin(id);
  else closeWin(); // the heart logo: back to the desktop
});

// ---------- 6. scrolling, swiping and keys ----------
// Once the desktop fills the screen the page can't scroll any further, so
// "scroll down" means "open the next window" instead.
const atDesktop = () => document.body.classList.contains("in-screen");
const openWinEl = () => (openId ? document.getElementById(openId) : null);
const canScroll = (el, dir) =>
  dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 0;
// A window can hold scrolling boxes inside its body (like the Projects list).
// Walk up from where the pointer is and return the first box that scrolls.
function scrollerAt(target) {
  const win = openWinEl();
  if (!win || !win.contains(target)) return null;
  for (let el = target; el && el !== win; el = el.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 2) return el;
  }
  return null;
}
// a window with a pop-up open inside it (data-locked) keeps scroll from switching windows
const locked = () => openWinEl()?.hasAttribute("data-locked");

function step(dir) {
  if (busy) return;
  if (dir > 0) next();
  else if (openId) closeWin();
}

// A trackpad flick fires dozens of wheel events. Only the first event of a new
// gesture (after a short quiet gap) is allowed to switch windows.
let lastWheel = 0;
addEventListener("wheel", (e) => {
  const now = performance.now();
  const fresh = now - lastWheel > 220;
  lastWheel = now;
  if (!atDesktop()) return; // still on the console: scroll normally
  const dir = Math.sign(e.deltaY);
  // let the window's content scroll; once a list hits its end, carry on to the box around it
  for (let b = scrollerAt(e.target); b; b = scrollerAt(b.parentElement)) {
    if (canScroll(b, dir)) return;
  }
  if (dir < 0 && !openId) return; // scrolling back up to the console
  e.preventDefault();
  if (fresh && !locked()) step(dir);
}, { passive: false });

let touchY = null;
let touchStart = null; // the window content's scroll position when the swipe began
addEventListener("touchstart", (e) => {
  touchY = e.touches[0].clientY;
  const b = scrollerAt(e.target);
  touchStart = b ? { top: b.scrollTop, b } : null;
}, { passive: true });
addEventListener("touchend", (e) => {
  if (touchY === null || !atDesktop()) return;
  const dy = touchY - e.changedTouches[0].clientY; // > 0 = swiped up = "scroll down"
  touchY = null;
  if (Math.abs(dy) < 60 || locked()) return;
  const dir = Math.sign(dy);
  // only switch if the window's content was already at its end when the swipe began
  if (touchStart) {
    const { top, b } = touchStart;
    const wasAtEnd = dir > 0 ? top + b.clientHeight >= b.scrollHeight - 2 : top <= 0;
    if (!wasAtEnd) return;
  }
  step(dir);
}, { passive: true });

addEventListener("keydown", (e) => {
  if (!atDesktop()) return;
  if (e.key === "Escape") return closeWin();
  const dir = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key];
  if (!dir) return;
  if (locked()) return;
  const b = openWinEl()?.querySelector(".win__body");
  if (b && canScroll(b, dir)) return;
  if (dir < 0 && !openId) return;
  e.preventDefault();
  step(dir);
});
