// ------------------------------------------------------------
// Anjali's game character as a sprite sheet.
//
// assets/sprite-sheet.png holds every frame, each 34 x 46 pixels,
// laid out left to right, 8 per row. SEQUENCE lists which frame to
// show and for how many milliseconds, in order, then loops.
//
// Frames 0-7: idle, breathe, crouch, take-off, rising, top of jump,
// falling, landing. 8 is her front view (the turn between the two
// facings), 9-16 are the same moves facing the other way, and
// 17-19 are side, back, other side: she spins all the way round
// to face the first way again, so the loop never jumps.
// ------------------------------------------------------------

export const SHEET = "assets/sprite-sheet.png";
export const FRAME_W = 34;
export const FRAME_H = 46;
export const PER_ROW = 8;

// [frame index, milliseconds]
export const SEQUENCE = [
  [0, 260],
  [1, 260],
  [0, 260],
  [1, 260],
  [0, 260],
  [1, 260],
  [2, 110],
  [3, 70],
  [4, 80],
  [5, 160],
  [6, 80],
  [7, 70],
  [2, 120],
  [0, 220],
  [8, 300],
  [9, 260],
  [10, 260],
  [9, 260],
  [10, 260],
  [9, 260],
  [10, 260],
  [11, 110],
  [12, 70],
  [13, 80],
  [14, 160],
  [15, 80],
  [16, 70],
  [11, 120],
  [9, 220],
  [17, 110],
  [18, 200],
  [19, 110],
];

/** Load the sheet and cut it into one ImageData per frame. */
export async function loadFrames() {
  const img = new Image();
  img.src = SHEET;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const count = (img.width / FRAME_W) * (img.height / FRAME_H);
  return Array.from({ length: count }, (_, i) =>
    ctx.getImageData((i % PER_ROW) * FRAME_W, Math.floor(i / PER_ROW) * FRAME_H, FRAME_W, FRAME_H));
}
