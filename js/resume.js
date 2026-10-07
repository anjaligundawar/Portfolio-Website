// Resume window: "View resume" (or clicking the paper) pops up the full page in a
// sub-window; the Download buttons are plain links with the `download` attribute,
// so the browser saves the PDF instead of navigating to it.

const win = document.getElementById("resume");
const sub = document.getElementById("resume-sub");
let opener = null;

function openSub(from) {
  opener = from;
  sub.hidden = false;
  win.toggleAttribute("data-locked", true); // tells windows.js not to switch windows
  sub.querySelector(".sub__body").scrollTop = 0;
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

["resume-view", "resume-peek"].forEach((id) => {
  const btn = document.getElementById(id);
  btn.addEventListener("click", () => openSub(btn));
});
sub.querySelector(".sub__close").addEventListener("click", closeSub);
sub.querySelector(".sub__backdrop").addEventListener("click", closeSub);
// Esc closes the viewer first (capture runs before windows.js's own Esc handler)
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !sub.hidden) {
    e.stopImmediatePropagation();
    closeSub();
  }
}, true);
// closing the Resume window also closes the viewer
win.querySelector(".win__close").addEventListener("click", closeSub);
