// Professional mode: the switch in the top left swaps the playful console
// site for a plain, recruiter-friendly page (the .pro block in index.html).
// The choice is kept in localStorage; the tiny script in <head> reads it back
// before the first paint. Other scripts check isPro() to pause themselves
// (the pet, the cursor trail, the console's sprite) and listen for the
// "mode:change" event.

import { PROJECTS } from "./projects-data.js";
import { LOGOS } from "./pro-logos.js";

const root = document.documentElement;
const toggle = document.getElementById("mode-toggle");

export const isPro = () => root.dataset.mode === "pro";

function setMode(pro) {
  if (pro) root.dataset.mode = "pro";
  else delete root.dataset.mode;
  toggle.setAttribute("aria-checked", String(pro));
  try { localStorage.setItem("mode", pro ? "pro" : "fun"); } catch (e) { /* private window: just don't remember */ }
  // both modes start from the top: the playful one at the console, the
  // professional one at its header
  scrollTo(0, 0);
  dispatchEvent(new CustomEvent("mode:change", { detail: { pro } }));
}

toggle.setAttribute("aria-checked", String(isPro()));
toggle.addEventListener("click", () => setMode(!isPro()));

// ---------- projects ----------
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const arrow = `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

document.getElementById("pro-project-list").innerHTML = PROJECTS.map((p) => `
  <li class="pro-card">
    <div class="pro-card__head">
      <span class="pro-card__logo">${LOGOS[p.id]}</span>
      <h3 class="pro-card__name">${esc(p.name)}</h3>
    </div>
    <p class="pro-card__text">${esc(p.summary)}</p>
    <ul class="pro-tags" aria-label="Tech stack">${p.tech.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
    ${p.repo
      ? `<a class="pro-card__link" href="${p.repo}" target="_blank" rel="noopener noreferrer">GitHub ${arrow}<span class="sr-only"> (opens in a new tab)</span></a>`
      : `<span class="pro-card__link is-off">Private repo &middot; hackathon build</span>`}
  </li>`).join("");

// ---------- the side nav follows the section you're reading ----------
const links = [...document.querySelectorAll(".pro-nav a")];
const sections = links.map((a) => document.querySelector(a.getAttribute("href")));
function markNav() {
  if (!isPro()) return;
  // the last section whose top has passed a line 30% down the window
  const line = innerHeight * 0.3;
  let on = 0;
  sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) on = i; });
  // at the very bottom the last (short) section counts as current
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) on = sections.length - 1;
  links.forEach((a, i) => a.toggleAttribute("aria-current", i === on));
}
let queued = false;
addEventListener("scroll", () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; markNav(); });
}, { passive: true });
addEventListener("mode:change", markNav);
markNav();
