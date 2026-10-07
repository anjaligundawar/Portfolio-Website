"""Draws the "AG" pixel emblem used on the About Me preview card.

Run from this folder:  python3 build.py
Writes ../../assets/ag-logo.svg (one <rect> per horizontal run of a color,
shape-rendering="crispEdges" so it stays sharp at any size).
"""
import math

C = {  # site palette (css/tokens.css)
    "k": "#2B2235",  # ink
    "m": "#E05FC6",  # magenta
    "p": "#F2A8F0",  # pink
    "s": "#D58AE6",  # orchid shade
    "b": "#F9CDEB",  # blush
    "l": "#B9A6F2",  # light lavender
    "v": "#9A80C2",  # lavender
    "o": "#6E48C8",  # bright violet
    "d": "#4E3F6E",  # deep violet
    "w": "#F3F0F8",  # soft white
}
N = 40
g = [[None] * N for _ in range(N)]

def put(x, y, c):
    if 0 <= x < N and 0 <= y < N:
        g[y][x] = c

# ---- round badge: ink rim, magenta ring with pink studs, dithered lavender face
cx = cy = 19.5
for y in range(N):
    for x in range(N):
        r = math.hypot(x - cx, y - cy)
        ang = math.atan2(y - cy, x - cx)
        if r <= 18.6: put(x, y, "k")
        if r <= 17.6:
            # ring: blush highlight on the top-left, magenta elsewhere, darker bottom-right
            put(x, y, "b" if -2.9 < ang < -1.7 else ("s" if 0.3 < ang < 1.6 else "m"))
        if r <= 15.2: put(x, y, "k")
        if r <= 14.2:
            # face: light lavender, checker-dithered into lavender towards the bottom
            shade = (y - 6) / 28
            dither = (x + y) % 2 == 0
            put(x, y, "v" if (shade > 0.62 or (shade > 0.42 and dither)) else "l")
        if 14.2 < r <= 14.9 and -2.6 < ang < -1.9:
            put(x, y, "w")  # glint on the inner rim
# studs around the ring
for i in range(12):
    a = i * math.pi / 6
    put(round(cx + 16.4 * math.cos(a)), round(cy + 16.4 * math.sin(a)), "p")

# ---- "AG" monogram: two-tone fill, ink outline, violet drop shadow
A = ["..XXXX..", ".XXXXXX.", "XXX..XXX", "XX....XX", "XX....XX",
     "XXXXXXXX", "XXXXXXXX", "XX....XX", "XX....XX", "XX....XX"]
G = [".XXXXXX.", "XXXXXXXX", "XX......", "XX......", "XX..XXXX",
     "XX..XXXX", "XX....XX", "XX....XX", "XXXXXXXX", ".XXXXXX."]
ox, oy = 11, 11
letters = set()
for gx, glyph in ((ox, A), (ox + 10, G)):
    for j, row in enumerate(glyph):
        for i, ch in enumerate(row):
            if ch == "X": letters.add((gx + i, oy + j))
outline = {(x + dx, y + dy) for x, y in letters for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - letters
shadow = {(x + 1, y + 1) for x, y in outline | letters} - outline - letters
for x, y in shadow: put(x, y, "o")
for x, y in outline: put(x, y, "k")
for x, y in letters: put(x, y, "s" if y - oy >= 6 else "p")
for x, y in letters:  # tiny highlight on the top-left of each stroke
    if (x - 1, y) not in letters and (x, y - 1) not in letters: put(x, y, "w")

# ---- little heart under the letters
H = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."]
hx, hy = 16, 25
heart = {(hx + i, hy + j) for j, r in enumerate(H) for i, ch in enumerate(r) if ch == "X"}
for x, y in {(x + dx, y + dy) for x, y in heart for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - heart:
    put(x, y, "k")
for x, y in heart: put(x, y, "m")
put(hx + 1, hy + 1, "w")

# ---- 4-point sparkles in the corners
def sparkle(x, y, big):
    pts = [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]
    if big: pts += [(2, 0), (-2, 0), (0, 2), (0, -2)]
    for dx, dy in pts: put(x + dx, y + dy, "w")
    put(x, y, "p")
sparkle(35, 4, True); sparkle(4, 34, True); sparkle(37, 34, False); sparkle(3, 6, False)

# ---- write SVG (merge runs of the same color on each row)
rects = []
for y in range(N):
    x = 0
    while x < N:
        c = g[y][x]
        if c is None: x += 1; continue
        x2 = x
        while x2 + 1 < N and g[y][x2 + 1] == c: x2 += 1
        rects.append(f'<rect x="{x}" y="{y}" width="{x2 - x + 1}" height="1" fill="{C[c]}"/>')
        x = x2 + 1
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N} {N}" shape-rendering="crispEdges">'
       + "".join(rects) + "</svg>\n")
open("../../assets/ag-logo.svg", "w").write(svg)
print(len(rects), "rects,", len(svg), "bytes")
