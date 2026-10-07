// ------------------------------------------------------------
// Image -> ASCII
// The trick: shrink the image down so that 1 pixel = 1 character,
// read each pixel's brightness, and pick a character whose "ink
// density" matches it (a space is empty, @ is full).
// ------------------------------------------------------------

// sparse -> dense
export const RAMP = " .,:;-~=+*cox#%&@";

// Monospace characters are taller than they are wide (~0.6 : 1).
// We squash the sample grid vertically so the art isn't stretched.
export const CHAR_ASPECT = 0.6;

/**
 * @param {CanvasImageSource} source  an <img>, <canvas>, or <video>
 * @param {number} cols               characters per line
 * @param {object} opts
 *   onDark:   true when the characters are light on a dark screen, so
 *             bright pixels get the densest characters.
 *   equalize: true (default) spreads a photo's tones evenly over the ramp.
 *             false uses a plain min/max stretch plus `contrast`, which
 *             suits flat black-on-white images like lettering.
 * @returns {{cols:number, rows:number, lines:string[]}}
 */
export function imageToAscii(source, cols, opts = {}) {
  const { ramp = RAMP, onDark = false, gamma = 1, equalize = true, contrast = 1, crop } = opts;
  const sw = crop?.w ?? source.width;
  const sh = crop?.h ?? source.height;
  const rows = Math.round((sh / sw) * cols * CHAR_ASPECT);

  // 1. draw the image tiny: one pixel per character cell.
  //    Transparent areas (a removed background) stay transparent.
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, crop?.x ?? 0, crop?.y ?? 0, sw, sh, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows);

  // 2. brightness per pixel (perceptual luminance weights)
  const n = cols * rows;
  const lum = new Float32Array(n);
  const solid = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    lum[i] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    solid[i] = data[i * 4 + 3] > 128 ? 1 : 0;
  }

  // 3. turn brightness into a 0..1 "level"
  const level = new Float32Array(n);
  if (equalize) {
    // histogram equalisation: rank every visible pixel by brightness, so
    // the full range of characters gets used. This is what brings out
    // eyes, nose and mouth instead of one flat blob.
    const order = [...Array(n).keys()].filter((i) => solid[i]).sort((p, q) => lum[p] - lum[q]);
    order.forEach((i, rank) => (level[i] = rank / Math.max(1, order.length - 1)));
  } else {
    let min = 1, max = 0;
    for (let i = 0; i < n; i++) if (solid[i]) { min = Math.min(min, lum[i]); max = Math.max(max, lum[i]); }
    for (let i = 0; i < n; i++) {
      const l = (lum[i] - min) / (max - min || 1);
      level[i] = Math.min(1, Math.max(0, (l - 0.5) * contrast + 0.5));
    }
  }

  // 4. map each level to a character
  const lines = [];
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      if (!solid[i]) { line += " "; continue; }
      const l = Math.pow(level[i], gamma);
      const density = onDark ? l : 1 - l;
      // in a photo, never a space inside the figure, so the silhouette stays solid
      const k = equalize ? 1 + Math.floor(density * (ramp.length - 1)) : Math.floor(density * ramp.length);
      line += ramp[Math.min(ramp.length - 1, k)];
    }
    lines.push(line);
  }
  return { cols, rows, lines };
}

/** Render text in any web font, then convert it to ASCII. */
export function textToAscii(text, font, cols, { ramp = " .:*#@", weight = 0 } = {}) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.font = font;
  const m = ctx.measureText(text);
  const pad = 8 + weight;
  c.width = Math.ceil(m.width) + pad * 2;
  c.height = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = font; // resizing a canvas resets its state
  ctx.fillStyle = "#000";
  ctx.fillText(text, pad, pad + m.actualBoundingBoxAscent);
  if (weight) {
    // thicken thin strokes so they survive the low resolution
    ctx.lineWidth = weight;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.strokeText(text, pad, pad + m.actualBoundingBoxAscent);
  }
  return imageToAscii(c, cols, { ramp, equalize: false, contrast: 1.6 }).lines
    .filter((l) => l.trim()) // drop empty rows
    .join("\n");
}
