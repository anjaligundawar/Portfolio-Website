// ------------------------------------------------------------
// Pixel-art handheld, drawn on a tiny canvas (180 x 90 "pixels")
// and scaled up with `image-rendering: pixelated`, so every art
// pixel becomes a crisp square block on screen.
//
// The body canvas paints the shell and each button's "socket"
// (the dark edge underneath). Each button cap is its own little
// canvas inside an HTML element, so it can sink into the socket
// when pressed (see .btn in style.css and pressable() in main.js).
//
// The screen is NOT painted here either: it's real HTML laid on
// top, positioned with the same pixel coordinates (see SCREEN).
// ------------------------------------------------------------

export const W = 180;
export const H = 90;

// screen rectangle in art pixels (shared with the HTML overlay)
export const SCREEN = { x: 39, y: 9, w: 102, h: 58 };

// read colors from the CSS tokens so there is one source of truth
function palette() {
  const css = getComputedStyle(document.documentElement);
  const v = (n) => css.getPropertyValue(`--${n}`).trim();
  return {
    ink: v("ink"), deep: v("violet-deep"), lav: v("lavender"), lavLight: v("lavender-light"),
    shade: v("pink-shade"), magenta: v("magenta"), pink: v("pink"), blush: v("blush"), bgAlt: v("bg-alt"),
  };
}

// little pixel-drawing kit bound to one canvas context
function kit(g) {
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  // A rounded rectangle made of whole pixels: each row is inset a bit
  // near the corners, which gives the stepped "pixel" curve.
  const round = (x, y, w, h, r, col) => {
    for (let j = 0; j < h; j++) {
      const d = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0;
      const inset = d ? Math.round(r - Math.sqrt(r * r - (d - 0.5) ** 2)) : 0;
      px(x + inset, y + j, w - inset * 2, 1, col);
    }
  };
  const circle = (cx, cy, r, col) => round(cx - r, cy - r, r * 2, r * 2, r, col);
  return { px, round, circle };
}

// Every button: where its cap sits (art pixels), how to draw the cap,
// and how to draw the socket it sinks into. `kind: "stick"` caps can
// also be pushed around while held.
export const BUTTONS = [
  { id: "minus", x: 26, y: 8, w: 6, h: 2,
    cap: (k, c) => k.px(0, 0, 6, 2, c.shade),
    socket: (k, c) => k.px(26, 9, 6, 2, c.deep) },
  { id: "plus", x: 148, y: 6, w: 6, h: 6,
    cap: (k, c) => { k.px(0, 2, 6, 2, c.shade); k.px(2, 0, 2, 6, c.shade); },
    socket: (k, c) => { k.px(148, 9, 6, 2, c.deep); k.px(150, 7, 2, 6, c.deep); } },
  { id: "stick-l", kind: "stick", x: 13, y: 18, w: 14, h: 14,
    cap: (k, c) => { k.circle(7, 7, 7, c.lav); k.circle(7, 6, 5, c.lavLight); k.px(5, 3, 3, 1, c.blush); },
    socket: (k, c) => k.circle(20, 26, 7, c.deep) },
  { id: "stick-r", kind: "stick", x: 153, y: 43, w: 14, h: 14,
    cap: (k, c) => { k.circle(7, 7, 7, c.lav); k.circle(7, 6, 5, c.lavLight); k.px(5, 3, 3, 1, c.blush); },
    socket: (k, c) => k.circle(160, 51, 7, c.deep) },
  // d-pad: four arms that press separately around a fixed centre
  ...[["up", 18, 46], ["down", 18, 56], ["left", 13, 51], ["right", 23, 51]].map(([dir, x, y]) => ({
    id: `dpad-${dir}`, x, y, w: 5, h: 5,
    cap: (k, c) => k.px(0, 0, 5, 5, c.lavLight),
    socket: (k, c) => k.px(x, y + 2, 5, 5, c.lav),
  })),
  // A B X Y
  ...[["x", 157, 15], ["y", 151, 21], ["a", 163, 21], ["b", 157, 27]].map(([id, x, y]) => ({
    id: `btn-${id}`, x, y, w: 6, h: 6,
    cap: (k, c) => k.round(0, 0, 6, 6, 2, c.lavLight),
    socket: (k, c) => k.round(x, y + 1, 6, 6, 2, c.lav),
  })),
  { id: "capture", x: 26, y: 66, w: 4, h: 4,
    cap: (k, c) => { k.px(0, 0, 4, 4, c.shade); k.px(1, 1, 2, 2, c.lav); },
    socket: (k, c) => k.px(26, 67, 4, 4, c.deep) },
  { id: "home", x: 149, y: 65, w: 6, h: 6,
    cap: (k, c) => { k.circle(3, 3, 3, c.shade); k.circle(3, 3, 2, c.lav); },
    socket: (k, c) => k.circle(152, 69, 3, c.deep) },
];

export function drawConsole(canvas) {
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  const c = palette();
  const k = kit(g);
  const { px, round } = k;

  // ---- speckled glow under the console (dither instead of blur) ----
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 81; y < H; y++) {
    const t = (y - 81) / (H - 81);             // 0 at top -> 1 at bottom
    const spread = 80 - t * 20;
    for (let x = Math.round(90 - spread); x < 90 + spread; x++) {
      const edge = Math.abs(x - 90) / spread;  // fade towards the sides too
      if (rand() < (1 - t) * (1 - edge) * 0.8) px(x, y, 1, 1, c.deep);
    }
  }

  // ---- body: extruded edge, shading step, flat face, highlights ----
  const B = { x: 2, y: 0, w: 176, h: 76, r: 16 };
  round(B.x, B.y + 5, B.w, B.h, B.r, c.deep);          // thick bottom edge
  round(B.x, B.y, B.w, B.h, B.r, c.shade);             // shading step
  round(B.x, B.y, B.w - 1, B.h - 3, B.r, c.pink);      // flat front face
  px(B.x + B.r, 1, B.w - B.r * 2, 1, c.blush);         // top highlight
  px(B.x + 2, B.r, 1, B.h - B.r * 2 - 2, c.blush);     // left highlight

  // ---- screen bezel: lighter rim, dark inner edge, dark glass ----
  const S = SCREEN;
  round(S.x - 5, S.y - 5, S.w + 10, S.h + 10, 3, c.blush);
  round(S.x - 3, S.y - 3, S.w + 6, S.h + 6, 2, c.shade);
  px(S.x - 1, S.y - 1, S.w + 2, S.h + 2, c.deep);
  px(S.x, S.y, S.w, S.h, c.bgAlt);

  // ---- button sockets + the fixed d-pad centre ----
  for (const b of BUTTONS) b.socket(k, c);
  px(18, 51, 5, 5, c.lavLight);
  px(19, 52, 3, 3, c.lav);

  // power LED: the one magenta "energy" pixel
  px(12, 67, 3, 3, c.magenta);
}

/** Paint one button's cap into its own small canvas. */
export function drawCap(canvas, button) {
  canvas.width = button.w;
  canvas.height = button.h;
  button.cap(kit(canvas.getContext("2d")), palette());
}
