// ------------------------------------------------------------
// Scroll-driven "exploded view" for pixel art (or ASCII art).
// Every pixel becomes a particle with a home position and a
// random flight path. render(p) places each one at
//    home + direction * distance * ease(p)
// so p = 0 is the assembled picture, p = 1 is fully blown apart,
// and scrolling back simply runs the same maths backwards.
// ------------------------------------------------------------
import { CHAR_ASPECT } from "./ascii.js";

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Deterministic random numbers, so the explosion looks the same every time.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Explosion {
  constructor(canvas, { color = "#F2A8F0", reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.color = color; // used for ASCII characters
    this.reducedMotion = reducedMotion;
    this.particles = [];
  }

  /**
   * Pixel art from an ImageData (e.g. one sprite-sheet frame).
   * Every non-transparent pixel becomes a square particle; the
   * picture sits on the bottom edge of the box.
   */
  setImageData({ width, height, data }) {
    this.mode = "pixels";
    this.cellAspect = 1;
    this.build(width, height, (x, y) => {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) return null;
      return { color: `rgb(${data[i]} ${data[i + 1]} ${data[i + 2]})` };
    });
  }

  /** ASCII art: rows of characters, drawn as text, centred in the box. */
  setAscii(lines) {
    this.mode = "ascii";
    this.cellAspect = CHAR_ASPECT;
    this.build(lines[0].length, lines.length, (x, y) => (lines[y][x] === " " ? null : { ch: lines[y][x] }));
  }

  build(cols, rows, cellAt) {
    const rand = mulberry32(7);
    this.rows = rows;
    this.cols = cols;
    this.particles = [];
    const cx = this.cols / 2, cy = this.rows / 2;
    const maxR = Math.hypot(cx, cy / this.cellAspect);
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = cellAt(x, y);
        if (!cell) continue;
        // direction: away from the centre, with a bit of random wobble
        const dx = x - cx, dy = (y - cy) / this.cellAspect;
        const r = Math.hypot(dx, dy) || 1;
        const angle = Math.atan2(dy, dx) + (rand() - 0.5) * 1.1;
        this.particles.push({
          ...cell, gx: x, gy: y,
          dirX: Math.cos(angle),
          dirY: Math.sin(angle),
          dist: 0.45 + rand() * 0.7,           // fraction of the screen diagonal
          spin: (rand() - 0.5) * Math.PI * 4,  // total rotation in radians
          // outer pixels leave first, the centre goes last
          delay: (1 - r / maxR) * 0.35 + rand() * 0.1,
        });
      }
    }
  }

  /** Match the canvas to the viewport, accounting for high-DPI screens. */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
  }

  /**
   * @param {DOMRect} box  where the assembled art should sit (viewport coords)
   * @param {number} p     explode progress 0..1
   */
  render(box, p) {
    const { ctx, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (p >= 1 || !this.particles.length) return;

    // fit the grid inside the box, keeping its proportions
    const pixels = this.mode === "pixels";
    let cw = Math.min(box.width / this.cols, (box.height / this.rows) * this.cellAspect);
    if (pixels) cw = Math.floor(cw * dpr) / dpr; // whole device pixels = crisp edges
    const chH = cw / this.cellAspect;
    const ox = Math.round((box.left + (box.width - cw * this.cols) / 2) * dpr) / dpr;
    const oy = Math.round((pixels
      ? box.bottom - chH * this.rows                     // sit on the bottom edge
      : box.top + (box.height - chH * this.rows) / 2     // centred
    ) * dpr) / dpr;
    const diag = Math.hypot(this.w, this.h);

    if (!pixels) {
      ctx.font = `700 ${chH}px ui-monospace, "Courier New", monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle = this.color;
    }
    // a pixel draws as a square, a character as text
    const draw = pixels
      ? (q) => { ctx.fillStyle = q.color; ctx.fillRect(-cw / 2, -chH / 2, cw, chH); }
      : (q) => ctx.fillText(q.ch, -cw / 2, -chH / 2);

    for (const q of this.particles) {
      // each particle has its own start delay, so it runs on a local 0..1
      const t = this.reducedMotion ? 0 : easeInOutCubic(clamp01((p - q.delay) / (1 - q.delay) * 1.3));
      const x = ox + (q.gx + 0.5) * cw + q.dirX * q.dist * diag * t;
      const y = oy + (q.gy + 0.5) * chH + q.dirY * q.dist * diag * t;
      const a = q.spin * t;
      const s = 1 - t * 0.35; // shrink a little while flying
      ctx.globalAlpha = this.reducedMotion ? 1 - p : 1 - smooth(0.68, 1, t);
      // setTransform = translate + rotate + scale in one call (cheap)
      const cos = Math.cos(a) * s * dpr, sin = Math.sin(a) * s * dpr;
      ctx.setTransform(cos, sin, -sin, cos, x * dpr, y * dpr);
      draw(q);
    }
    ctx.globalAlpha = 1;
  }
}
