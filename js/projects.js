// Projects window: a fisheye "drum" list of projects. The project in the middle
// of the list is big and flat; the further one is from the middle, the smaller
// it gets and the more it tilts away, like it's printed on a bulging glass
// cylinder. Clicking a project opens a little sub-window with its details.

import { ICONS, PALETTE } from "./project-icons.js";
import { PROJECTS } from "./projects-data.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const win = document.getElementById("projects");
const list = document.getElementById("proj-list");
const rail = document.getElementById("proj-rail");
const thumb = document.getElementById("proj-thumb");
const sub = document.getElementById("proj-sub");

// ---------- 1. pixel icons ----------
// Each icon is a grid of letters (see project-icons.js). Every run of same-colored
// pixels in a row becomes one <rect>, and shape-rendering="crispEdges" keeps the
// edges sharp at any size.
function iconSvg(id) {
  const rects = ICONS[id].map((row, y) => {
    let out = "";
    for (let x = 0; x < row.length; ) {
      const c = row[x];
      let w = 1;
      while (row[x + w] === c) w++;
      if (c !== ".") out += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${PALETTE[c]}"/>`;
      x += w;
    }
    return out;
  });
  return `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true">${rects.join("")}</svg>`;
}

// ---------- 2. build the list ----------
list.innerHTML = PROJECTS.map((p, i) => `
  <li>
    <button class="proj" type="button" data-i="${i}">
      <span class="proj__icon">${iconSvg(p.id)}</span>
      <span class="proj__text">
        <span class="proj__name">${p.name}</span>
        <span class="proj__tech">${p.tech.slice(0, 3).join(" · ")}</span>
      </span>
      <span class="proj__num" aria-hidden="true">0${i + 1}</span>
    </button>
  </li>`).join("");
rail.innerHTML = PROJECTS.map((p, i) =>
  `<button class="rail__notch" type="button" data-i="${i}" aria-label="Scroll to ${p.name}"></button>`).join("");
const items = [...list.querySelectorAll(".proj")];
const notches = [...rail.querySelectorAll(".rail__notch")];

// ---------- 3. the fisheye ----------
// On every scroll, measure how far each item is from the middle of the list
// (d = 0 in the middle, ±1 at the top/bottom edge) and turn that into a scale,
// a tilt and a sideways shift. requestAnimationFrame makes sure we do this at
// most once per frame however many scroll events arrive.
let current = 0;
let queued = false;
function lens() {
  queued = false;
  const box = list.getBoundingClientRect();
  const mid = box.top + box.height / 2;
  let best = Infinity;
  items.forEach((el, i) => {
    const r = el.parentElement.getBoundingClientRect(); // the <li>, which isn't transformed
    const d = Math.max(-1.3, Math.min(1.3, (r.top + r.height / 2 - mid) / (box.height / 2)));
    const a = Math.abs(d);
    el.style.setProperty("--scale", (1.08 - 0.4 * a * a).toFixed(3));
    el.style.setProperty("--tilt", `${(-d * 48).toFixed(1)}deg`);
    el.style.setProperty("--shift", `${(a * a * -26).toFixed(1)}px`); // curve inwards at the ends
    el.style.setProperty("--fade", (1 - 0.55 * a).toFixed(2));
    if (a < best) { best = a; current = i; }
  });
  items.forEach((el, i) => el.classList.toggle("is-centre", i === current));
  notches.forEach((n, i) => n.classList.toggle("is-on", i === current));
  // the scrollbar thumb follows the scroll position
  const max = list.scrollHeight - list.clientHeight;
  thumb.style.setProperty("--pos", max > 0 ? (list.scrollTop / max).toFixed(3) : 0);
}
const queueLens = () => { if (!queued) { queued = true; requestAnimationFrame(lens); } };
list.addEventListener("scroll", queueLens, { passive: true });
addEventListener("resize", queueLens);
// the window starts hidden (no size), so redo the lens whenever it's shown
new ResizeObserver(queueLens).observe(list);

function centre(i, smooth = true) {
  i = Math.max(0, Math.min(items.length - 1, i));
  const li = items[i].parentElement;
  list.scrollTo({
    top: li.offsetTop + li.offsetHeight / 2 - list.clientHeight / 2,
    behavior: smooth && !reducedMotion ? "smooth" : "auto",
  });
  return i;
}
notches.forEach((n) => n.addEventListener("click", () => centre(+n.dataset.i)));
document.getElementById("proj-up").addEventListener("click", () => centre(current - 1));
document.getElementById("proj-down").addEventListener("click", () => centre(current + 1));

// Arrow keys move through the list. stopPropagation keeps windows.js from
// treating them as "go to the next window".
list.addEventListener("keydown", (e) => {
  const dir = { ArrowDown: 1, ArrowUp: -1 }[e.key];
  if (!dir) return;
  e.preventDefault();
  e.stopPropagation();
  const i = centre(current + dir);
  items[i].focus({ preventScroll: true });
});

// ---------- 4. the sub-window ----------
const subIcon = sub.querySelector(".sub__icon");
const subName = sub.querySelector(".sub__name");
const subFile = sub.querySelector(".sub__file");
const subText = sub.querySelector(".sub__summary");
const subTech = sub.querySelector(".sub__tech");
const subLink = sub.querySelector(".sub__link");
let opener = null;

function openSub(i) {
  const p = PROJECTS[i];
  subIcon.innerHTML = iconSvg(p.id);
  subName.textContent = p.name;
  subFile.textContent = `${p.id}.txt`;
  subText.textContent = p.summary;
  subTech.innerHTML = p.tech.map((t) => `<li>${t}</li>`).join("");
  if (p.repo) {
    subLink.innerHTML = `<a class="pixel-btn pixel-btn--magenta" href="${p.repo}" target="_blank" rel="noopener">
      <span class="pixel-btn__ico" aria-hidden="true">&lt;/&gt;</span>View on GitHub</a>
      <span class="sub__url">${p.repo.replace("https://", "")}</span>`;
  } else {
    subLink.innerHTML = `<span class="sub__private"><span aria-hidden="true">&#9673;</span> private repo (hackathon submission)</span>`;
  }
  opener = items[i];
  sub.hidden = false;
  win.toggleAttribute("data-locked", true); // tells windows.js not to switch windows
  sub.classList.remove("is-in");
  sub.offsetWidth; // restart the pop-in animation
  sub.classList.add("is-in");
  sub.querySelector(".sub__close").focus({ preventScroll: true });
}

function closeSub() {
  if (sub.hidden) return;
  sub.hidden = true;
  win.removeAttribute("data-locked");
  opener?.focus({ preventScroll: true });
}

items.forEach((el, i) => el.addEventListener("click", () => {
  if (i !== current) centre(i);
  openSub(i);
}));
sub.querySelector(".sub__close").addEventListener("click", closeSub);
sub.querySelector(".sub__backdrop").addEventListener("click", closeSub);
// Esc closes the sub-window first. A "capture" listener on window runs before
// the one in windows.js, so we can stop it from closing the whole window too.
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !sub.hidden) {
    e.stopImmediatePropagation();
    closeSub();
  }
}, true);
// closing the Projects window also closes its sub-window
win.querySelector(".win__close").addEventListener("click", closeSub);
// and so does switching to professional mode (js/pro.js)
addEventListener("mode:change", closeSub);
