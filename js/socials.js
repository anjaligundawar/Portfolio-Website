// Socials window: three round icon buttons (LinkedIn, GitHub, LeetCode).
// The same pixel icons also fill the little Socials preview on the desktop.
import { PALETTE } from "./project-icons.js";

// href: null = shown but not linked yet
const SOCIALS = [
  { id: "linkedin", name: "LinkedIn", handle: "in/anjali-g", href: "https://www.linkedin.com/in/anjali-g" },
  { id: "github", name: "GitHub", handle: "@anjaligundawar", href: "https://github.com/anjaligundawar" },
  { id: "leetcode", name: "LeetCode", handle: "coming soon", href: null },
];

// 16x16 pixel icons, same letters as the project icons (k = ink, w = soft white,
// p = lilac pink, o = bright violet). '.' is see-through.
const ICONS = {
  linkedin: [
    "................",
    "..kkkkkkkkkkkk..",
    ".kkkkkkkkkkkkkk.",
    ".kkwwkkkkkkkkkk.",
    ".kkwwkkkkkkkkkk.",
    ".kkkkkkkkkkkkkk.",
    ".kkwwkwwkwwwkkk.",
    ".kkwwkwwwwwwwkk.",
    ".kkwwkwwkkkwwkk.",
    ".kkwwkwwkkkwwkk.",
    ".kkwwkwwkkkwwkk.",
    ".kkwwkwwkkkwwkk.",
    ".kkwwkwwkkkwwkk.",
    ".kkkkkkkkkkkkkk.",
    "..kkkkkkkkkkkk..",
    "................",
  ],
  github: [
    "................",
    "..k..........k..",
    "..kk........kk..",
    "..kkkkkkkkkkkk..",
    ".kkkkkkkkkkkkkk.",
    ".kkkkkkkkkkkkkk.",
    ".kkkppkkkkppkkk.",
    ".kkkppkkkkppkkk.",
    ".kkkkkkkkkkkkkk.",
    "..kkkkkkkkkkkk..",
    "...kkkkkkkkkk...",
    ".k....kkkk......",
    "..k..kkkkkk.....",
    "...kkkkkkkk.....",
    "......k..k......",
    "................",
  ],
  leetcode: [
    "................",
    ".........kk.....",
    "........kk......",
    ".......kk.......",
    "......kk........",
    ".....kk.........",
    "....kk..........",
    "...kk...oooooo..",
    "...kk...oooooo..",
    "....kk..........",
    ".....kk.........",
    "......kk.....kk.",
    ".......kkkkkkk..",
    "........kkkkk...",
    "................",
    "................",
  ],
};

// Same trick as the project icons: each run of same-colored pixels in a row
// becomes one <rect>; crispEdges keeps the pixels sharp at any size.
function iconSvg(id) {
  const rows = ICONS[id];
  const rects = rows.map((row, y) => {
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
  return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">${rects.join("")}</svg>`;
}

// ---------- the window ----------
// A real link opens in a new tab; LeetCode is a plain <span> until it has one,
// so it can't be clicked or tabbed to.
document.getElementById("social-list").innerHTML = SOCIALS.map((s) => {
  const inner = `
    <span class="social__orb">${iconSvg(s.id)}${s.href ? '<i class="social__dot" aria-hidden="true"></i>' : '<i class="social__soon" aria-hidden="true">soon</i>'}</span>
    <span class="social__name">${s.name}</span>
    <span class="social__handle">${s.handle}</span>`;
  return `<li>${s.href
    ? `<a class="social social--${s.id}" href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${s.name} (opens in a new tab)">${inner}</a>`
    : `<span class="social social--${s.id} is-soon" aria-label="${s.name}, link coming soon">${inner}</span>`}</li>`;
}).join("");

const online = SOCIALS.filter((s) => s.href).length;
document.getElementById("social-status").textContent =
  `${online} online · ${SOCIALS.length - online} loading`;

// ---------- the desktop preview ----------
document.querySelector(".pv--socials .pv__body").innerHTML = SOCIALS.map(
  (s) => `<i class="pv__orb pv__orb--${s.id}">${iconSvg(s.id)}</i>`
).join("");
