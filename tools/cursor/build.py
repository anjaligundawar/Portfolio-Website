"""Cut sylvy's pixel arrow out of its white background and save cursor PNGs.

    python3 build.py cursor-source.png

Writes ../../assets/cursor.png (32px tall) and cursor@2x.png (64px tall),
plus the hotspot (the arrow tip) for css/cursor.css and js/cursor.js.
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image

src = Image.open(sys.argv[1]).convert("RGB")
W, H = src.size
px = src.load()

# 1. flood-fill the white background from the edges
bg = bytearray(W * H)
q = deque()
for x in range(W):
    q.extend([(x, 0), (x, H - 1)])
for y in range(H):
    q.extend([(0, y), (W - 1, y)])
while q:
    x, y = q.popleft()
    if not (0 <= x < W and 0 <= y < H) or bg[y * W + x]:
        continue
    if min(px[x, y]) < 235:
        continue
    bg[y * W + x] = 1
    q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

# 2. background -> clear; grey anti-aliased pixels next to it are black ink
#    blended over white, so turn their lightness into transparency
out = Image.new("RGBA", (W, H))
o = out.load()
for y in range(H):
    for x in range(W):
        if bg[y * W + x]:
            o[x, y] = (0, 0, 0, 0)
            continue
        r, g, b = px[x, y]
        near_bg = any(
            0 <= x + dx < W and 0 <= y + dy < H and bg[(y + dy) * W + x + dx]
            for dx, dy in ((2, 0), (-2, 0), (0, 2), (0, -2))
        )
        if near_bg and max(r, g, b) - min(r, g, b) < 24:
            o[x, y] = (17, 17, 17, 255 - min(r, g, b))
        else:
            o[x, y] = (r, g, b, 255)

box = out.getbbox()
out = out.crop(box)
print("cropped", box, out.size)

# the arrow tip: the top-most, then left-most opaque pixel of the shape
a = out.getchannel("A").load()
tip = None
for y in range(out.height):
    xs = [x for x in range(out.width) if a[x, y] > 128]
    if xs:
        tip = (xs[0], y)
        break

assets = Path(__file__).resolve().parents[2] / "assets"
for name, h in (("cursor.png", 32), ("cursor@2x.png", 64)):
    w = round(out.width * h / out.height)
    # resize in premultiplied alpha so the edges don't pick up a white fringe
    small = out.convert("RGBa").resize((w, h), Image.LANCZOS).convert("RGBA")
    small.save(assets / name, optimize=True)
    print(name, small.size, "hotspot", round(tip[0] * h / out.height), round(tip[1] * h / out.height))
