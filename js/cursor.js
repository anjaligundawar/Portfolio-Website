// Fading trail of pixel arrows behind the mouse, on the console start page
// only. The real cursor itself is plain CSS (css/cursor.css); the trail is a
// small pool of <div>s showing the same image. Each time the mouse has moved
// far enough, the oldest one is moved to where the cursor is and its fade
// animation restarts, so we never create elements while the mouse moves.

const COUNT = 10; // ghosts in the pool
const GAP = 14; // px the mouse has to travel before the next ghost drops
const HOT = 2; // the arrow's tip inside the image (see css/cursor.css)

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const pool = Array.from({ length: COUNT }, () => {
    const el = document.createElement("div");
    el.className = "cursor-trail";
    el.setAttribute("aria-hidden", "true");
    document.body.append(el);
    return el;
  });
  let next = 0;
  let last = null; // where the previous ghost dropped

  addEventListener("pointermove", (e) => {
    // mouse only (no trail under a finger), and not once we're inside the
    // console screen with the stacked windows
    // (and none at all in professional mode)
    if (e.pointerType !== "mouse" || document.body.classList.contains("in-screen") ||
        document.documentElement.dataset.mode === "pro") {
      last = null;
      return;
    }
    if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < GAP) return;
    last = { x: e.clientX, y: e.clientY };

    const el = pool[next];
    next = (next + 1) % COUNT;
    const at = `translate(${e.clientX - HOT}px, ${e.clientY - HOT}px)`;
    el.style.setProperty("--at", at);
    el.style.transform = at;
    // restart the fade: drop the class, force a style flush, add it back
    el.classList.remove("is-on");
    void el.offsetWidth;
    el.classList.add("is-on");
  }, { passive: true });
}
